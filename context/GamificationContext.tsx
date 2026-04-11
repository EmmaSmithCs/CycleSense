// context/GamificationContext.tsx

import { auth, db } from '@/firebase/config';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Badge = {
    id: string;
    emoji: string;
    label: string;
    description: string;
    earned: boolean;
};

type GamificationContextType = {
    gamificationEnabled: boolean;
    setGamificationEnabled: (value: boolean) => void;
    streak: number;
    totalLogs: number;
    badges: Badge[];
    refreshGamification: () => Promise<void>;
};

const GamificationContext = createContext<GamificationContextType>({
    gamificationEnabled: false,
    setGamificationEnabled: () => {},
    streak: 0,
    totalLogs: 0,
    badges: [],
    refreshGamification: async () => {},
});

export function GamificationProvider({ children }: { children: React.ReactNode }) {
    const [gamificationEnabled, setGamificationEnabled] = useState(false);
    const [streak, setStreak] = useState(0);
    const [totalLogs, setTotalLogs] = useState(0);
    const [badges, setBadges] = useState<Badge[]>([]);

    // CHANGED: Single function that fetches both the enabled flag AND log data.
    // Called on mount and whenever a screen triggers a refresh (e.g. on focus).
    const refreshGamification = useCallback(async () => {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch enabled preference from Firestore
        const snap = await getDoc(doc(db, 'users', user.uid));
        const enabled = snap.exists() ? (snap.data().gamificationEnabled ?? false) : false;
        setGamificationEnabled(enabled);

        // No point fetching logs if the feature is off
        if (!enabled) return;

        // Fetch all daily logs
        const logsRef = collection(db, 'users', user.uid, 'dailyLogs');
        const snapshot = await getDocs(logsRef);
        const logDates = new Set(snapshot.docs.map((d) => d.id));
        const total = snapshot.docs.length;
        setTotalLogs(total);

        // Calculate current streak by walking back from today
        let count = 0;
        const cursor = new Date();
        while (true) {
            const dateStr = cursor.toISOString().split('T')[0];
            if (logDates.has(dateStr)) {
                count++;
                cursor.setDate(cursor.getDate() - 1);
            } else {
                break;
            }
        }
        setStreak(count);

        // Evaluate badges against latest data
        setBadges([
            {
                id: 'first_log',
                emoji: '🌱',
                label: 'First Log',
                description: 'Logged your first day',
                earned: total >= 1,
            },
            {
                id: 'consistent',
                emoji: '💪',
                label: 'Consistent',
                description: 'Logged 3 days in a row',
                earned: count >= 3,
            },
            {
                id: 'week_streak',
                emoji: '🔥',
                label: '7-Day Streak',
                description: 'Logged 7 days in a row',
                earned: count >= 7,
            },
            {
                id: 'dedicated',
                emoji: '🏆',
                label: 'Dedicated',
                description: 'Logged 14 days in a row',
                earned: count >= 14,
            },
            {
                id: 'month_logger',
                emoji: '📅',
                label: 'Month Logger',
                description: 'Logged 30 or more days total',
                earned: total >= 30,
            },
            {
                id: 'century',
                emoji: '💯',
                label: 'Century',
                description: 'Logged 100 days total',
                earned: total >= 100,
            },
        ]);
    }, []);

    // Fetch once on mount
    useEffect(() => {
        refreshGamification();
    }, [refreshGamification]);

    return (
        <GamificationContext.Provider
            value={{
                gamificationEnabled,
                setGamificationEnabled,
                streak,
                totalLogs,
                badges,
                refreshGamification,
            }}
        >
            {children}
        </GamificationContext.Provider>
    );
}

export function useGamification() {
    return useContext(GamificationContext);
}
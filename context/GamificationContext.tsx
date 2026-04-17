// app/context/GamificationContext.tsx

/*
    This file defines the GamificationContext.
    It provides a way to manage and access gamification-related data such as logging streaks, total logs, and earned badges across the app.

    Key features:
    - Uses React Context to provide gamification data and functions to all components in the app.
    - Fetches gamification data from Firestore based on the current user's logs and preferences.
    - Calculates the current logging streak and total logs to determine which badges the user has earned.

*/

// Imports
import { auth, db } from '@/firebase/config';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

// Define the type for badges in the gamification system
export type Badge = {
    id: string; // Unique identifier for the badge
    emoji: string; // Emoji representing the badge
    label: string; // Short label for the badge
    description: string; // Description of how to earn the badge
    earned: boolean; // Whether the user has earned this badge
};

// Define the context type for gamification features
type GamificationContextType = {
    gamificationEnabled: boolean; // Whether the gamification feature is enabled
    setGamificationEnabled: (value: boolean) => void; // Function to update the gamification enabled setting
    streak: number; // Current logging streak
    totalLogs: number; // Total number of logged days
    badges: Badge[]; // List of available badges
    refreshGamification: () => Promise<void>; // Function to refresh the gamification data
};

// Create the context with default values
const GamificationContext = createContext<GamificationContextType>({
    gamificationEnabled: false,
    setGamificationEnabled: () => {},
    streak: 0,
    totalLogs: 0,
    badges: [],
    refreshGamification: async () => {},
});

// Provider component to wrap the app and provide gamification context
export function GamificationProvider({ children }: { children: React.ReactNode }) {

    // State variables for gamification data
    const [gamificationEnabled, setGamificationEnabled] = useState(false);
    const [streak, setStreak] = useState(0);
    const [totalLogs, setTotalLogs] = useState(0);
    const [badges, setBadges] = useState<Badge[]>([]);

    // Function to refresh gamification data by fetching from Firestore and calculating streaks and badges
    const refreshGamification = useCallback(async () => {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch enabled preference from Firestore
        const snap = await getDoc(doc(db, 'users', user.uid));
        const enabled = snap.exists() ? (snap.data().gamificationEnabled ?? false) : false;
        setGamificationEnabled(enabled);

        // If gamification is not enabled, skip fetching logs and calculating badges
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

            // First log badge is earned if total logs is at least 1
            {
                id: 'first_log',
                emoji: '🌱',
                label: 'First Log',
                description: 'Logged your first day',
                earned: total >= 1,
            },

            // Consistent badge is earned if current streak is at least 3
            {
                id: 'consistent',
                emoji: '💪',
                label: 'Consistent',
                description: 'Logged 3 days in a row',
                earned: count >= 3,
            },

            // Week streak badge is earned if current streak is at least 7
            {
                id: 'week_streak',
                emoji: '🔥',
                label: '7-Day Streak',
                description: 'Logged 7 days in a row',
                earned: count >= 7,
            },

            // Dedicated badge is earned if current streak is at least 14
            {
                id: 'dedicated',
                emoji: '🏆',
                label: 'Dedicated',
                description: 'Logged 14 days in a row',
                earned: count >= 14,
            },

            // Month logger badge is earned if total logs is at least 30
            {
                id: 'month_logger',
                emoji: '📅',
                label: 'Month Logger',
                description: 'Logged 30 or more days total',
                earned: total >= 30,
            },

            // Century badge is earned if total logs is at least 100
            {
                id: 'century',
                emoji: '💯',
                label: 'Century',
                description: 'Logged 100 days total',
                earned: total >= 100,
            },
        ]);
    }, []);

    // Fetch once on mount to initialize gamification data
    useEffect(() => {
        refreshGamification();
    }, [refreshGamification]);

    // Return the context provider with the current gamification data and functions
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

// Custom hook to use the GamificationContext in components
export function useGamification() {
    return useContext(GamificationContext);
}
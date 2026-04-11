// components/StreakWidget.tsx

import { useGamification } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function StreakWidget() {
    const { theme } = useTheme();
    const c = theme.colors;

    // CHANGED: streak and gamificationEnabled both come from context now
    const { gamificationEnabled, streak } = useGamification();

    // Hide entirely when gamification is off
    if (!gamificationEnabled) return null;

    return (
        <View style={[styles.container, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={styles.fire}>🔥</Text>
            <View>
                <Text style={[styles.streakCount, { color: c.primary }]}>{streak}-day streak</Text>
                <Text style={[styles.streakSub, { color: c.textMuted }]}>
                    {streak === 0
                        ? 'Log today to start your streak!'
                        : streak === 1
                        ? 'Great start — keep it up!'
                        : 'Keep logging daily!'}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        marginTop: 12,
        marginBottom: 4,
    },
    fire: {
        fontSize: 28,
    },
    streakCount: {
        fontSize: 16,
        fontWeight: '700',
    },
    streakSub: {
        fontSize: 12,
        marginTop: 2,
    },
});
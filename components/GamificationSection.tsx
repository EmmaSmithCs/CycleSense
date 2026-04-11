// components/GamificationSection.tsx
// CHANGED: No longer fetches its own Firestore data. Reads streak, totalLogs,
// and badges directly from GamificationContext so all gamification components
// stay in sync and update whenever refreshGamification() is called.

import { useGamification } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function GamificationSection() {
    const { theme } = useTheme();
    const c = theme.colors;

    // CHANGED: All data comes from context — no local Firestore fetch needed
    const { gamificationEnabled, streak, totalLogs, badges } = useGamification();

    // Show a disabled state card when gamification is turned off
    if (!gamificationEnabled) {
        return (
            <View style={[styles.disabledCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={styles.disabledEmoji}>🏅</Text>
                <Text style={[styles.disabledTitle, { color: c.textMuted }]}>Achievements are turned off</Text>
                <Text style={[styles.disabledHint, { color: c.textMuted }]}>
                    Enable "Streaks & Badges" in Settings to track your progress.
                </Text>
            </View>
        );
    }

    const earned = badges.filter((b) => b.earned);
    const locked = badges.filter((b) => !b.earned);

    return (
        <View>
            {/* Summary row */}
            <View style={[styles.summaryRow, { backgroundColor: c.surface, borderColor: c.border }]}>
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: c.primary }]}>{streak}</Text>
                    <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Day Streak</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: c.primary }]}>{totalLogs}</Text>
                    <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Total Logs</Text>
                </View>
                <View style={[styles.summaryDivider, { backgroundColor: c.border }]} />
                <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: c.primary }]}>{earned.length}</Text>
                    <Text style={[styles.summaryLabel, { color: c.textMuted }]}>Badges</Text>
                </View>
            </View>

            {/* Earned badges */}
            {earned.length > 0 && (
                <View style={styles.badgeSection}>
                    <Text style={[styles.badgeSectionTitle, { color: c.textMuted }]}>Earned</Text>
                    <View style={styles.badgeGrid}>
                        {earned.map((badge) => (
                            <View
                                key={badge.id}
                                style={[styles.badgeCard, { backgroundColor: c.card, borderColor: c.primary }]}
                            >
                                <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                                <Text style={[styles.badgeLabel, { color: c.text }]}>{badge.label}</Text>
                                <Text style={[styles.badgeDesc, { color: c.textMuted }]}>{badge.description}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Locked badges */}
            {locked.length > 0 && (
                <View style={styles.badgeSection}>
                    <Text style={[styles.badgeSectionTitle, { color: c.textMuted }]}>Locked</Text>
                    <View style={styles.badgeGrid}>
                        {locked.map((badge) => (
                            <View
                                key={badge.id}
                                style={[styles.badgeCard, styles.badgeLocked, { backgroundColor: c.surface, borderColor: c.border }]}
                            >
                                <Text style={[styles.badgeEmoji, { opacity: 0.3 }]}>{badge.emoji}</Text>
                                <Text style={[styles.badgeLabel, { color: c.textMuted }]}>{badge.label}</Text>
                                <Text style={[styles.badgeDesc, { color: c.textMuted }]}>{badge.description}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    disabledCard: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 24,
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 8,
    },
    disabledEmoji: {
        fontSize: 32,
        marginBottom: 8,
        opacity: 0.4,
    },
    disabledTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    disabledHint: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    summaryRow: {
        flexDirection: 'row',
        borderRadius: 14,
        borderWidth: 1,
        marginHorizontal: 20,
        marginBottom: 16,
        paddingVertical: 16,
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },
    summaryValue: {
        fontSize: 22,
        fontWeight: '800',
    },
    summaryLabel: {
        fontSize: 11,
        marginTop: 2,
    },
    summaryDivider: {
        width: 1,
        marginVertical: 4,
    },
    badgeSection: {
        marginHorizontal: 20,
        marginBottom: 12,
    },
    badgeSectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    badgeCard: {
        width: '30%',
        borderRadius: 12,
        borderWidth: 1.5,
        padding: 12,
        alignItems: 'center',
        gap: 4,
    },
    badgeLocked: {
        opacity: 0.6,
    },
    badgeEmoji: {
        fontSize: 24,
    },
    badgeLabel: {
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
    },
    badgeDesc: {
        fontSize: 10,
        textAlign: 'center',
        lineHeight: 13,
    },
});
// app/components/GamificationSection.tsx

/*
    This component displays the gamification features of the app.
    It shows the user's current streak, total logs, and badges earned based on their logging activity.
    If gamification is turned off in settings, it displays a message prompting the user to enable it.
    
    Key features:
    - Displays a summary of the user's current streak, total logs, and badges earned.
    - Separates earned and locked badges into different sections for clarity.
    - Uses context to access theme colors and gamification stats for dynamic rendering.
    - Provides a disabled state with a message when gamification is turned off, encouraging users to enable it in settings.
    
*/

// Imports
import { useGamification } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// GamificationSection component that displays the user's current streak, total logs, and badges earned based on their logging activity
export default function GamificationSection() {

    // Get theme colors from context for consistent styling
    const { theme } = useTheme();
    const c = theme.colors;

    // Get gamification stats from context, including whether gamification is enabled, current streak, total logs, and badges earned
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

    // Separate earned and locked badges for display
    const earned = badges.filter((b) => b.earned);
    const locked = badges.filter((b) => !b.earned);

    // Render the gamification section with summary stats and badges earned/locked
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

// Styles
const styles = StyleSheet.create({

    // Style for the disabled state card when gamification is turned off
    disabledCard: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 24,
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 8,
    },

    // Style for the emoji in the disabled state card
    disabledEmoji: {
        fontSize: 32,
        marginBottom: 8,
        opacity: 0.4,
    },

    // Style for the title text in the disabled state card
    disabledTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },

    // Style for the hint text in the disabled state card
    disabledHint: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },

    // Styles for the summary row that displays current streak, total logs, and badges earned
    summaryRow: {
        flexDirection: 'row',
        borderRadius: 14,
        borderWidth: 1,
        marginHorizontal: 20,
        marginBottom: 16,
        paddingVertical: 16,
    },

    // Styles for each summary item (streak, total logs, badges) in the summary row
    summaryItem: {
        flex: 1,
        alignItems: 'center',
    },

    // Style for the value text in each summary item 
    summaryValue: {
        fontSize: 22,
        fontWeight: '800',
    },

    // Style for the label text in each summary item
    summaryLabel: {
        fontSize: 11,
        marginTop: 2,
    },

    // Style for the divider between summary items in the summary row
    summaryDivider: {
        width: 1,
        marginVertical: 4,
    },

    // Styles for the badge section that displays earned and locked badges
    badgeSection: {
        marginHorizontal: 20,
        marginBottom: 12,
    },

    // Style for the title of each badge section (Earned, Locked)
    badgeSectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 10,
        textTransform: 'uppercase',
    },

    // Styles for the grid layout of badges within each badge section
    badgeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },

    // Styles for each badge card
    badgeCard: {
        width: '30%',
        borderRadius: 12,
        borderWidth: 1.5,
        padding: 12,
        alignItems: 'center',
        gap: 4,
    },

    // Styles for locked badges to indicate they are not yet earned
    badgeLocked: {
        opacity: 0.6,
    },

    // Style for the emoji in each badge card
    badgeEmoji: {
        fontSize: 24,
    },

    // Style for the label text in each badge card
    badgeLabel: {
        fontSize: 11,
        fontWeight: '700',
        textAlign: 'center',
    },
    
    // Style for the description text in each badge card
    badgeDesc: {
        fontSize: 10,
        textAlign: 'center',
        lineHeight: 13,
    },
});
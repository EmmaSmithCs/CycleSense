// app/components/StreakWidget.tsx

/*
    This file defines the StreakWidget component.
    The StreakWidget displays the user's current streak of consecutive days logged.

    Key features:
    - Shows a fire emoji to visually represent the streak.
    - Displays the current streak count and a motivational message based on the streak length.
    - Only renders if gamification is enabled in settings, otherwise it returns null to hide the widget.
    
*/

// Imports
import { useGamification } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

// StreakWidget component that displays the user's current streak 
export default function StreakWidget() {

    // Get theme colors from context for consistent styling
    const { theme } = useTheme();
    const c = theme.colors;

    // Get gamification stats from context, including whether gamification is enabled and the current streak count
    const { gamificationEnabled, streak } = useGamification();

    // Hide entirely when gamification is off
    if (!gamificationEnabled) return null;

    // Render the streak widget 
    return (
        <View style={[styles.container, { backgroundColor: c.card, borderColor: c.border }]}>
            {/* Fire emoji to visually represent the streak */ }
            <Text style={styles.fire}>🔥</Text>
            <View>
                {/* Display the current streak count */ }
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

// Styles
const styles = StyleSheet.create({

    // Container for the streak widget
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

    // Style for the fire emoji in the streak widget
    fire: {
        fontSize: 28,
    },

    // Style for the streak count text in the streak widget
    streakCount: {
        fontSize: 16,
        fontWeight: '700',
    },

    // Style for the subtext below the streak count
    streakSub: {
        fontSize: 12,
        marginTop: 2,
    },
});
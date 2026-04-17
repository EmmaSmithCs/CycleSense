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

// Define the props for the StreakWidget component, which includes a boolean indicating whether the user has logged their symptoms for today. This can be used to determine if the streak should be displayed as active or not, and to provide appropriate messaging to encourage daily logging.
type Props = {
    hasLoggedToday: boolean; // Whether the user has logged their symptoms for today, which can be used to determine if the streak should be displayed as active or not
};

// StreakWidget component that displays the user's current streak 
export default function StreakWidget({ hasLoggedToday }: Props) {

    // Get theme colors from context for consistent styling
    const { theme } = useTheme();
    const c = theme.colors;

    // Get gamification stats from context, including whether gamification is enabled and the current streak count
    const { gamificationEnabled, streak } = useGamification();
    const displayStreak = streak;

    // Hide entirely when gamification is off
    if (!gamificationEnabled) return null;

    // Determine if the user is at risk of breaking their streak (has not logged today but has an active streak) or if the streak is already broken (streak count is 0)
    const isAtRisk = !hasLoggedToday && streak > 0;
    const isBroken = streak === 0;

    const emoji = isBroken ? "❄️" : isAtRisk ? "⏳" : "🔥";

    // Render the streak widget 
    return (
        <View style={[styles.container, { backgroundColor: c.card, borderColor: c.border, opacity: isAtRisk ? 0.85 : 1 }]}>
            {/* Fire emoji to visually represent the streak and timer for no streak today*/ }
            <Text style={styles.fire}>
                {emoji}
            </Text>
            <View>
                {/* Display the current streak count */ }
                <Text style={[styles.streakCount, { color: isAtRisk ? "#FF9F43" : c.primary }]}>{displayStreak}-day streak</Text>
                <Text style={[styles.streakSub, { color: c.textMuted }]}>
                    {!hasLoggedToday
                        ?  streak === 0
                            ? "Log today to start your streak!"
                            : "Don't break your streak!"
                        : streak === 1
                            ? "Great start — keep it up!"
                            : "Keep logging daily!"
                    }
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
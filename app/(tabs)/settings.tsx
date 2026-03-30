//app/(tabs)/settings.tsx

import { ThemeName, themes } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SettingsScreen() {
    const { theme, themeName, setTheme } = useTheme();
    const c = theme.colors;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
            <ScrollView contentContainerStyle={ styles.inner}>
                <Text style={[styles.pageTitle, { color: c.text }]}>Settings</Text>

                {/* Theme selection */}
                <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Appearance</Text>
                <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                    <Text style={[styles.cardTitle, { color: c.text }]}>Theme</Text>
                    <Text style={[styles.cardSubtitle, { color: c.textMuted }]}>Choose your app theme</Text>

                    <View style={styles.themeGrid}>
                    {(Object.keys(themes) as ThemeName[]).map((key) => {
                        const t = themes[key];
                        const isActive = themeName === key;
                        return (
                            <TouchableOpacity
                                key={key}
                                onPress={() => setTheme(key)}
                                style={[
                                    styles.themeCard,
                                    {
                                        backgroundColor: t.colors.surface,
                                        borderColor: isActive ? t.colors.primary : t.colors.border,
                                        borderWidth: isActive ? 2 : 1,
                                    },
                                ]}
                            >
                                <Text style={styles.themeEmoji}>{t.emoji}</Text>
                                <Text style={[styles.themeLabel, { color: t.colors.text }]}>{t.label}</Text>

                                <View
                                    style={[
                                        styles.themeSwatch,
                                        { backgroundColor: t.colors.primary },
                                    ]}
                                />
                                {isActive && (
                                    <Text style={[styles.themeActive, { color: t.colors.primary}]}>
                                        ✓
                                    </Text>
                                )}
                                
                            </TouchableOpacity>
                        );
                    })}

                    </View>
                </View>

                {/* PLACEHODLER FUTURE SETTINGS */}
                <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Notifications</Text>
                <View style={[styles.card, styles.comingSoonCard, { backgroundColor: c.card, borderColor: c.border }]}>
                    <Text style={styles.comingSoonEmoji}>🔔</Text>  
                    <Text style={[styles.comingSoonTitle, { color: c.textMuted }]}>Coming soon</Text>
                    <Text style={[styles.comingSoonText, { color: c.textMuted }]}>Period reminders, daily log nudges, and insights! Stay tuned!</Text>
                </View>

                <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Privacy</Text>
                <View style={[styles.card, styles.comingSoonCard, { backgroundColor: c.card, borderColor: c.border }]}>
                    <Text style={styles.comingSoonEmoji}>🔒</Text>  
                    <Text style={[styles.comingSoonTitle, { color: c.textMuted }]}>Coming soon</Text>
                    <Text style={[styles.comingSoonText, { color: c.textMuted }]}>Privacy options! Stay tuned!</Text>
                </View>
                
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    inner: {
        padding: 20,
        paddingBottom: 40,
    },

    pageTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        marginTop: 20,
    },

    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 10,
        marginTop: 20,
        letterSpacing: 1.2,
    },

    card: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },

    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },

    cardSubtitle: {
        fontSize: 13,
        marginBottom: 16,
    },

    themeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },

    themeCard: {
        width: "30%",
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        gap: 4,
    },  

    themeEmoji: {
        fontSize: 24,
    },

    themeLabel: {
        fontSize: 12,
        fontWeight: '600',
    },

    themeSwatch: {
        width: 28,
        height: 6,
        marginTop: 4,
    },

    themeActive: {
        fontSize: 14,
        fontWeight: '800',
    },

    comingSoonCard: {
        alignItems: 'center',
        paddingVertical: 24,
        opacity: 0.6,
    },

    comingSoonEmoji: {
        fontSize: 28,
        marginBottom: 8,
    },

    comingSoonTitle: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
    },

    comingSoonText: {
        fontSize: 13,
        textAlign: 'center',
    },
});

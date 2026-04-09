//app/(tabs)/settings.tsx

import { ThemeName, themes } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationTester from '../../components/NotificationTester';
import { cancelNotification, notifyUpcomingSymptomsForUser, requestNotificationPermission, scheduleDailyNotification, scheduleNotification } from '../utils/notifications';

export default function SettingsScreen() {
    const { theme, themeName, setTheme } = useTheme();
    const c = theme.colors;
    
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    
    const NOTIF_KEYS = {
        notifications: "notificationsEnabled",
        period: "periodReminderEnabledID",
        daily: "dailyTrackingEnabledID",
        insights: "insightsEnabledID",
    }
    
    const handleTestAllNotifications = async () => {
        const now = Date.now();
        await scheduleNotification("🔔 General Test", "Notifications are working!", new Date(now + 5000));
        await scheduleNotification("🩸 Period Reminder", "Your period may be approaching soon — stay prepared!", new Date(now + 10000));
        await scheduleNotification("📋 Daily Tracking Reminder", "Don't forget to log your daily symptoms and mood!", new Date(now + 15000));
        await notifyUpcomingSymptomsForUser(new Date(now + 20000));
    };

    const [periodReminderID, setPeriodReminderEnabledID] = useState<string | null>(null);
    const [dailyTrackingID, setDailyTrackingEnabledID] = useState<string | null>(null);
    const [insightsID, setInsightsEnabledID] = useState<string | null>(null);
    
    
    useEffect(() => {
        (async () => {
            const savedNotifications = await AsyncStorage.getItem(NOTIF_KEYS.notifications);
            const savedPeriodID = await AsyncStorage.getItem(NOTIF_KEYS.period);
            const savedDailyID = await AsyncStorage.getItem(NOTIF_KEYS.daily);
            const savedInsightsID = await AsyncStorage.getItem(NOTIF_KEYS.insights);

            if (savedNotifications !== null) setNotificationsEnabled(JSON.parse(savedNotifications));
            if (savedPeriodID) setPeriodReminderEnabledID(savedPeriodID);
            if (savedDailyID) setDailyTrackingEnabledID(savedDailyID);
            if (savedInsightsID) setInsightsEnabledID(savedInsightsID);
        })()
    }, []);

    const handleToggleNotifications = async (value: boolean) => {
        setNotificationsEnabled(value);
        await AsyncStorage.setItem(NOTIF_KEYS.notifications, JSON.stringify(value));
        if (value) {
            const granted = await requestNotificationPermission();
            if (!granted) {
                setNotificationsEnabled(false);
                alert("Notification permission is required to enable notifications.");
            } else {
                alert("Notifications enabled! You can customize your reminders below.");
                console.log("Notification permissions granted");
            }
        } else {
            // Cancel all active notifications when master toggle is turned off
            if (periodReminderID) await cancelNotification(periodReminderID);
            if (dailyTrackingID) await cancelNotification(dailyTrackingID);
            if (insightsID) await cancelNotification(insightsID);
            setPeriodReminderEnabledID(null);
            setDailyTrackingEnabledID(null);
            setInsightsEnabledID(null);
            await AsyncStorage.removeItem(NOTIF_KEYS.period);
            await AsyncStorage.removeItem(NOTIF_KEYS.daily);
            await AsyncStorage.removeItem(NOTIF_KEYS.insights);
        }
    };
    
    const handleTogglePeriodReminder = async (value: boolean) => {
        if (value && notificationsEnabled) {
            // Schedule a daily repeating reminder at 9 AM
            // (the "2 days before" logic would require knowing the predicted period date;
            //  for now this fires daily at 9 AM as a standing reminder)
            const id = await scheduleDailyNotification(
                'Period Reminder',
                'Your period may be approaching soon — stay prepared!',
                9,  // 9 AM
                0
            );
            setPeriodReminderEnabledID(id);
            await AsyncStorage.setItem(NOTIF_KEYS.period, id);
        } else {
            if (periodReminderID) await cancelNotification(periodReminderID);
            setPeriodReminderEnabledID(null);
            await AsyncStorage.removeItem(NOTIF_KEYS.period);
        }
    };

    const handleToggleDailyTracking = async (value: boolean) => {
        if (value && notificationsEnabled) {
            // Schedule a daily repeating reminder at 8 PM
            const id = await scheduleDailyNotification(
                'Daily Tracking Reminder',
                "Don't forget to log your daily symptoms and mood!",
                20, // 8 PM
                0
            );
            setDailyTrackingEnabledID(id);
            await AsyncStorage.setItem(NOTIF_KEYS.daily, id);
        } else {
            if (dailyTrackingID) await cancelNotification(dailyTrackingID);
            setDailyTrackingEnabledID(null);
            await AsyncStorage.removeItem(NOTIF_KEYS.daily);
        }
    };

    const handleToggleInsights = async (value: boolean) => {
        if (value && notificationsEnabled) {
            const granted = await requestNotificationPermission();
            if (!granted) {
                setInsightsEnabledID(null);
                alert("Notification permission is required to enable insights notifications.");
                return;
            }

            // Schedule first fire at next 9 AM
            const now = new Date();
            const next9am = new Date();
            next9am.setHours(9, 0, 0, 0);
            if (now >= next9am) {
                next9am.setDate(next9am.getDate() + 1);
            }

            const id = await notifyUpcomingSymptomsForUser(next9am);    
            setInsightsEnabledID(id || null);
            if (id) await AsyncStorage.setItem(NOTIF_KEYS.insights, id);
        } else {
            if (insightsID) await cancelNotification(insightsID);
            setInsightsEnabledID(null);
            await AsyncStorage.removeItem(NOTIF_KEYS.insights);
        }
    };
        

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

                
                <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Notifications</Text>
                <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                    <NotificationToggle
                        label="Enable notifications"
                        value={notificationsEnabled}
                        onValueChange={handleToggleNotifications}
                        themeColors={theme.colors}
                    />
                    <NotificationToggle
                        label="Period Reminder (Daily at 9 AM)"
                        value={!!periodReminderID}
                        onValueChange={handleTogglePeriodReminder}
                        themeColors={theme.colors}
                        disabled={!notificationsEnabled}
                    />
                    <NotificationToggle
                        label="Daily Tracking Reminder (8 PM)"
                        value={!!dailyTrackingID}
                        onValueChange={handleToggleDailyTracking}
                        themeColors={theme.colors}
                        disabled={!notificationsEnabled}
                    />
                    <NotificationToggle
                        label="Insights & Tips"
                        value={!!insightsID}
                        onValueChange={handleToggleInsights}
                        themeColors={theme.colors}
                        disabled={!notificationsEnabled}
                    />
                </View>


                {/* PLACEHOLDER FUTURE SETTINGS */}
                <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Privacy</Text>
                <View style={[styles.card, styles.comingSoonCard, { backgroundColor: c.card, borderColor: c.border }]}>
                    <Text style={styles.comingSoonEmoji}>🔒</Text>  
                    <Text style={[styles.comingSoonTitle, { color: c.textMuted }]}>Coming soon</Text>
                    <Text style={[styles.comingSoonText, { color: c.textMuted }]}>Privacy options! Stay tuned!</Text>
                </View>

                {/* test notifications */}
                <NotificationTester />
            </ScrollView>
        </SafeAreaView>
    );
}

function NotificationToggle({
    label,
    value,
    onValueChange,
    themeColors,
    disabled = false
}: {
    label: string;
    value: boolean;
    onValueChange: (newValue: boolean) => void;
    themeColors: ReturnType<typeof useTheme>['theme']['colors'];
    disabled?: boolean;
}) {
    return (
        <View
            style={[
                styles.notificationRow,
                { backgroundColor: themeColors.surface, opacity: disabled ? 0.5 : 1 },
            ]}
        >
            <Text style={[styles.notificationLabel, { color: themeColors.text }]}>{label}</Text>
            <Switch
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
                trackColor={{ false: themeColors.border, true: themeColors.primary }}
                thumbColor={themeColors.surface}
            />
        </View>
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

    notificationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        marginBottom: 12,
    },

    notificationLabel: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
        flexWrap: 'wrap',
    },
});
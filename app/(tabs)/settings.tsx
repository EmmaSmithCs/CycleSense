//app/(tabs)/settings.tsx

/*
    This file implements the Settings screen for the CycleSense app.
    It allows users to customize their app experience by adjusting appearance settings, notification preferences, and privacy options.

    Key features:
    - Theme selection: Users can choose from multiple themes to personalize the app's appearance.
    - Preferences: Users can set their average cycle length and period length, choose their preferred date format, and toggle gamification features like streaks and badges.
    - Notification settings: Users can enable or disable notifications, and customize specific reminders for period predictions, daily tracking, and insights.
    - Privacy settings: Users can enable an app lock that requires biometric authentication, choose to hide the app in the app switcher, and toggle incognito logging to exclude certain entries from predictions.
    - All settings are persisted using AsyncStorage for local preferences and Firestore for user-specific data, ensuring that preferences are saved across sessions and devices.

*/

// Imports
import { ThemeName, themes } from '@/constants/theme';
import { useDateFormat } from '@/context/DateFormatContext';
import { useGamification } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import { auth } from '@/firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as LocalAuthentication from 'expo-local-authentication';
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../firebase/config';
import { cancelNotification, notifyUpcomingSymptomsForUser, requestNotificationPermission, scheduleDailyNotification, scheduleNotification, schedulePeriodReminderFromLogs } from '../utils/notifications';

// Settings screen component
export default function SettingsScreen() {
    // State and context
    const { theme, themeName, setTheme } = useTheme();
    const c = theme.colors;
    const { dateFormat, setDateFormat } = useDateFormat();

    // Notification keys defined at top of component for easy access in handlers
    const NOTIF_KEYS = {
        notifications: "notificationsEnabled",
        period: "periodReminderEnabledID",
        daily: "dailyTrackingEnabledID",
        insights: "insightsEnabledID",
    }

    // Privacy keys defined at top of component for easy access in handlers
    const PRIVACY_KEYS = {
        appLock: "privacyAppLock",
        hideInSwitcher: "privacyHideInSwitcher",
        incognitoLogging: "privacyIncognitoLogging",
    };
    
    // Type for daily log entries, used in period reminder scheduling
    type DailyLog = {
        id: string;
        bleeding: "None" | "Light" | "Medium" | "Heavy";
        symptoms:  {name: string; intensity?: number}[];
        date: string;
    }
    
    // TESTING FUNCTION - can be triggered from a hidden button in the UI to send test notifications
    const handleTestAllNotifications = async () => {
        const now = Date.now();
        await scheduleNotification("🔔 General Test", "Notifications are working!", new Date(now + 5000));
        await scheduleNotification("🩸 Period Reminder", "Your period may be approaching soon — stay prepared!", new Date(now + 10000));
        await scheduleNotification("📋 Daily Tracking Reminder", "Don't forget to log your daily symptoms and mood!", new Date(now + 15000));
        await notifyUpcomingSymptomsForUser(new Date(now + 20000));
    };

    // Gamification context for refreshing streaks and badges after preference changes
    const { refreshGamification } = useGamification();

    // State variables for settings
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [periodReminderID, setPeriodReminderEnabledID] = useState<string | null>(null);
    const [dailyTrackingID, setDailyTrackingEnabledID] = useState<string | null>(null);
    const [insightsID, setInsightsEnabledID] = useState<string | null>(null);
    const [dailyHour, setDailyHour] = useState(20);
    const [dailyMinute, setDailyMinute] = useState(0);
    const [showDailyTimePicker, setShowDailyTimePicker] = useState(false);

    // State variables for preferences
    const [cycleLength, setCycleLength] = useState(28);
    const [periodLength, setPeriodLength] = useState(5);
    const [gamificationEnabled, setGamificationEnabled] = useState(false);
    const [prefsSaving, setPrefsSaving] = useState(false);
    const [prefsSaved, setPrefsSaved] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    // State variables for privacy settings
    const [appLockEnabled, setAppLockEnabled] = useState(false);
    const [hideInSwitcherEnabled, setHideInSwitcherEnabled] = useState(false);
    const [incognitoLoggingEnabled, setIncognitoLoggingEnabled] = useState(false);
    const [biometricsEnabled, setBiometricsEnabled] = useState(false);

    // Load settings from AsyncStorage and Firestore on mount
    useEffect(() => {
        (async () => {
            const compatible = await LocalAuthentication.hasHardwareAsync(); // Check if device has biometric hardware
            const enrolled = await LocalAuthentication.isEnrolledAsync(); // Check if user has biometrics set up
            setBiometricsEnabled(compatible && enrolled);
        })();
    }, []);

    // Load all settings on mount, including notification preferences, privacy settings, and user preferences from Firestore
    useEffect(() => {
        (async () => {
            // Load all setttings from AsyncStorage in parallel
            const savedNotifications = await AsyncStorage.getItem(NOTIF_KEYS.notifications);
            const savedPeriodID = await AsyncStorage.getItem(NOTIF_KEYS.period);
            const savedDailyID = await AsyncStorage.getItem(NOTIF_KEYS.daily);
            const savedInsightsID = await AsyncStorage.getItem(NOTIF_KEYS.insights);
            const savedDailyHour = await AsyncStorage.getItem('dailyHour');
            const savedDailyMinute = await AsyncStorage.getItem('dailyMinute');
            const savedAppLock = await AsyncStorage.getItem(PRIVACY_KEYS.appLock);
            const savedHideInSwitcher = await AsyncStorage.getItem(PRIVACY_KEYS.hideInSwitcher);
            const savedIncognitoLogging = await AsyncStorage.getItem(PRIVACY_KEYS.incognitoLogging);

            // Apply loaded settings to state
            if (savedNotifications !== null) setNotificationsEnabled(JSON.parse(savedNotifications));
            if (savedPeriodID) setPeriodReminderEnabledID(savedPeriodID);
            if (savedDailyID) setDailyTrackingEnabledID(savedDailyID);
            if (savedInsightsID) setInsightsEnabledID(savedInsightsID);
            if (savedDailyHour) setDailyHour(parseInt(savedDailyHour));
            if (savedDailyMinute) setDailyMinute(parseInt(savedDailyMinute, 10));
            if (savedAppLock) setAppLockEnabled(JSON.parse(savedAppLock));
            if (savedHideInSwitcher) setHideInSwitcherEnabled(JSON.parse(savedHideInSwitcher));
            if (savedIncognitoLogging) setIncognitoLoggingEnabled(JSON.parse(savedIncognitoLogging));

            // Load user preferences from Firestore
            const user = auth.currentUser;
            if (!user) return;
            const userSnapshot = await getDoc(doc(db, 'users', user.uid));
            if (userSnapshot.exists()) {
                const data = userSnapshot.data();
                // Only set preferences if they exist in Firestore, otherwise keep defaults
                if (data.cycleLength) setCycleLength(data.cycleLength);
                if (data.periodLength) setPeriodLength(data.periodLength);
                if (data.dateFormat) setDateFormat(data.dateFormat);
                if (data.gamificationEnabled !== undefined) setGamificationEnabled(data.gamificationEnabled);
            }
        })()
    }, []);

    // Handler for toggling app lock, with biometric authentication if enabling
    const handleToggleAppLock = async (value: boolean) => {
        if (value) {
            // If enabling app lock, require biometric authentication to confirm
            if (!biometricsEnabled) {
                alert("Biometric authentication is not available or set up on this device.");
                return;
            }

            // Authenticate user before enabling app lock
            const authResult = await LocalAuthentication.authenticateAsync({
                promptMessage: "Confirm your identity to enable app lock",
                fallbackLabel: "Use Passcode",
            });

            // Only enable app lock if authentication was successful
            if (!authResult.success) {
                alert("Authentication failed. App lock not enabled.");
                return;
            }
        };
        // If disabling app lock, no authentication needed
        setAppLockEnabled(value);
        await AsyncStorage.setItem(PRIVACY_KEYS.appLock, JSON.stringify(value));
    };

    // Handler for toggling hide in app switcher
    const handleToggleHideInSwitcher = async (value: boolean) => {
        setHideInSwitcherEnabled(value);
        await AsyncStorage.setItem(PRIVACY_KEYS.hideInSwitcher, JSON.stringify(value));
    };

    // Handler for toggling incognito logging
    const handleToggleIncognitoLogging = async (value: boolean) => {
        setIncognitoLoggingEnabled(value);
        await AsyncStorage.setItem(PRIVACY_KEYS.incognitoLogging, JSON.stringify(value));
    };

    // Handler for saving user preferences to Firestore
    const handleSavePreferences = async () => {
        const user = auth.currentUser;
        if (!user) return;
        setPrefsSaving(true);
        try {
            // Overwrite existing preferences with new values
            await updateDoc(doc(db, 'users', user.uid), {
                cycleLength,
                periodLength,
                dateFormat,
                gamificationEnabled,
            });
            refreshGamification();
            setPrefsSaved(true);
            setTimeout(() => setPrefsSaved(false), 2500); // Reset saved state after 2.5 seconds to allow for multiple saves
        } catch (error) {
            console.error("Error saving preferences:", error);
        }
        setPrefsSaving(false);
    };

    // Handler for toggling notifications, with permission request when enabling and cleanup of all notifications when disabling
    const handleToggleNotifications = async (value: boolean) => {
        setNotificationsEnabled(value);
        // Save master notification toggle state
        await AsyncStorage.setItem(NOTIF_KEYS.notifications, JSON.stringify(value));
        if (value) {
            // Request notification permissions when enabling notifications
            const granted = await requestNotificationPermission();
            if (!granted) {
                // If permission is not granted, disable notifications and alert user
                setNotificationsEnabled(false);
                alert("Notification permission is required to enable notifications.");
            } else {
                // If permission is granted, show success alert and log result
                alert("Notifications enabled! You can customize your reminders below.");
                console.log("Notification permissions granted");
            }
        } else {
            // Cancel all active notifications when master toggle is turned off
            if (periodReminderID) await cancelNotification(periodReminderID);
            if (dailyTrackingID) await cancelNotification(dailyTrackingID);
            if (insightsID) await cancelNotification(insightsID);

            // Reset all notification-related state and AsyncStorage keys
            setPeriodReminderEnabledID(null);
            setDailyTrackingEnabledID(null);
            setInsightsEnabledID(null);
            await AsyncStorage.removeItem(NOTIF_KEYS.period);
            await AsyncStorage.removeItem(NOTIF_KEYS.daily);
            await AsyncStorage.removeItem(NOTIF_KEYS.insights);
        }
    };
    
    // Handler for toggling period reminder
    const handleTogglePeriodReminder = async (value: boolean) => {
        if (value && notificationsEnabled) {
            const snapshot = await getDocs(collection(db, "users", auth.currentUser!.uid, "dailyLogs"));
            const logs: DailyLog[] = snapshot.docs.map((doc) => {
            const data = doc.data() as Partial<DailyLog>;
            // Map Firestore data to DailyLog type, providing defaults for missing fields
            return {
                id: doc.id,
                bleeding: data.bleeding ?? "None",
                symptoms: Array.isArray(data.symptoms) ? data.symptoms : [],
                date: data.date ?? doc.id,
            }});

            // If no logs are available, alert the user and do not enable the period reminder, as it relies on past log data to make predictions
            if (!logs.length) {
                alert("Not enough data to set period reminder. Please log at least one day of symptoms with bleeding info.");
                return;
            }

            // Schedule period reminder based on logs and save the returned notification ID for future cancellation
            const id = await schedulePeriodReminderFromLogs(logs, 2);
            if (id) {
                const reminderId = id.id;
                setPeriodReminderEnabledID(reminderId);
                await AsyncStorage.setItem(NOTIF_KEYS.period, reminderId);
            }

        // If disabling period reminder, cancel the scheduled notification and clean up state and AsyncStorage
        } else {
            if (periodReminderID) await cancelNotification(periodReminderID);
            setPeriodReminderEnabledID(null);
            await AsyncStorage.removeItem(NOTIF_KEYS.period);
        }
    };

    // Handler for toggling daily tracking reminder
    const handleToggleDailyTracking = async (value: boolean, hour?: number, minute?: number) => {
        // Use provided hour and minute if available (from time picker), otherwise use existing state values
        const scheduledHour = hour ?? dailyHour;
        const scheduledMinute = minute ?? dailyMinute;
        
        if (value && notificationsEnabled) {
            const now = new Date();
            const scheduledDate = new Date();
            scheduledDate.setHours(scheduledHour, scheduledMinute, 0, 0);

            // If the scheduled time is before the current time, schedule for the next day
            if (scheduledDate <= now) {
                scheduledDate.setDate(scheduledDate.getDate() + 1);
            }

            // Schedule a daily repeating reminder at the selected time
            const id = await scheduleDailyNotification(
                'Daily Tracking Reminder',
                "Don't forget to log your daily symptoms and mood!",
                scheduledDate.getHours(),
                scheduledDate.getMinutes()
            );

            // Save the returned notification ID for future cancellation, and save the scheduled time in AsyncStorage for persistence
            setDailyTrackingEnabledID(id);
            await AsyncStorage.setItem(NOTIF_KEYS.daily, id);
            await AsyncStorage.setItem('dailyHour', scheduledHour.toString());
            await AsyncStorage.setItem('dailyMinute', scheduledMinute.toString());
        } else {
            // If disabling daily tracking reminder, cancel the scheduled notification and clean up state and AsyncStorage
            if (dailyTrackingID) await cancelNotification(dailyTrackingID);
            setDailyTrackingEnabledID(null);
            await AsyncStorage.removeItem(NOTIF_KEYS.daily);
        }
    };

    // Handler for toggling insights notifications (these are sent when new predictions are available, so they don't rely on a scheduled time like the other reminders)
    const handleToggleInsights = async (value: boolean) => {
        if (value && notificationsEnabled) {
            const granted = await requestNotificationPermission();
            if (!granted) {
                // If permission is not granted, disable insights notifications and alert user
                alert("Notification permission is required to enable insights notifications.");
                return;
            }

            setInsightsEnabledID('enabled');
            await AsyncStorage.setItem(NOTIF_KEYS.insights, 'enabled');
        } else {
            // If disabling insights notifications, simply clean up state and AsyncStorage
            setInsightsEnabledID(null);
            await AsyncStorage.removeItem(NOTIF_KEYS.insights);
        }
    };

    // Reusable stepper component for adjusting numeric preferences like cycle length and period length, with built-in min/max bounds and unit display
    const Stepper = ({
        // Props include current value, onChange handler, min/max bounds, and optional unit label (defaulting to 'days')
        value,
        onChange,
        min,
        max,
        unit = 'days',
    } : {
        // Type definitions for Stepper props
        value: number;
        onChange: (newValue: number) => void;
        min: number,
        max: number;
        unit?: string;
    }) => (
        <View style={[styles.stepper, {borderColor: c.border, backgroundColor: c.surface}]}>
            {/* Decrement button, disabled when value is at minimum. Calls onChange with new value when pressed. */}
            <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => onChange(Math.max(value - 1, min))}
            >
                <Text style={[styles.stepperBtnText, {color: c.text}]}>-</Text>
            </TouchableOpacity>

            {/* Display current value with unit label */}
            <Text style={[styles.stepperValueText, {color: c.text}]}>{value} {unit}</Text>

            {/* Increment button, disabled when value is at maximum. Calls onChange with new value when pressed. */}
            <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => onChange(Math.min(value + 1, max))}
            >   
                <Text style={[styles.stepperBtnText, {color: c.text}]}>+</Text>
            </TouchableOpacity>
        </View>
    );
        
    // Settings page render with styles
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
            <ScrollView contentContainerStyle={ styles.inner}>

                {/* Page title */}
                <Text style={[styles.pageTitle, { color: c.text }]}>Settings</Text>

                {/* Theme selection */}
                <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Appearance</Text>
                <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                    <Text style={[styles.cardTitle, { color: c.text }]}>Theme</Text>
                    <Text style={[styles.cardSubtitle, { color: c.textMuted }]}>Choose your app theme</Text>

                    {/* Theme selection grid */}
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
                                {/* Displays theme emoji and label */}
                                <Text style={styles.themeEmoji}>{t.emoji}</Text>
                                <Text style={[styles.themeLabel, { color: t.colors.text }]}>{t.label}</Text>

                                {/* Active theme gets a colored border */ }
                                <View
                                    style={[
                                        styles.themeSwatch,
                                        { backgroundColor: t.colors.primary },
                                    ]}
                                />

                                {/* Checkmark overlay for active theme */ }
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

                {/* Preferences */}
                <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Preferences</Text>
                <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                    <View style={styles.preferenceRow}>

                        {/* Avergae cycle length preference */}
                        <View style={styles.preferenceLabelWrap}>
                            <Text style={[styles.preferenceLabel, {color: c.text}]}>Average Cycle Length</Text>
                            <Text style={[styles.preferenceHint, {color: c.textMuted}]}>Used to predict your next period (21-45 days)</Text>
                        </View>

                        {/* Reusable Stepper component for adjusting cycle length with built-in bounds and unit display (21-45 days) */ }
                        <Stepper 
                            value={cycleLength} 
                            onChange={setCycleLength}
                            min={21}
                            max={45}
                        />
                    </View>
                            
                    <View style={[styles.divider, {backgroundColor: c.border}]}/>

                    {/* Average period length preference */ }
                    <View style={styles.preferenceRow}>
                        <View style={styles.preferenceLabelWrap}>
                            <Text style={[styles.preferenceLabel, {color: c.text}]}>Average Period Length</Text>
                            <Text style={[styles.preferenceHint, {color: c.textMuted}]}>Used to predict your next period (1-10 days)</Text>
                        </View>

                        {/* Reusable Stepper component for adjusting period length with built-in bounds and unit display (1-10 days) */ }
                        <Stepper 
                            value={periodLength} 
                            onChange={setPeriodLength}
                            min={1}
                            max={10}
                        />

                    </View>

                    <View style={[styles.divider, {backgroundColor: c.border}]}/>

                    {/* Date format preference */ }
                    <View style={styles.preferenceRow}>
                        <View style={styles.preferenceLabelWrap}>
                            <Text style={[styles.preferenceLabel, {color: c.text}]}>Date Format</Text>
                            <Text style={[styles.preferenceHint, {color: c.textMuted}]}>How dates are displayed throughout the app</Text>
                        </View>

                        {/* Segment buttons for date format selection */ }
                        <View style={styles.segmentRow}>
                            {(['DD/MM/YYYY', 'MM/DD/YYYY'] as const).map(fmt => ( // Dates can be either day-first or month-first
                                <TouchableOpacity
                                    key={fmt}
                                    onPress={() => setDateFormat(fmt)}
                                    style={[
                                        styles.segmentBtn,
                                        {
                                            backgroundColor: dateFormat === fmt ? c.primary : c.surface,
                                            borderColor: dateFormat === fmt ? c.primary : c.border,
                                        },
                                    ]}
                                >
                                    {/* Date format options with active selection styling */ }
                                    <Text style={{ color: dateFormat === fmt ? '#fff' : c.textMuted, fontSize: 11, fontWeight: '600' }}>
                                        {fmt}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={[styles.divider, {backgroundColor: c.border}]} />
                    
                    {/* Gamification toggle */ }
                    <View style={[styles.preferenceRow, {backgroundColor: 'transparent'}]}>
                        <View style={styles.preferenceLabelWrap}>
                            <Text style={[styles.preferenceLabel, {color: c.text }]}>Streaks & Badges</Text>
                            <Text style={[styles.preferenceHint, { color: c.textMuted}]}>
                                Enable logging streaks and achievement badges
                            </Text>
                        </View>

                        {/* Switch component for toggling gamification features on and off, with state persistence and immediate effect on the gamification context */ }
                        <Switch 
                            value={gamificationEnabled}
                            onValueChange={setGamificationEnabled}
                            trackColor={{ false: c.border, true: c.primary }}
                            thumbColor={c.surface}
                        />
                    </View>

                    <View style={[styles.divider, {backgroundColor: c.border}]} />

                    {/* DISCLAIMER AGAIN*/}
                    <TouchableOpacity
                        style={styles.disclaimerRow}
                        onPress={() => setShowDisclaimer(true)}
                    >
                        <Text style={[styles.preferenceLabel, { color: c.text }]}>Medical Disclaimer</Text>
                        <Text style={[styles.chevron, { color: c.textMuted }]}>{'>'}</Text>
                    </TouchableOpacity>

                    {/* Save preferences button */ }
                    <TouchableOpacity
                        style={[
                            styles.saveBtn,
                            { backgroundColor: prefsSaved ? '#4caf50' : c.primary}, // Green background if preferences are saved, primary color otherwise
                        ]}
                        onPress={handleSavePreferences}
                        disabled={prefsSaving}  // Disable button while saving to prevent multiple rapid presses
                    >
                        {/* Button text changes based on saving state: "Saving..." while saving, "✓ Saved" briefly after successful save, and "Save Preferences" by default */ }
                        <Text style={styles.saveBtnText}>
                            {prefsSaved? '✓ Saved' : prefsSaving ? 'Saving...' : 'Save Preferences'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Notifications */ }
                <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Notifications</Text>
                <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>

                    {/* Master toggle for enabling/disabling all notifications, with permission request on enable and cleanup on disable */ }
                    <NotificationToggle
                        label="Enable notifications"
                        value={notificationsEnabled}
                        onValueChange={handleToggleNotifications}
                        themeColors={theme.colors}
                    />

                    {/* Individual notification toggle for period reminders  */ }
                    <NotificationToggle
                        label="Period Reminder (Daily at 9 AM)"
                        value={!!periodReminderID}
                        onValueChange={handleTogglePeriodReminder}
                        themeColors={theme.colors}
                        disabled={!notificationsEnabled}
                    />

                    {/* Individual notification toggle for daily tracking reminder, with additional UI for setting reminder time if enabled */ }
                    <NotificationToggle
                        label="Daily Tracking Reminder"
                        value={!!dailyTrackingID}
                        onValueChange={handleToggleDailyTracking}
                        themeColors={theme.colors}
                        disabled={!notificationsEnabled}
                    />

                    {!!dailyTrackingID && (
                        <TouchableOpacity
                            style={[
                                styles.notificationRow,
                                { backgroundColor: theme.colors.surface}
                            ]}
                            onPress ={() => setShowDailyTimePicker(true)}
                        >
                            {/* Display the currently set time for the daily tracking reminder, with a label prompting the user to set the time. Tapping this row opens the time picker. */ }
                            <Text style={[styles.notificationLabel, { color: theme.colors.text }]}>
                                Set daily reminder time 
                            </Text>
                            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                                {`${dailyHour.toString().padStart(2, '0')}:${dailyMinute.toString().padStart(2, '0')}`}

                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Time picker component for selecting the time of the daily tracking reminder  */ }
                    { showDailyTimePicker &&  (
                        <View>
                            <DateTimePicker
                                value={new Date(0, 0, 0, dailyHour, dailyMinute)}
                                mode="time"
                                is24Hour={true}
                                display="spinner"
                                onChange={(event, selectedDate) => {
                                    if (selectedDate) {
                                        setDailyHour(selectedDate.getHours());
                                        setDailyMinute(selectedDate.getMinutes());
                                    }
                                }}
                            />
                        
                            {/* Confirmation button for setting a time */}
                            <TouchableOpacity
                                style={[styles.saveBtn, { backgroundColor: c.primary, marginTop: 0 }]}
                                onPress={async () => {
                                    setShowDailyTimePicker(false);
                                    await AsyncStorage.setItem('dailyMinute', dailyMinute.toString());
                                    handleToggleDailyTracking(false, dailyHour, dailyMinute);
                                    setTimeout(() => handleToggleDailyTracking(true, dailyHour, dailyMinute), 100);
                                }}
                            >
                                <Text style={styles.saveBtnText}>Confirm Time</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Individual notification toggle for insights and tips notifications */ }
                    <NotificationToggle
                        label="Insights & Tips"
                        value={!!insightsID}
                        onValueChange={handleToggleInsights}
                        themeColors={theme.colors}
                        disabled={!notificationsEnabled}
                    />
                </View>


                {/* Privacy */}
                <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Privacy & Security</Text>
                <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>

                    {/* App lock toggle, which requires biometric authentication to enable. Disabled if biometrics are not available or set up on the device. */ }
                    <View style={styles.preferenceRow}>
                        <View style={styles.preferenceLabelWrap}>
                            <Text style={[styles.preferenceLabel, {color: c.text}]}>App Lock</Text>
                            <Text style={[styles.preferenceHint, {color: c.textMuted}]}>
                                {biometricsEnabled ? "Require biometric authentication to open the app" : "Biometric authentication not available"}
                            </Text>
                        </View>

                        {/* Switch component for toggling app lock on and off, with state persistence  */ }
                        <Switch
                            value={appLockEnabled}
                            onValueChange={handleToggleAppLock}
                            trackColor={{ false: c.border, true: c.primary }}
                            thumbColor={c.surface}
                            disabled={!biometricsEnabled}
                        />
                    </View>

                    <View style={[styles.divider, {backgroundColor: c.border}]} />

                    {/* Toggle for hiding app content in the app switcher */ }
                    <View style={styles.preferenceRow}>
                        <View style={styles.preferenceLabelWrap}>
                            <Text style={[styles.preferenceLabel, {color: c.text}]}>Hide in App Switcher</Text>
                            <Text style={[styles.preferenceHint, {color: c.textMuted}]}>
                                Prevent app content from appearing in the app switcher (iOS only)
                            </Text>
                        </View>

                        {/* Switch component for toggling the hide in app switcher */ }
                        <Switch
                            value={hideInSwitcherEnabled}
                            onValueChange={handleToggleHideInSwitcher}
                            trackColor={{ false: c.border, true: c.primary }}
                            thumbColor={c.surface}
                        />
                    </View>

                    <View style={[styles.divider, {backgroundColor: c.border}]} />

                    {/* Toggle for incognito logging mode, which hides logged entries from the main page when enabled */ }
                    <View style={styles.preferenceRow}>
                        <View style={styles.preferenceLabelWrap}>
                            <Text style={[styles.preferenceLabel, {color: c.text}]}>Incognito Logging</Text>
                            <Text style={[styles.preferenceHint, {color: c.textMuted}]}>
                                Previously saved entries on the main page will be hidden when this is enabled. They will only be visible on the history page.
                            </Text>
                        </View>

                        {/* Switch component for toggling incognito logging mode on and off, with state persistence  */ }
                        <Switch
                            value={incognitoLoggingEnabled}
                            onValueChange={handleToggleIncognitoLogging}
                            trackColor={{ false: c.border, true: c.primary }}
                            thumbColor={c.surface}
                        />
                    </View>

                    {/* Note about data privacy and security practices */ }
                    <View style={[styles.privacyNote, {backgroundColor: c.surface, borderColor: c.border}]}>
                        <Text style={[styles.privacyNoteText, {color: c.textMuted}]}>
                            Your data is stored privately in your acocunt and is never shared or sold.
                        </Text>
                    </View>
                </View>

                {/* Notification tester I HAVE THIS HERE FOR TESTING CAN BE UNCOMMENTED TO CHECK NOTIFICATIONS WORK */}
                {/* <NotificationTester /> */}
            </ScrollView>

            {/* Disclaimer modal*/}
            <Modal visible={showDisclaimer} animationType="slide" transparent>
                <View style={styles.disclaimerOverlay}>
                    <View style={[styles.disclaimermodal, {backgroundColor: c.card}]}>
                        <Text style={[styles.disclaimerTitle, {backgroundColor: c.card}]}>Medical Disclaimer</Text>
                        <Text style={[styles.disclaimerBody, {color: c.textMuted }]}>
                            <Text style={{ fontWeight: '700', color: c.text }}>
                                CycleSense is not a medical device.{'\n\n'}
                            </Text>
                                This app is desgined to help you track your menstrual cycle and identify period
                                patterns over time. It does not provide medical diagnoses, adn predictions may
                                not be accraute for everyone.{'\n\n'}
                                Do not use this app as a method of contraception or as a substitute for professional
                                medical advice. If you have concerns about your health, please consult a healthcare provider.
                        </Text>
                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: c.primary, marginTop: 8 }]}
                            onPress={() => setShowDisclaimer(false)}
                        >
                            <Text style={styles.saveBtnText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal> 

        </SafeAreaView>
    );
}

// Reusable component for rendering a notification toggle row 
function NotificationToggle({
    // Props include the label for the toggle, current value, onChange handler, theme colors for styling, and an optional disabled state which dims the row and disables interaction when true
    label,
    value,
    onValueChange,
    themeColors,
    disabled = false
}: {
    // Type definitions for NotificationToggle props
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
            {/* Label for the notification toggle */ }
            <Text style={[styles.notificationLabel, { color: themeColors.text }]}>{label}</Text>

            {/* Switch component for toggling the notification on and off, with styling based on the current theme and disabled state */ }
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

// Styles =
const styles = StyleSheet.create({

    // Container for the entire settings page
    inner: {
        padding: 20,
        paddingBottom: 40,
    },

    // Page title style
    pageTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        marginTop: 20,
    },

    // Section title style for different settings sections like Appearance, Preferences, Notifications, etc.
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 10,
        marginTop: 20,
        letterSpacing: 1.2,
    },

    // Card style for grouping related settings together, with rounded corners, padding, and border
    card: {
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },

    // Title style for individual setting cards
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },

    // Subtitle style for individual setting cards, used for descriptive text under the title
    cardSubtitle: {
        fontSize: 13,
        marginBottom: 16,
    },

    // Grid style for displaying theme options in a responsive layout 
    themeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },

    // Style for individual theme option cards 
    themeCard: {
        width: "30%",
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        gap: 4,
    },  

    // Emoji style for displaying the theme preview emoji in each theme option card
    themeEmoji: {
        fontSize: 24,
    },

    // Label style for the theme name displayed under the emoji in each theme option card
    themeLabel: {
        fontSize: 12,
        fontWeight: '600',
    },

    // Style for the colored swatch that appears on active theme options, showing the primary color of the theme
    themeSwatch: {
        width: 28,
        height: 6,
        marginTop: 4,
    },

    // Style for the checkmark that appears on the active theme option, positioned in the top-right corner of the card
    themeActive: {
        fontSize: 14,
        fontWeight: '800',
    },

    // Style for rows that contain notification toggles
    notificationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        marginBottom: 12,
    },

    // Style for the label text in notification toggle rows, allowing for wrapping if the label is too long to fit on one line
    notificationLabel: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
        flexWrap: 'wrap',
    },

    // Style for rows that contain user preferences, such as cycle length and date format
    preferenceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },

    // Wrapper style for the preference label and hint text, allowing the label to take up available space and wrap if necessary while keeping the stepper or segment buttons aligned to the right
    preferenceLabelWrap: {
        flex: 1,
    },

    // Style for the preference label text, which is the main title for each preference setting
    preferenceLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },

    // Style for the hint text under each preference label, providing additional information about the preference 
    preferenceHint: {
        fontSize: 12,
        lineHeight: 16,
    },

    // Style for the divider line between preference rows
    divider: {
        height: 1,
        marginVertical: 2,
        opacity: 0.5,
    },

    // Style for the stepper component used for adjusting numeric preferences like cycle length and period length
    stepper: {
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: 10,
        overflow: 'hidden',
        flexShrink: 0,
    },

    // Style for the buttons in the stepper component, which are used to increment and decrement the value
    stepperBtn: {
        width: 36,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Style for the text inside the stepper buttons
    stepperBtnText: {
        fontSize: 20,
        lineHeight: 24,
    },

    // Style for the value display in the center of the stepper, showing the current value and unit
    stepperValue: {
        width: 72,
        alignItems: 'center',
        justifyContent: 'center',
        borderLeftWidth: 1,
        borderRightWidth: 1,
    },

    // Style for the text displaying the current value in the stepper, including the unit label
    stepperValueText: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 40,
    },

    // Style for rows that contain segment buttons for selecting between multiple options, such as date format selection
    segmentRow: {
        flexDirection: 'row',
        gap: 6,
        flexShrink: 0,
    },

    // Style for individual segment buttons within the segment row, which allow the user to select between multiple options for a preference setting
    segmentBtn: {
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderRadius: 8,
    },

    // Style for the text inside the segment buttons, which indicates the option that the button represents
    segmentBtnText: {
        fontWeight : '600',
    },

    // Style for rows that contain the medical disclaimer toggle, which opens the disclaimer modal when pressed
    disclaimerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },

    // Style for the chevron (">") icon in the medical disclaimer row, indicating that it is a navigable item that opens a modal
    chevron: {
        fontSize: 22,
        fontWeight: '300',
    },

    // Style for the save preferences button at the bottom of the preferences section, which changes color based on whether preferences are currently being saved or have been successfully saved
    saveBtn: {
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginTop: 16,
        justifyContent: 'center',
    },

    // Style for the text inside the save preferences button, which changes based on the saving state (default, saving, saved) to provide feedback to the user about the save action
    saveBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },

    // Style for the overlay background of the medical disclaimer modal, which darkens the screen behind the modal content
    disclaimerOverlay: {
        flex: 1,
        backgroundColor: '#000000aa',
        justifyContent: 'center',
        padding: 24,
    },

    // Style for the content container of the medical disclaimer modal
    disclaimermodal: {
        borderRadius: 20,
        padding: 24,
    },

    // Style for the title text in the medical disclaimer modal
    disclaimerTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },

    // Style for the body text in the medical disclaimer modal
    disclaimerBody: {
        fontSize: 14,
        lineHeight: 22,
    },

    // Style for the privacy note at the bottom of the privacy settings section
    privacyNote: {
        borderRadius: 10,
        padding: 12,
        marginTop: 16,
        borderWidth: 1,
    },

    // Style for the text inside the privacy note
    privacyNoteText: {
        fontSize: 12,
        lineHeight: 18,
        textAlign: 'center',
    }

});
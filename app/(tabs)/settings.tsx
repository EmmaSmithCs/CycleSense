//app/(tabs)/settings.tsx

import { ThemeName, themes } from '@/constants/theme';
import { useGamification } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import { auth } from '@/firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NotificationTester from '../../components/NotificationTester';
import { db } from '../../firebase/config';
import { cancelNotification, notifyUpcomingSymptomsForUser, requestNotificationPermission, scheduleDailyNotification, scheduleNotification, schedulePeriodReminderFromLogs } from '../utils/notifications';


export default function SettingsScreen() {
    const { theme, themeName, setTheme } = useTheme();
    const c = theme.colors;
    
    const NOTIF_KEYS = {
        notifications: "notificationsEnabled",
        period: "periodReminderEnabledID",
        daily: "dailyTrackingEnabledID",
        insights: "insightsEnabledID",
    }
    
    type DailyLog = {
        id: string;
        bleeding: "None" | "Light" | "Medium" | "Heavy";
        symptoms:  {name: string; intensity?: number}[];
        date: string;
    }
    
    const handleTestAllNotifications = async () => {
        const now = Date.now();
        await scheduleNotification("🔔 General Test", "Notifications are working!", new Date(now + 5000));
        await scheduleNotification("🩸 Period Reminder", "Your period may be approaching soon — stay prepared!", new Date(now + 10000));
        await scheduleNotification("📋 Daily Tracking Reminder", "Don't forget to log your daily symptoms and mood!", new Date(now + 15000));
        await notifyUpcomingSymptomsForUser(new Date(now + 20000));
    };

    const { setGamificationEnabled: setContextGamificationEnabled } = useGamification();

    // Notifs
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [periodReminderID, setPeriodReminderEnabledID] = useState<string | null>(null);
    const [dailyTrackingID, setDailyTrackingEnabledID] = useState<string | null>(null);
    const [insightsID, setInsightsEnabledID] = useState<string | null>(null);
    const [dailyHour, setDailyHour] = useState(20);
    const [dailyMinute, setDailyMinute] = useState(0);
    const [showDailyTimePicker, setShowDailyTimePicker] = useState(false);

    // Preferences
    const [cycleLength, setCycleLength] = useState(28);
    const [periodLength, setPeriodLength] = useState(5);
    const [dateFormat, setDateFormat] = useState<'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY/MM/DD'>('DD/MM/YYYY');
    const [gamificationEnabled, setGamificationEnabled] = useState(false);
    const [prefsSaving, setPrefsSaving] = useState(false);
    const [prefsSaved, setPrefsSaved] = useState(false);
    const [showDisclaimer, setShowDisclaimer] = useState(false);

    useEffect(() => {
        (async () => {
            const savedNotifications = await AsyncStorage.getItem(NOTIF_KEYS.notifications);
            const savedPeriodID = await AsyncStorage.getItem(NOTIF_KEYS.period);
            const savedDailyID = await AsyncStorage.getItem(NOTIF_KEYS.daily);
            const savedInsightsID = await AsyncStorage.getItem(NOTIF_KEYS.insights);
            const savedDailyHour = await AsyncStorage.getItem('dailyHour');
            const savedDailyMinute = await AsyncStorage.getItem('dailyMinute');

            if (savedNotifications !== null) setNotificationsEnabled(JSON.parse(savedNotifications));
            if (savedPeriodID) setPeriodReminderEnabledID(savedPeriodID);
            if (savedDailyID) setDailyTrackingEnabledID(savedDailyID);
            if (savedInsightsID) setInsightsEnabledID(savedInsightsID);
            if (savedDailyHour) setDailyHour(parseInt(savedDailyHour));
            if (savedDailyMinute) setDailyMinute(parseInt(savedDailyMinute, 10));

            const user = auth.currentUser;
            if (!user) return;
            const userSnapshot = await getDoc(doc(db, 'users', user.uid));
            if (userSnapshot.exists()) {
                const data = userSnapshot.data();
                if (data.cycleLength) setCycleLength(data.cycleLength);
                if (data.periodLength) setPeriodLength(data.periodLength);
                if (data.dateFormat) setDateFormat(data.dateFormat);
                if (data.gamificationEnabled !== undefined) setGamificationEnabled(data.gamificationEnabled);
            }
        })()
    }, []);

    const handleSavePreferences = async () => {
        const user = auth.currentUser;
        if (!user) return;
        setPrefsSaving(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                cycleLength,
                periodLength,
                dateFormat,
                gamificationEnabled,
            });
            setContextGamificationEnabled(gamificationEnabled);
            setPrefsSaved(true);
            setTimeout(() => setPrefsSaved(false), 2500);
        } catch (error) {
            console.error("Error saving preferences:", error);
        }
        setPrefsSaving(false);
    };

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
            const snapshot = await getDocs(collection(db, "users", auth.currentUser!.uid, "dailyLogs"));
            const logs: DailyLog[] = snapshot.docs.map((doc) => {
            const data = doc.data() as Partial<DailyLog>;

                return {
                    id: doc.id,
                    bleeding: data.bleeding ?? "None",
                    symptoms: Array.isArray(data.symptoms) ? data.symptoms : [],
                    date: data.date ?? doc.id,
                };
            });

            if (!logs.length) {
                alert("Not enough data to set period reminder. Please log at least one day of symptoms with bleeding info.");
                return;
            }

            const id = await schedulePeriodReminderFromLogs(logs, 2);
            if (id) {
                const reminderId = typeof id === 'string' ? id : id.id;
                setPeriodReminderEnabledID(reminderId);
                await AsyncStorage.setItem(NOTIF_KEYS.period, reminderId);
            }
            
        } else {
            if (periodReminderID) await cancelNotification(periodReminderID);
            setPeriodReminderEnabledID(null);
            await AsyncStorage.removeItem(NOTIF_KEYS.period);
        }
    };

    const handleToggleDailyTracking = async (value: boolean, hour?: number, minute?: number) => {
        const scheduledHour = hour ?? dailyHour;
        const scheduledMinute = minute ?? dailyMinute;
        
        if (value && notificationsEnabled) {
            const now = new Date();
            const scheduledDate = new Date();
            scheduledDate.setHours(scheduledHour, scheduledMinute, 0, 0);
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
            setDailyTrackingEnabledID(id);
            await AsyncStorage.setItem(NOTIF_KEYS.daily, id);
            await AsyncStorage.setItem('dailyHour', scheduledHour.toString());
            await AsyncStorage.setItem('dailyMinute', scheduledMinute.toString());
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
                alert("Notification permission is required to enable insights notifications.");
                return;
            }
            // Just save the preference — actual insights fire when available
            setInsightsEnabledID('enabled');
            await AsyncStorage.setItem(NOTIF_KEYS.insights, 'enabled');
        } else {
            setInsightsEnabledID(null);
            await AsyncStorage.removeItem(NOTIF_KEYS.insights);
        }
    };

    const Stepper = ({
        value,
        onChange,
        min,
        max,
        unit = 'days',
    } : {
        value: number;
        onChange: (newValue: number) => void;
        min: number,
        max: number;
        unit?: string;
    }) => (
        <View style={[styles.stepper, {borderColor: c.border, backgroundColor: c.surface}]}>
            <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => onChange(Math.max(value - 1, min))}
            >
                <Text style={[styles.stepperBtnText, {color: c.text}]}>-</Text>
            </TouchableOpacity>

            <Text style={[styles.stepperValueText, {color: c.text}]}>{value} {unit}</Text>

            <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => onChange(Math.min(value + 1, max))}
            >   
                <Text style={[styles.stepperBtnText, {color: c.text}]}>+</Text>
            </TouchableOpacity>
        </View>
    );
        

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

                {/* Preferences */}
                <Text style={[styles.sectionTitle, { color: c.textMuted }]}>Preferences</Text>
                <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                    <View style={styles.preferenceRow}>
                        <View style={styles.preferenceLabelWrap}>
                            <Text style={[styles.preferenceLabel, {color: c.text}]}>Average Cycle Length</Text>
                            <Text style={[styles.preferenceHint, {color: c.textMuted}]}>Used to predict your next period (21-45 days)</Text>
                        </View>

                        <Stepper 
                            value={cycleLength} 
                            onChange={setCycleLength}
                            min={21}
                            max={45}
                        />
                    </View>
                            
                    <View style={[styles.divider, {backgroundColor: c.border}]}/>

                    <View style={styles.preferenceRow}>
                        <View style={styles.preferenceLabelWrap}>
                            <Text style={[styles.preferenceLabel, {color: c.text}]}>Average Period Length</Text>
                            <Text style={[styles.preferenceHint, {color: c.textMuted}]}>Used to predict your next period (1-10 days)</Text>
                        </View>

                        <Stepper 
                            value={periodLength} 
                            onChange={setPeriodLength}
                            min={1}
                            max={10}
                        />

                    </View>

                    <View style={[styles.divider, {backgroundColor: c.border}]}/>

                    <View style={styles.preferenceRow}>
                        <View style={styles.preferenceLabelWrap}>
                            <Text style={[styles.preferenceLabel, {color: c.text}]}>Date Format</Text>
                            <Text style={[styles.preferenceHint, {color: c.textMuted}]}>How dates are displayed throughout the app</Text>
                        </View>

                        <View style={styles.segmentRow}>
                            {(['DD/MM/YYYY', 'MM/DD/YYYY'] as const).map(fmt => (
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
                                    <Text style={{ color: dateFormat === fmt ? '#fff' : c.textMuted, fontSize: 11, fontWeight: '600' }}>
                                        {fmt}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={[styles.divider, {backgroundColor: c.border}]} />
                    
                    <View style={[styles.preferenceRow, {backgroundColor: 'transparent'}]}>
                        <View style={styles.preferenceLabelWrap}>
                            <Text style={[styles.preferenceLabel, {color: c.text }]}>Streaks & Badges</Text>
                            <Text style={[styles.preferenceHint, { color: c.textMuted}]}>
                                Enable logging streaks and achievement badges
                            </Text>
                        </View>
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
                        <Text style={[styles.chevron, { color: c.textMuted }]}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.saveBtn,
                            { backgroundColor: prefsSaved ? '#4caf50' : c.primary},
                        ]}
                        onPress={handleSavePreferences}
                        disabled={prefsSaving}  
                    >
                        <Text style={styles.saveBtnText}>
                            {prefsSaved? '✓ Saved' : prefsSaving ? 'Saving...' : 'Save Preferences'}
                        </Text>
                    </TouchableOpacity>
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
                            <Text style={[styles.notificationLabel, { color: theme.colors.text }]}>
                                Set daily reminder time 
                            </Text>
                            <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                                {`${dailyHour.toString().padStart(2, '0')}:${dailyMinute.toString().padStart(2, '0')}`}

                            </Text>
                        </TouchableOpacity>
                    )}

                    { showDailyTimePicker &&  (
                        <DateTimePicker
                            value={new Date(0, 0, 0, dailyHour, dailyMinute)}
                            mode="time"
                            is24Hour={true}
                            display="spinner"
                            onChange={(event, selectedDate) => {
                                setShowDailyTimePicker(false);
                                if (event.type === 'set' && selectedDate) {
                                    const newHour = selectedDate.getHours();
                                    const newMinute = selectedDate.getMinutes();
                                    setDailyHour(newHour);
                                    setDailyMinute(newMinute);

                                    (async () => {

                                        await AsyncStorage.setItem('dailyHour', newHour.toString());
                                        await AsyncStorage.setItem('dailyMinute', newMinute.toString());

                                        handleToggleDailyTracking(false, newHour, newMinute);
                                        setTimeout(() => handleToggleDailyTracking(true, newHour, newMinute), 100);
                                    })();
                                }
                            }}
                        />
                    )}

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

    preferenceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
    },

    preferenceLabelWrap: {
        flex: 1,
    },

    preferenceLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },

    preferenceHint: {
        fontSize: 12,
        lineHeight: 16,
    },

    divider: {
        height: 1,
        marginVertical: 2,
        opacity: 0.5,
    },

    stepper: {
        flexDirection: 'row',
        borderWidth: 1,
        borderRadius: 10,
        overflow: 'hidden',
        flexShrink: 0,
    },

    stepperBtn: {
        width: 36,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },

    stepperBtnText: {
        fontSize: 20,
        lineHeight: 24,
    },

    stepperValue: {
        width: 72,
        alignItems: 'center',
        justifyContent: 'center',
        borderLeftWidth: 1,
        borderRightWidth: 1,
    },

    stepperValueText: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 40,
    },

    segmentRow: {
        flexDirection: 'row',
        gap: 6,
        flexShrink: 0,
    },

    segmentBtn: {
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderWidth: 1,
        borderRadius: 8,
    },

    segmentBtnText: {
        fontWeight : '600',
    },

    disclaimerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },

    chevron: {
        fontSize: 22,
        fontWeight: '300',
    },

    saveBtn: {
        borderRadius: 12,
        padding: 14,
        alignItems: 'center',
        marginTop: 16,
    },

    saveBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },

    disclaimerOverlay: {
        flex: 1,
        backgroundColor: '#000000aa',
        justifyContent: 'center',
        padding: 24,
    },

    disclaimermodal: {
        borderRadius: 20,
        padding: 24,
    },

    disclaimerTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },

    disclaimerBody: {
        fontSize: 14,
        lineHeight: 22,
    },



});
// app/(tabs)/index.tsx

/*
    This file defines the main daily tracking screen of the app, where users can log their period and symptoms for each day.
    
    It includes: 
    - A greeting message that changes based on the time of day and includes the user's name.
    - A date selection strip that allows the user to select a date to view or log symptoms for, showing a horizontal list of dates centered around today.
    - A profile avatar that displays the user's initials and allows navigation to the profile screen.
    - A modal for logging symptoms and bleeding for the selected date, which includes options for different symptom categories, intensity levels for certain symptoms, and a notes section.
    - Integration with gamification features to show streaks and badges based on the user's logging activity.

    Key features:
    - Uses React Native components and Expo Router for navigation and layout.
    - Fetches and saves data to Firebase Firestore for user authentication and daily logs.
    - Implements a cycle prediction algorithm to calculate the user's current cycle day, average cycle length, and predict the next period date based on their logging history.
    - Provides a user-friendly interface for logging symptoms with options for intensity and notes, and displays relevant information based on the user's cycle data.

*/

// Imports
import { useDateFormat } from '@/context/DateFormatContext';
import { useGamification } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import { auth } from '@/firebase/config';
import { onAuthStateChanged } from '@firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, Dimensions, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CycleProgressRing from '../../components/CycleProgressRing';
import StreakWidget from '../../components/StreakWidget';
import { db } from '../../firebase/config';
import { saveDailyLog } from '../../firebase/dailyLogs';
import { buildCycles, DailyLog, getCycleProgress, predictNextPeriod } from '../utils/cyclePrediction';


// Symptoms that require intensity tracking
const intensitySymptoms = ["Cramps", "Headache", "Migraine", "Back pain", "Tender breasts", "Acne", "Nausea", "Joint pain", "Ovulation pain", "Insomnia", "Bloating", "Gas", "Diarrhoea", "Constipation"];

// Main daily tracking screen component
type SymptomEntry = {
    name: string; // Name of the symptom
    intensity?: number; // Optional intensity level for symptoms that require it (1-5)
}

// Categories of symptoms for logging, each with a key, title, and list of options
const symptomCategories = [

    // Mood-related symptoms category
    {
        key: "mood",
        title: "Feelings",
        options: ["Happy", "Calm", "Anxious", "Irritable", "Low mood", "Mood swings", "Emotional", "Energised", "Exhausted"],
    },

    // Physical symptoms category
    {
        key: "physical",
        title: "Physical",
        options: ["Cramps", "Headache", "Migraine", "Back pain", "Tender breasts", "Acne", "Nausea", "Joint pain", "Ovulation pain", "Insomnia"],
    },

    // Gut-related symptoms category
    {
        key: "gut",
        title: "Gut & Appetite",
        options: ["Bloating", "Gas", "Diarrhoea", "Constipation", "Low appetite", "Increased appetite", "Chocolate cravings", "Salty cravings"],
    },

    // Cervical mucus category
    {
        key: "mucus",
        title: "Cervical mucus",
        options: ["Mucus: None", "Watery", "Egg white", "Creamy", "Sticky", "Clumpy white", "Brown", "Pink"],
    },

    // Energy level category
    {
        key: "energy",
        title: "Energy level",
        options: ["High", "Medium", "Low"],
    },

    // Libido category
    {
        key: "libido",
        title: "Libido",
        options: ["High Libido", "Low Libido", "Solo", "Protected", "Unprotected"],
    },

    // Activities category
    {
        key: "activity",
        title: "Activities",
        options: ["Meditation", "Running", "Cardio", "Yoga", "Weights", "Dancing", "Relaxing", "Reading", "Napping", "Walking"],
    },

    // Cycle disruption category for tracking factors that may disrupt the menstrual cycle
    {
        key: "distuption",
        title: "Cycle disruption",
        options: ["Travel", "Illness", "Stress", "Sleep disruption", "Medication change"],
    },

    // Birth control methods category
    {
        key: "birthControl",
        title: "Birth control",
        options: ["BC: None", "Pill", "Missed Pill", "IUD", "Implant", "Injection", "Patch", "Ring", "Condoms", "Other"],
    },

    // Medication category for tracking any medications taken that may affect symptoms or cycle
    {
        key: "medication",
        title: "Medication",
        options: ["Painkillers", "Hormonal medication", "Antibiotics", "Antidepressants", "Anti-Anxiety", "Antipsychotics", "Antihistamines", "HRT", "Benzos", "Mood Stabilizers"],
    },

    // Supplements category for tracking any supplements taken that may affect symptoms or cycle
    {
        key: "supplements",
        title: "Supplements",
        options: ["Vitamins", "Magnesium", "Zinc", "Iron", "Omega 3", "Probiotics", "Adaptogens", "Protein powder", "Fiber supplements"],
    },
];

// Variable to calculate screen width and determine layout for date selection buttons
const SCREEN_WIDTH = Dimensions.get('window').width;
const AVAILABLE_WIDTH = SCREEN_WIDTH - 32; 
const DATE_ITEM_WIDTH = AVAILABLE_WIDTH / 7 - 8;

// Main component function for the daily tracking screen
export default function DailyTrackingScreen() {

    //Get theme colours
    const { theme } = useTheme();
    const c = theme.colors;

    // Router for navigation between screens
    const router = useRouter();

    // Get date formatting function from context for consistent date display
    const { formatDate } = useDateFormat();

    // Get gamification settings and functions from context for displaying streaks and badges
    const { gamificationEnabled } = useGamification();
    const { refreshGamification } = useGamification();

    // Get today's date 
    const getToday = new Date();

    // State variables 
    const [selectedDate, setSelectedDate] = useState(getToday);
    const [modalVisible, setModalVisible] = useState(false);
    const [bleeding, setBleeding] = useState<"None" | "Light" | "Medium" | "Heavy">("None");
    const [symptoms, setSymptoms] = useState<string[]>([]);
    const [userName, setUserName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [avgCycleLength, setAvgCycleLength] = useState<number | null>(null);
    const [nextPeriodDate, setNextPeriodDate] = useState<Date | null>(null);
    const [cycleDay, setCycleDay] = useState<number | null>(null);
    const [loadingCycleData, setLoadingCycleData] = useState(true);
    const [periodLength, setPeriodLength] = useState<number | null>(null);
    const [isBleedingToday, setIsBleedingToday] = useState(false);
    const [notes, setNotes] = useState<string>("");
    const [symptomsWithIntensity, setSymptomsWithIntensity] = useState<SymptomEntry[]>([]);
    const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
    const [selectedIntensity, setSelectedIntensity] = useState<number>(3);
    const [cycleDataLoadedOnce, setCycleDataLoadedOnce] = useState(false);
    const [hasLoggedToday, setHasLoggedToday] = useState(false);

    // Function to get a greeting message based on the current time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    };

    // Function to extract initials from the user's name for display in the profile avatar
    const getInitials = (name: string | null) => {
        if (!name) return "U";
        return name
            .split(" ") 
            .map(w => w[0]) 
            .slice(0, 2)
            .join("") 
            .toUpperCase(); 
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setLoading(false);
                return;
            }

            const [userSnapshot] = await Promise.all([
                getDoc(doc(db, 'users', user.uid)),
                fetchCycleData(),
            ]);

            if (userSnapshot.exists()) {
                setUserName(userSnapshot.data().name || "User");
            }

            refreshGamification();
            setLoading(false);
        });
        return unsubscribe;
    }, []);





    // Create a date range of 7 days centered around today for the date selection buttons
    const dateRange = Array.from({ length: 7 }, (_, i) => addDays(getToday, i - 3));

    // Function to toggle a symptom in the symptoms state array when the user selects or deselects it in the log modal
    const toggleSymptom = (symptom: string) => {
        if (symptoms.includes(symptom)) {
            setSymptoms(symptoms.filter(s => s !== symptom));
        } else {
            setSymptoms([...symptoms, symptom]);
        }
    };

    // Function to build menstrual cycles from the user's daily logs by identifying start and end dates of each cycle based on bleeding patterns
    const fetchCycleData = async () => {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch user-specific cycle length from Firestore to use as a baseline for predictions
        const userDocRef = doc(db, 'users', user.uid);
        const userSnapshot = await getDoc(userDocRef);
        const userCycleLength: number = userSnapshot.exists() ? (userSnapshot.data().cycleLength ?? 28) : 28;

        const logsRef = collection(db, 'users', user.uid, 'dailyLogs');
        const snapshot = await getDocs(logsRef);

        // Transform Firestore documents into DailyLog objects for processing
        const logs: DailyLog[] = snapshot.docs.map(doc => ({
            date: doc.id,
            bleeding: doc.data().bleeding || "None",
            symptoms: doc.data().symptoms || [],
            notes: doc.data().notes || "",
        }));

        // Build cycles from logs and calculate cycle progress and next period prediction
        const cycles = buildCycles(logs);
        const progress = getCycleProgress(cycles);
        const nextPeriod = predictNextPeriod(cycles);

        // If no cycles are found, reset all cycle-related state variables and mark cycle data as loaded to stop loading indicators
        if (cycles.length === 0) {
            setCycleDay(null);
            setAvgCycleLength(null);
            setNextPeriodDate(null);
            setPeriodLength(null);
            setCycleDataLoadedOnce(true);
            setLoadingCycleData(false);
            return;
        }

        // Variables to calculate current cycle day, average cycle length, next period date, and whether the user is currently bleeding based on the most recent cycle and today's date
        const today = new Date();
        const lastCycle = cycles[cycles.length - 1];
        const lastPeriodStart = new Date(lastCycle.startDate);
        const dayOfCycle = differenceInCalendarDays(today, lastPeriodStart) + 1;

        // Calculate actual period length for the current cycle by counting consecutive bleeding days from the start of the last cycle
        const periodLogs = logs
            .filter(log => new Date(log.date) >= lastPeriodStart)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let actualPeriodLength = 0;
        for (const log of periodLogs) {
            if (log.bleeding !== "None") {
                actualPeriodLength++;
            } else {
                break;
            }
        }

        const savedPeriodLength: number = userSnapshot.exists()
            ? (userSnapshot.data().periodLength ?? 5)
            : 5;
        
        const predictedPeriodLength = savedPeriodLength;
        setPeriodLength(actualPeriodLength > 0 ? Math.max(actualPeriodLength, savedPeriodLength) : savedPeriodLength);

    
        

        const todayStr = format(new Date(), "yyyy-MM-dd");
        const todayLog = logs.find(l => l.date === todayStr);
        const hasLoggedToday = logs.some(l => l.date === todayStr);
        setHasLoggedToday(hasLoggedToday);
        setIsBleedingToday(!!todayLog && todayLog.bleeding !== "None");

        const computedAvg = progress?.avgLength ?? null;
        setCycleDay(dayOfCycle);
        setAvgCycleLength(computedAvg !== null ? Math.max(computedAvg, userCycleLength) : userCycleLength);
        setNextPeriodDate(nextPeriod ?? null);
        setCycleDataLoadedOnce(true);
        setLoadingCycleData(false);  
    };

    // Focus effect to refresh cycle data whenever the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            fetchCycleData();
        }, [])
    );

    // Focus effect to refresh gamification data whenever the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            refreshGamification();
        }, [])
    );

    // Function to handle saving the daily log when the user submits the log modal
    const handleLog = async () => {
        if (!auth.currentUser) return;

        // Combine symptoms with intensity and regular symptoms into a single array for saving
        const intensityNames = new Set(symptomsWithIntensity.map(s => s.name));
        const finalSymptoms: SymptomEntry[] = [
            ...symptomsWithIntensity,
            ...symptoms
                .filter(name => !intensityNames.has(name))
                .map(name => ({ name })),
        ];

        // Prepare log data object with bleeding, symptoms, and optional notes to save to Firestore
        const logData: any = { bleeding, symptoms: finalSymptoms };
        if (notes?.trim()) logData.notes = notes.trim();

        // Save the log data to Firestore for the selected date and close the modal, then refresh cycle data to update the UI with any changes
        await saveDailyLog(auth.currentUser.uid, selectedDate, logData);
        setModalVisible(false);
        fetchCycleData();
        await refreshGamification();
    };

    // Function to load the daily log for a specific date when the user selects a date from the date strip or opens the log modal
    const loadLogForDate = async (date: Date) => {
        if (!auth.currentUser) return;

        // Reset log state variables before loading new data to ensure the modal shows the correct information for the selected date
        setBleeding("None");
        setSymptoms([]);
        setSymptomsWithIntensity([]);
        setNotes("");

        // Check if incognito logging mode is enabled in AsyncStorage, and if so, skip loading log data to respect user privacy
        const incognito = await AsyncStorage.getItem('privacyIncognitoLogging');
        if (incognito === 'true') return;

        // Load the log data for the selected date from Firestore and update state variables to populate the log modal with existing data for that date, allowing the user to view or edit their previous entries
        const dateStr = format(date, "yyyy-MM-dd");
        const logRef = doc(db, "users", auth.currentUser.uid, "dailyLogs", dateStr);
        const snap = await getDoc(logRef);

        // If a log exists for the selected date, populate the state variables with the existing data; otherwise, reset to default values for a new log entry
        if (snap.exists()) {
            const data = snap.data();
            setBleeding(data.bleeding || "None");
            setNotes(data.notes || "");

            // Variables to separate symptoms that have intensity levels from those that do not
            const withIntensity: SymptomEntry[] = [];
            const normalSymptoms: string[] = [];

            // Iterate through the symptoms in the log data and categorize them based on whether they have an intensity level, populating the respective state variables for symptoms with intensity and regular symptoms
            (data.symptoms || []).forEach((s: any) => {
                if (s?.intensity !== undefined) {
                    withIntensity.push({ name: s.name, intensity: s.intensity });
                }
            });

            // Create a set of symptom names that have intensity levels to avoid duplication when categorizing regular symptoms
            const intensityNames = new Set(withIntensity.map(s => s.name));

            // Iterate through the symptoms again to find those that do not have intensity levels and add them to the normalSymptoms array, ensuring that symptoms with intensity are not duplicated in the regular symptoms list
            (data.symptoms || []).forEach((s: any) => {
                if (s?.intensity === undefined) {
                    const name = s.name || s;
                    if (!intensityNames.has(name)) normalSymptoms.push(name);
                }
            });

            // Update state variables for symptoms with intensity and regular symptoms to populate the log modal with the correct information for the selected date
            setSymptomsWithIntensity(withIntensity);
            setSymptoms(normalSymptoms);
        } else {
            // If no log exists for the selected date, reset all log-related state variables to default values to allow the user to create a new log entry for that date without any pre-filled information
            setBleeding("None");
            setSymptoms([]);
            setSymptomsWithIntensity([]);
            setNotes("");
        }
    };

    const getDisplayName = (item: string) =>
        item.startsWith("Mucus: ") || item.startsWith("BC: ")
        ? "None"
        : item;

    // Refs for managing scroll position and text input focus in the log modal
    const scrollRef = React.useRef<ScrollView>(null);
    const notesInputRef = React.useRef<TextInput>(null);

    // If the data is still loading, show a loading indicator 
    if (loading || loadingCycleData) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: c.background }}>
                <ActivityIndicator size="large" color={c.primary} />
            </View>
        );
    }

    // Render the main UI of the daily tracking screen
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>

            {/* Top bar with greeting and profile avatar, showing the user's initials and allowing navigation to the profile screen */ }
            <View style={styles.topBar}>
                {/* Greeting message that changes based on the time of day and includes the user's name */ }
                <Text style={[styles.helloText, { color: c.text }]}>
                    {getGreeting()}, {userName}!
                </Text>
                {/* Profile avatar that displays the user's initials and navigates to the profile screen when pressed */ }
                <TouchableOpacity 
                    onPress={() => router.push("/(tabs)/profile")}
                    style={[styles.profileAvatar, {backgroundColor: c.primary}]}
                    activeOpacity={0.75}
                >
                    {/* Display the user's initials in the profile avatar */ }
                    <Text style={styles.profileAvatarText}>
                        {getInitials(userName)}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Date selection strip that allows the user to select a date to view or log symptoms for, showing a horizontal list of dates centered around today */ }
            <FlatList
                horizontal
                style={{ maxHeight: 110 }}
                data={dateRange}
                keyExtractor={(item) => item.toISOString()}
                scrollEnabled={false}
                contentContainerStyle={[
                    styles.dateStrip,
                    { 
                        flexGrow: 1,
                        justifyContent: "center",
                        alignItems: "center"
                    },
                ]}

                // Render each date in the date strip as a button that shows the day of the week and the day of the month
                renderItem={({ item }) => {
                    const isSelected = format(item, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                    return (
                        // Touchable button for each date that allows the user to select it and view or log symptoms
                        <TouchableOpacity
                            onPress={async () => {
                                setSelectedDate(item);
                                await loadLogForDate(item);
                                setModalVisible(true);
                            }}
                            style={[
                                styles.dateButton,
                                { backgroundColor: isSelected ? c.primary : c.surface },
                            ]}
                        >
                            <Text style={[styles.dateDay, { color: isSelected ? "#fff" : c.textMuted }]}> 
                                {format(item, "EEE")}
                            </Text>
                            <Text style={[styles.dateNum, { color: isSelected ? "#fff" : c.text }]}>
                                {format(item, "d")}
                            </Text>
                        </TouchableOpacity>
                    );
                }}
            />
        
            {/* Streak widget that shows the user's current streak of consecutive days logged, only visible if gamification is enabled in settings */ }
            <View style={{ paddingHorizontal: 20 }}>
                <StreakWidget hasLoggedToday={hasLoggedToday}/>
            </View>

            {/* Cycle progress ring that visually represents the user's current cycle day and average cycle length, showing a message when between cycles, and adjusting layout based on whether gamification is enabled */ }
            <View style={styles.cycleCircle}>
                {cycleDay !== null && avgCycleLength !== null ? (
                    <>
                        {/* Add extra padding above the cycle progress ring when gamification is enabled to accommodate the streak widget*/ }
                        {!gamificationEnabled && (
                            
                            <View style={{ paddingTop: 200 }}/> // When gamification is disabled 
                        )}
                        {gamificationEnabled && (
                            <View style={{ paddingTop: 50 }}/> // When gamification is enabled 
                        )}
                        {/* Cycle progress ring component that shows the user's current cycle  */ }
                        <CycleProgressRing
                            cycleDay={cycleDay}
                            avgLength={avgCycleLength}
                            periodLength={periodLength ?? 0}
                            isBleedingToday={isBleedingToday}
                        />
                    </>
                ) : (
                    // Show a message when there is no cycle data available, indicating that the user is between cycles 
                    <Text style={{ textAlign: "center", color: c.textSecondary }}>Between cycles</Text>
                )}
            </View>

            {/* Floating action button that allows the user to quickly add or view a log for the selected date, opening the log modal when pressed */ }
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: c.primary }]}
                onPress={async () => {
                    await loadLogForDate(selectedDate);
                    setModalVisible(true);
                }}
            >
                <Text style={{ color: "#fff", fontSize: 28 }}>+</Text>
            </TouchableOpacity>

            {/* Modal for logging symptoms and bleeding for the selected date, allowing the user to select bleeding level, symptoms with optional intensity, and add notes, with a save button to save the log to Firestore and a cancel button to close the modal without saving */ }
            <Modal visible={modalVisible} animationType="slide" transparent>
                {/* KeyboardAvoidingView to ensure the modal content is visible when the keyboard is open */ }
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style = {{ flex: 1}}
                >
                    <SafeAreaView style={styles.modalBackground}>
                        <View style={[styles.modalCard, { backgroundColor: c.card }]}>
                            <ScrollView 
                                ref={scrollRef}
                                style={styles.modalScrollContent} 
                                showsVerticalScrollIndicator={false}
                                keyboardShouldPersistTaps="handled"
                                contentContainerStyle={{ paddingBottom: 120}}
                            >

                                {/* Title of the log modal showing the selected date for which the user is logging symptoms */ }
                                <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10, color: c.text }}>
                                    Log for {formatDate(selectedDate)}
                                </Text>

                                {/* Section for selecting bleeding level with options for None, Light, Medium, and Heavy */ }
                                <Text style={{ marginBottom: 5, color: c.textSecondary }}>Bleeding:</Text>
                                {["None", "Light", "Medium", "Heavy"].map((level) => (
                                    <TouchableOpacity
                                        key={level}
                                        onPress={() => setBleeding(level as any)}
                                        style={[
                                            styles.optionButton,
                                            { backgroundColor: bleeding === level ? c.primary : c.surface },
                                        ]}
                                    >
                                        <Text style={{ color: bleeding === level ? "#fff" : c.text }}>{level}</Text>
                                    </TouchableOpacity>
                                ))}

                                {/* Section for selecting symptoms with optional intensity */ }
                                {symptomCategories.map((categoryData) => (
                                    <View key={categoryData.key} style={{ marginBottom: 15 }}>
                                        <Text style={{ fontWeight: "bold", marginBottom: 5, color: c.text }}>
                                            {categoryData.title}
                                        </Text>
                                        <FlatList
                                            horizontal
                                            data={categoryData.options}
                                            keyExtractor={(item) => item}
                                            showsHorizontalScrollIndicator={false}
                                            renderItem={({ item }) => {
                                                const hasIntensity = intensitySymptoms.includes(item);

                                                // Determine if the symptom is selected based on whether it has intensity and is in the symptomsWithIntensity array, or if it is in the regular symptoms array for symptoms without intensity tracking
                                                const isSelected = hasIntensity
                                                    ? !!symptomsWithIntensity.find(s => s.name === item) // Is selected if it has intensity and is found in the symptomsWithIntensity array
                                                    : symptoms.includes(item); // Is selected if it is found in the regular symptoms array
                                                const intensityEntry = symptomsWithIntensity.find(s => s.name === item);
                                                return (
                                                    <TouchableOpacity
                                                        onPress={() => {
                                                            if (hasIntensity) {
                                                                const existing = symptomsWithIntensity.find(s => s.name === item);
                                                                if (existing) {
                                                                    setSymptomsWithIntensity(prev =>
                                                                        prev.filter(s => s.name !== item)
                                                                    );
                                                                } else {
                                                                    setSelectedSymptom(item);
                                                                    setSelectedIntensity(3);
                                                                }
                                                            } else {
                                                                toggleSymptom(item);
                                                            }
                                                        }}
                                                        style={[
                                                            styles.optionButton, 
                                                            { backgroundColor: isSelected ? c.primary : c.surface, marginRight: 8, flexDirection: "row", alignItems: "center"},
                                                        ]}
                                                    >
                                                        {/* Display the symptom name with a different color if it is selected, and show an intensity badge if the symptom has intensity tracking and is selected */ }
                                                        <Text style={{ color: isSelected ? "#fff" : c.text, fontSize: 12 }}>
                                                            {getDisplayName(item)}
                                                        </Text>
                                                        {intensityEntry?.intensity !== undefined && (
                                                            <View style={{
                                                                marginLeft: 5,
                                                                backgroundColor: "##ffffff40",
                                                                borderWidth: 1,
                                                                borderColor: "#ffffff80",
                                                                width: 18,
                                                                height: 18,
                                                                borderRadius: 9,
                                                                alignItems: "center",
                                                                justifyContent: "center"


                                                            }}>
                                                                <Text style={{ color: "#fff", fontSize: 10, fontWeight: "700", lineHeight: 12}}>
                                                                    {intensityEntry.intensity}
                                                                </Text>
                                                            </View>
                                                        )}
                                                    </TouchableOpacity>
                                                );
                                            }}
                                        />
                                    </View>
                                ))}

                                {/* Section for adding notes about the day, with a multiline text input that expands as the user types and scrolls to the end when focused to ensure the input is visible above the keyboard */ }
                                <Text style={{ marginTop: 10, marginBottom: 5, color: c.textSecondary }}>Notes:</Text>
                                <TextInput
                                    ref={notesInputRef}
                                    value={notes}
                                    onChangeText={setNotes}
                                    onFocus={() => {
                                        setTimeout(() => {
                                            scrollRef.current?.scrollToEnd({ animated: true });
                                        }, 200); // Delay to ensure the keyboard is fully open before scrolling to the end of the content
                                    }}
                                    placeholder="Anything you noticed today?"
                                    placeholderTextColor={c.textMuted}
                                    multiline
                                    style={{
                                        borderWidth: 1,
                                        borderColor: c.border,
                                        borderRadius: 8,
                                        padding: 10,
                                        minHeight: 80,
                                        textAlignVertical: "top",
                                        color: c.text,
                                        backgroundColor: c.surface,
                                    }}
                                />

                                {/* Save and Cancel buttons for the log modal, allowing the user to save their log data to Firestore or cancel and close the modal without saving */ }
                                <Button title="Save Log" onPress={handleLog} color={c.primary} />
                                <Button title="Cancel" onPress={() => setModalVisible(false)} color={c.textMuted} />

                                {/* Modal for selecting intensity level of symptoms that have intensity tracking, showing a circular selector with intensity levels from 1 to 5 and a save button to update the symptom intensity in the log */ }
                                <Modal visible={!!selectedSymptom} animationType="fade" transparent>
                                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000000aa" }}>
                                        <View style={{ backgroundColor: c.card, padding: 20, borderRadius: 12, width: 250 }}>

                                            {/* Title of the intensity selection modal */ }
                                            <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 10, color: c.text }}>
                                                {selectedSymptom} Intensity
                                            </Text>

                                            {/* Current intensity level display */ }
                                            <Text style={{ fontSize: 14, marginBottom: 10, color: c.textSecondary }}>
                                                Current Intensity: {selectedIntensity}
                                            </Text>

                                            {/* Circular selector for intensity levels from 1 to 5, allowing the user to select the intensity level for the symptom */ }
                                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
                                                {[1, 2, 3, 4, 5].map((level) => (
                                                    <TouchableOpacity
                                                        key={level}
                                                        onPress={() => setSelectedIntensity(level)}
                                                        style={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 20,
                                                            backgroundColor: selectedIntensity === level ? c.primary : c.surface,
                                                            justifyContent: "center",
                                                            alignItems: "center",
                                                        }}
                                                    >
                                                        {/* Display the intensity level number with a different color if it is selected */ }
                                                        <Text style={{ color: selectedIntensity === level ? "#fff" : c.text }}>
                                                            {level}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>

                                            {/* Save and Cancel buttons for the intensity selection modal, allowing the user to save the selected intensity level for the symptom or cancel and close the modal without saving */ }
                                            <Button
                                                title="Save"
                                                color={c.primary}
                                                onPress={() => {
                                                    setSymptomsWithIntensity(prev => {
                                                        const filtered = prev.filter(s => s.name !== selectedSymptom);
                                                        return [...filtered, { name: selectedSymptom!, intensity: selectedIntensity }];
                                                    });
                                                    setSelectedSymptom(null);
                                                }}
                                            />
                                            <Button title="Cancel" onPress={() => setSelectedSymptom(null)} color={c.textMuted} />
                                        </View>
                                    </View>
                                </Modal>
                            </ScrollView>
                        </View>
                    </SafeAreaView>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

// Styles
const styles = StyleSheet.create({

    // Style for the top bar containing the greeting and profile avatar
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 0,
    },

    // Style for the greeting text in the top bar
    helloText: {
        fontSize: 25,
        fontWeight: "bold",
    },

    // Style for the profile avatar in the top bar, showing the user's initials with a background color and circular shape
    profileIcon: {
        fontSize: 24,
    },

    // Style for the date strip that contains the date selection buttons
    dateStrip: {
        paddingHorizontal: 12,
        paddingTop: 8,
        paddingBottom: 4,
    },

    // Style for each date button in the date strip
    dateButton: {
        marginTop: 20,
        width: DATE_ITEM_WIDTH,
        height: 70,
        borderRadius: 12,
        marginHorizontal: 4,
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
    },

    // Style for the day of the week text in each date button
    dateDay: {
        fontSize: 11,
        fontWeight: "600",
        letterSpacing: 0.3,
    },

    // Style for the day of the month text in each date button
    dateNum: {
        fontSize: 17,
        fontWeight: "700",
    },
    
    // Style for the container of the cycle progress ring
    cycleCircle: {
        marginTop: 8,
        marginBottom: 20,
        alignSelf: "center",
        width: 220,
        height: 220,
        justifyContent: "center",
        alignItems: "center",
    },

    // Style for each item in the legend of the cycle progress ring
    modalBackground: {
        flex: 1,
        backgroundColor: "#000000aa",
        justifyContent: "center",
    },

    // Style for the background overlay of the log modal
    optionButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 5,
        position: "relative",
    },

    // Style for the floating action button that allows the user to quickly add or view a log for the selected date
    fab: {
        position: "absolute",
        bottom: 30,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: "center",
        alignItems: "center",
        elevation: 4,
    },

    // Style for each item in the legend of the cycle progress ring
    modalCard: {
        marginHorizontal: 20,
        borderRadius: 12,
        maxHeight: "90%",
    },

    // Style for the scroll content inside the log modal
    modalScrollContent: {
        padding: 20,
        paddingBottom: 40,
    },

    // Style for the profile avatar that displays the user's initials
    profileAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: "center",
        alignItems: "center",
        flexShrink: 0,
    },

    // Style for the text inside the profile avatar
    profileAvatarText: {
        color: "#fff",
        fontWeight: "700",
        letterSpacing: 0.5,
        fontSize: 14,
    },

});
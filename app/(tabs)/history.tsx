// app/(tabs)/history.tsx

/*
    This file defines the HistoryScreen component, which is responsible for:
    - Displaying a calendar view of the user's daily logs, with different colors indicating bleeding levels.
    - Allowing users to tap on a date to view or edit the log for that day in a modal.
    - Displaying key statistics about the user's cycle, such as current cycle day, average cycle length, and estimated days until the next period.
    - Providing a list of recent logs with quick information about bleeding level and symptom count.
    
    Key features:
    - Uses the react-native-calendars library to display a calendar view with marked dates based on the user's logs.
    - Fetches log data from Firestore and updates the calendar markings and recent logs list accordingly.
    - Implements a modal that allows users to view and edit the details of their daily log, including bleeding level, symptoms (with optional intensity), and notes.
    - Calculates and displays statistics about the user's cycle based on their logged data, providing insights into their cycle patterns.
    
*/

// Imports
import { useDateFormat } from '@/context/DateFormatContext';
import { useTheme } from '@/context/ThemeContext';
import { auth, db } from '@/firebase/config';
import { useFocusEffect } from '@react-navigation/native';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { collection, deleteDoc, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveDailyLog } from '../../firebase/dailyLogs';

// List of symptoms that require intensity tracking
const intensitySymptoms = ["Cramps", "Headache", "Migraine", "Back pain", "Tender breasts", "Acne", "Nausea", "Joint pain", "Ovulation pain", "Insomnia", "Bloating", "Gas", "Diarrhoea", "Constipation"];

// Type for symptom entries
type SymptomEntry = {
    name: string; // Name of the symptom (e.g., "Cramps", "Headache")
    intensity?: number; // Optional intensity level for symptoms that require it (1-5 scale)
}

// Predefined categories of symptoms and options for logging, used to structure the symptom logging UI
const symptomCategories = [
    {
        // Category for mood-related symptoms
        key: "mood",
        title: "Feelings",
        options: ["Happy", "Calm", "Anxious", "Irritable", "Low mood", "Mood swings", "Emotional", "Energised", "Exhausted"],
    },
    {
        // Category for physical symptoms commonly associated with menstrual cycles
        key: "physical",
        title: "Physical",
        options: ["Cramps", "Headache", "Migraine", "Back pain", "Tender breasts", "Acne", "Nausea", "Joint pain", "Ovulation pain", "Insomnia"],
    },
    {
        // Category for digestive symptoms that can occur during the menstrual cycle
        key: "gut",
        title: "Gut & Appetite",
        options: ["Bloating", "Gas", "Diarrhoea", "Constipation", "Low appetite", "Increased appetite", "Chocolate cravings", "Salty cravings"],
    },
    {
        // Category for tracking cervical mucus, which can provide insights into fertility and cycle phases
        key: "mucus",
        title: "Cervical mucus",
        options: ["None", "Watery", "Egg white", "Creamy", "Sticky", "Clumpy white", "Brown", "Pink"],
    },
    {
        // Category for energy levels, which can fluctuate throughout the menstrual cycle
        key: "energy",
        title: "Energy level",
        options: ["High", "Medium", "Low"],
    },
    {
        // Category for libido
        key: "libido",
        title: "Libido",
        options: ["High Libido", "Low Libido", "Solo", "Protected", "Unprotected"],
    },
    {
        // Category for tracking physical activities 
        key: "activity",
        title: "Activities",
        options: ["Meditation", "Running", "Cardio", "Yoga", "Weights", "Dancing", "Relaxing", "Reading", "Napping", "Walking"],
    },
    {
        // Category for disruptions to the cycle, which can be important for understanding irregularities or changes in patterns
        key: "disruption",
        title: "Cycle disruption",
        options: ["Travel", "Illness", "Stress", "Sleep disruption", "Medication change"],
    },
    {
        // Category for birth control methods 
        key: "birthControl",
        title: "Birth control",
        options: ["None", "Pill", "Missed Pill", "IUD", "Implant", "Injection", "Patch", "Ring", "Condoms", "Other"],
    },
    {
        // Category for tracking medication use
        key: "medication",
        title: "Medication",
        options: ["Painkillers", "Hormonal medication", "Antibiotics", "Antidepressants", "Anti-Anxiety", "Antipsychotics", "Antihistamines", "HRT", "Benzos", "Mood Stabilizers"],
    },
    {
        // Category for supplements
        key: "supplements",
        title: "Supplements",
        options: ["Vitamins", "Magnesium", "Zinc", "Iron", "Omega 3", "Probiotics", "Adaptogens", "Protein powder", "Fiber supplements"],
    }
];

// Type for daily log
type DailyLog = {
    id: string; // Unique identifier for the log
    bleeding: string; // Bleeding level (e.g., "None", "Light", "Medium", "Heavy")
    symptoms: string[] | SymptomEntry[]; // List of symptoms, which can be either simple strings or objects with intensity
    date?: string; // Optional date of the log entry
    notes?: string; // Optional notes field for additional information about the day's symptoms or experiences
};

// Color mapping for different bleeding levels, used to visually differentiate log entries based on bleeding severity
const BLEEDING_COLORS: Record<string, string> = {
    Heavy: "#c2185b", // Deep pink color for heavy bleeding
    Medium: "#e361a8", // Lighter pink for medium bleeding
    Light: "#f5a9cb", // Very light pink for light bleeding
    None: "#64b5fb", // Blue color for no bleeding
};

// Labels for bleeding levels, using emojis to provide a quick visual representation of the bleeding severity in the UI
const BLEEDING_LABELS: Record<string, string> = {
    Heavy: "🩸🩸🩸", 
    Medium: "🩸🩸",
    Light: "🩸",
    None: "o",
};

// The HistoryScreen component 
export default function HistoryScreen() {

    // Access theme and date formatting contexts
    const { theme } = useTheme();
    const c = theme.colors;

    // Get the formatDate function from the DateFormatContext to format dates according to user preferences
    const { formatDate } = useDateFormat();

    // State variables 
    const [markedDates, setMarkedDates] = useState<any>({});
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [log, setLog] = useState<DailyLog | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [calendarKey, setCalendarKey] = useState(0);
    const [notes, setNotes] = useState<string>("");
    const [symptomsWithIntensity, setSymptomsWithIntensity] = useState<SymptomEntry[]>([]);
    const [selectedSymptom, setSelectedSymptom] = useState<string | null>(null);
    const [selectedIntensity, setSelectedIntensity] = useState<number>(3);
    const [allLogs, setAllLogs] = useState<{ id: string; bleeding: string; symptomCount: number }[]>([]);
    
    // State variables for bleeding level and symptoms, which are used when viewing or editing a specific log entry in the modal
    const [bleeding, setBleeding] = useState<"None" | "Light" | "Medium" | "Heavy">("None");
    const [symptoms, setSymptoms] = useState<string[]>([]);

    // Function to calculate statistics about the user's cycle 
    const getStats = () => {
        // Sort logs by date and filter to only include days with bleeding
        const sorted = [...allLogs]
            .filter(l => l.bleeding !== "None")
            .sort((a, b) => a.id.localeCompare(b.id));

        // Group consecutive bleeding days into periods
        const periodStarts: string[] = [];
        sorted.forEach((log, i) => {
            const prev = sorted[i - 1];
            const daysSincePrev = prev
                ? differenceInCalendarDays(parseISO(log.id), parseISO(prev.id)) // Calculate days between current log and previous log
                : 999; // If there is no previous log, set a large number to ensure the first log is treated as a new period
            if (daysSincePrev > 2) {
                periodStarts.push(log.id);
            }
        });

        // Calculate current cycle day based on the most recent period start, average cycle length based on the gaps between period starts, and estimate days until next period
        const lastPeriodStart = periodStarts[periodStarts.length - 1];
        const cycleDay = lastPeriodStart
            ? differenceInCalendarDays(new Date(), parseISO(lastPeriodStart)) + 1 // Calculate cycle day by finding the difference between today and the last period start, adding 1 to make it 1-indexed
            : null; // If there is no period start, cycle day cannot be calculated and is set to null

        // Calculate average cycle length by finding the gaps between period starts and averaging them
        let avgLength: number | null = null;
        if (periodStarts.length >= 2) {
            const gaps = [];
            for (let i = 1; i < periodStarts.length; i++) {
                gaps.push(differenceInCalendarDays(parseISO(periodStarts[i]), parseISO(periodStarts[i - 1]))); // Calculate the gap between consecutive period starts and add it to the gaps array
            }avgLength = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
        }
            
        // Estimate days until next period 
        const nextPeriod = lastPeriodStart && avgLength
            ? differenceInCalendarDays(
                new Date(parseISO(lastPeriodStart).getTime() + avgLength * 86400000), // Calculate the estimated next period date by adding the average cycle length (in milliseconds) to the last period start date, and then finding the difference in days between that date and today
                new Date() 
            )
            : null; // If there is no last period start or average length, next period cannot be estimated and is set to null

        return { cycleDay, avgLength, nextPeriod, totalLogs: allLogs.length };
    };

    // Get the dot color for a given bleeding level
    const getDotColor = (bleeding: string) => {
        return BLEEDING_COLORS[bleeding] || BLEEDING_COLORS["None"];
    };

    // Load marked dates and logs from Firestore, and update the state with the marked dates for the calendar and the list of all logs
    const loadMarkedDates = async () => {
        const user = auth.currentUser;
        if (!user) return;

        // Fetch all daily logs for the user from Firestore
        const logsRef = collection(db, 'users', user.uid, 'dailyLogs');
        const snapshot = await getDocs(logsRef);

        // Create an object to hold the marked dates for the calendar, and an array to hold all logs with their bleeding level and symptom count
        const marked: any = {};
        const logs: { id: string; bleeding: string; symptomCount: number }[] = [];

        // Iterate through each log document and populate the marked object with the bleeding level and corresponding dot color for the calendar, as well as adding the log information to the logs array
        snapshot.docs.forEach((doc) => {
            marked[doc.id] = {
                marked: true,
                dotColor: getDotColor(doc.data().bleeding || "None"),
            };
            logs.push({
                id: doc.id,
                bleeding: doc.data().bleeding || "None",
                symptomCount: (doc.data().symptoms || []).length,
            });
        });

        // Ensure that today's date is always marked on the calendar, even if there is no log for today
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        marked[todayStr] = {
            ...(marked[todayStr] || {}),
            selected: true,
            selectedColor: c.primary,
            marked: !!(marked[todayStr]?.marked),
            dotColor: marked[todayStr]?.dotColor,
        };

        // Update the state with the marked dates for the calendar and the list of all logs, and set loading to false
        setMarkedDates(marked);
        setAllLogs(logs);
        setLoading(false);
    };

    // Use the useFocusEffect hook to load marked dates and logs whenever the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadMarkedDates();
            setCalendarKey((prev) => prev + 1);
        }, [])
    );

    // Function to open the intensity modal for a symptom that requires intensity tracking
    const openIntensityModal = (symptom: string) => {
        const entry = symptomsWithIntensity.find(s => s.name === symptom);
        setSelectedSymptom(symptom);
        setSelectedIntensity(entry?.intensity || 3); // If the symptom already has an intensity, use it; otherwise, default to 3
    };

    // Function to handle saving the log when the user presses the save button in the modal
    const handleLog = async () => {
        if (!auth.currentUser || !selectedDate) return;
        
        // Create a set of symptom names that have intensity values
        const intentsityNames = new Set(symptomsWithIntensity.map(s => s.name));

        // Combine symptoms with intensity and regular symptoms into a single array of symptom entries
        const finalSymptoms: SymptomEntry[] = [
            ...symptomsWithIntensity, // Include symptoms that have intensity values as they are
            ...symptoms // Include regular symptoms as entries with just the name
            .filter(name => !intentsityNames.has(name)) // Filter out any regular symptoms that already have an intensity entry to avoid duplicates
            .map(name => ({ name })), // Map remaining regular symptoms to SymptomEntry objects with just the name
        ];

        // Create the log data object to be saved
        const logData: any = {
            bleeding,
            symptoms: finalSymptoms,
        };

        // If there are notes, add them to the log data object
        if (notes.trim()) {
            logData.notes = notes.trim();
        }

        // Save the log data to Firestore
        await saveDailyLog(auth.currentUser.uid, new Date(selectedDate), logData);

        // Close the modal, reload the marked dates and logs to update the calendar and recent logs list, show a success alert, and reset the selected symptom state
        setModalVisible(false);
        await loadMarkedDates();
        setCalendarKey((prev) => prev + 1);
        Alert.alert('Saved!', 'Your daily log has been saved successfully.');
        setSelectedSymptom(null);
    };  

    // Function to handle when a day is pressed on the calendar
    const onDayPress = async (day: any) => {
        const date = day.dateString;
        setSelectedDate(date);
        await loadLogForDate(new Date(date));
        
        // Open the modal to view or edit the log for the selected date
        setModalVisible(true);
    };

    // Function to toggle a symptom in the list of symptoms for the log
    const toggleSymptom = (symptom: string) => {
      setSymptoms((prev) =>
        prev.includes(symptom)
          ? prev.filter((s) => s !== symptom)
          : [...prev, symptom]
      );
    };
            
    // Function to handle deleting a log
    const handleDeleteLog = async () => {
        if (!selectedDate) return;
        const user = auth.currentUser;
        if (!user) return;

        await deleteDoc(doc(db, 'users', user.uid, 'dailyLogs', selectedDate));

        setLog(null);
        setModalVisible(false);

        await loadMarkedDates();

        Alert.alert('Deleted!', 'Your daily log has been deleted successfully.');
    };

    // Function to load the log for a specific date from Firestore and update the state with the log's details
    const loadLogForDate = async (date: Date) => {
        if (!auth.currentUser) return;

        // Set the default log values
        setBleeding("None");
        setSymptoms([]);
        setSymptomsWithIntensity([]);
        setNotes("");
        
        // Fetch the log document for the specified date from Firestore
        const dateStr = format(date, 'yyyy-MM-dd');
        const logRef = doc(db, 'users', auth.currentUser.uid, 'dailyLogs', dateStr);
        const snap = await getDoc(logRef);

        // If the log exists, update the state with the log's bleeding level, symptoms, and notes
        if (snap.exists()) {
            const data = snap.data();

            // Set the bleeding level and notes from the log data
            setBleeding(data.bleeding || "None");
            setNotes(data.notes || "");

            // Separate symptoms into those with intensity and those without
            const withIntensity: SymptomEntry[] = [];
            const normalSymptoms: string[] = [];

            // For each symptom in the log data, check if it has an intensity value
            (data.symptoms || []).forEach((s: any) => {
            if (s?.intensity !== undefined) {
                withIntensity.push({ name: s.name, intensity: s.intensity }); // If the symptom has an intensity value, add it to the withIntensity array as a SymptomEntry object
            } 
            });

            // Create a set of symptom names that have intensity values to help separate out regular symptoms
            const intensityNames = new Set(withIntensity.map(s => s.name));

            // For each symptom in the log data, if it does not have an intensity value and is not already included in the withIntensity array, add it to the normalSymptoms array as a simple string
            (data.symptoms || []).forEach((s: any) => {
            if (s?.intensity === undefined) {
                const name = s.name || s;
                if (!intensityNames.has(name)) {
                normalSymptoms.push(name);
                }
            }
            });

            // Update the state with the separated symptoms with intensity and regular symptoms
            setSymptomsWithIntensity(withIntensity);
            setSymptoms(normalSymptoms);
        } else {
            // If there is no log for the selected date, reset the state to default values
            setBleeding("None");
            setNotes("");
            setSymptoms([]);
            setSymptomsWithIntensity([]);
        }
      
    };

    // Function to close the modal and reset the selected date state
    const closeModal = () => {
        setModalVisible(false);
        setSelectedDate(null);
    };

    // Calculate statistics about the user's cycle using the getStats function, and create a list of recent logs sorted by date to display in the UI
    const stats = getStats();
    const recentLogs = [...allLogs].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 6);

    // Refs for the scroll view and notes input, which can be used to programmatically scroll to the notes section or focus the input when needed
    const scrollRef = React.useRef<ScrollView>(null);
    const notesInputRef = React.useRef<TextInput>(null);

    // If the screen is in a loading state, display a loading indicator centered on the screen
    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: c.background }]}>
                <ActivityIndicator size="large" color={c.primary} />
            </View>
        );
    }

    // Render the main content of the History screen
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <ScrollView showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Title */ }
            <Text style={[styles.title, { color: c.text }]}>History</Text>

            {/* Statistics row, which displays key information about the user's cycle */}
            <View style={styles.statsRow}>
                {[
                    { label: "Cycle Day", value: stats.cycleDay ? `${stats.cycleDay}` : "N/A" },
                    { label: "Average Length", value: stats.avgLength ? `${stats.avgLength} days` : "N/A" },
                    { label: "Next Period", value: stats.nextPeriod !==  null ? `${stats.nextPeriod} days` : "N/A" },
                    { label: "Logs", value: `${stats.totalLogs}` },
                ].map((stat, i) => (
                    <View key={i} style={[styles.statCard, { backgroundColor: c.card, borderColor: c.border }]}>
                        <Text style={[styles.statValue, { color: c.primary }]}>{stat.value}</Text>
                        <Text style={[styles.statLabel, { color: c.textMuted }]}>{stat.label}</Text>
                    </View>
                ))}
            </View> 

            {/* Calendar component, which displays the user's logs on a calendar view and allows them to select a date to view or edit the log for that day */ }
            <View style={[ styles.calendarCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <Calendar
                    key={calendarKey}
                    current={format(new Date(), 'yyyy-MM-dd')}
                    markedDates={markedDates}
                    onDayPress={onDayPress}
                    markingType={'dot'}
                    theme={{
                        calendarBackground: 'transparent',
                        dayTextColor: c.text,
                        monthTextColor: c.text,
                        todayTextColor: c.primary,
                        arrowColor: c.primary,
                        selectedDayBackgroundColor: c.primary,
                    
                        textDisabledColor: c.textMuted,
                        textDayFontSize: 14,
                        textMonthFontSize: 15,
                        textDayHeaderFontSize: 12,
                        textDayFontWeight: "400",
                        textMonthFontWeight: "700",
                        textDayHeaderFontWeight: "500",
                        
                    }}
                />
            </View>

            {/* Legend for the calendar, which explains the meaning of the different dot colors and symbols used in the calendar to represent bleeding levels */ }
            <View style={[ styles.legendRow, { backgroundColor: c.card, borderColor: c.border }]}>
                {[
                    { label: "Heavy", color: BLEEDING_COLORS["Heavy"] },
                    { label: "Medium", color: BLEEDING_COLORS["Medium"] },
                    { label: "Light", color: BLEEDING_COLORS["Light"] },
                    { label: "None", color: BLEEDING_COLORS["None"] },
                ].map((item, i) => (
                    <View key={i} style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                        <Text style={[styles.legendLabel, { color: c.text }]}>{item.label}</Text>
                    </View>
                ))}
            </View>

            {/* Recent logs section, which displays a list of the user's most recent log entries with key information about each log, and allows the user to tap on a log to view or edit it in the modal */ }
            {recentLogs.length > 0 && (
                <View style={{ marginTop: 20 }}>
                    <Text style={[styles.sectionTitle, { color: c.text }]}>Recent Logs</Text>
                    {recentLogs.map((log) => (
                        <TouchableOpacity
                            key={log.id}
                            onPress={() => onDayPress({ dateString: log.id})}
                            activeOpacity={0.75}
                        >
                            <View style={[styles.recentCard, { backgroundColor: c.card, borderColor: c.border }]}>

                                {/* Left section of the recent log card, which displays a bleeding icon with a background color corresponding to the bleeding level of the log */ }
                                <View style={[styles.recentLeft, { backgroundColor: BLEEDING_COLORS[log.bleeding] + '33' }]}>
                                    <Text style={[styles.recentBleedingIcon, { color: c.primary}]}>
                                        {BLEEDING_LABELS[log.bleeding]}
                                    </Text>
                                </View> 

                                {/* Middle section of the recent log card, which displays the date and symptom information for the log */ }
                                <View style={styles.recentMid}>
                                    <Text style={[styles.recentDate, { color: c.text }]}>
                                        {format(parseISO(log.id), 'EEE d MMM')}
                                    </Text>
                                    <Text style={[styles.recentSub, { color: c.textMuted}]}>
                                        {log.symptomCount > 0 ? `${log.symptomCount} symptom${log.symptomCount > 1 ? 's' : ''}` : 'No symptoms logged'}
                                    </Text>
                                </View>

                                {/* Right section of the recent log card, which displays a badge indicating the bleeding level of the log */ }
                                <View style={[styles.bleedingBadge, { backgroundColor: BLEEDING_COLORS[log.bleeding] + '22', borderColor: BLEEDING_COLORS[log.bleeding] + '55' }]}>
                                    <Text style={[styles.bleedingBadgeText, { color:log.bleeding === "None" ? c.textMuted : "#d63a6e" }]}>
                                        {BLEEDING_LABELS[log.bleeding]}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </ScrollView>
        
        {/* Modal for viewing and editing a log entry, which allows the user to see the details of a log for a specific date */ }
        <Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent onRequestClose={closeModal}>

            {/* Make sure keyboard doesn't overlap the input fields */ }
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <SafeAreaView style={styles.modalBackground}>
                    <View style={[styles.modalCard, { backgroundColor: c.card }]}>
                        <ScrollView 
                            ref={scrollRef}
                            contentContainerStyle={[styles.modalScrollContent, {paddingBottom: 120}]}
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}>

                            {/* Title of the modal, which displays the date of the log being viewed or edited */ }
                            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10, color: c.text }}>
                                Log for {selectedDate ? formatDate(selectedDate) : 'Unknown Date'}
                            </Text>

                            {/* Section for logging bleeding level, which allows the user to select the bleeding level for the log using buttons that update the state when pressed */ }
                            <Text style={{ marginBottom: 5, color: c.textSecondary }}>Bleeding:</Text>
                            {["None", "Light", "Medium", "Heavy"].map((level) => (
                                <TouchableOpacity
                                key={level}
                                onPress={() => setBleeding(level as any)}
                                style={[styles.optionButton, { backgroundColor: bleeding === level ? c.primary : c.surface }]}
                                >
                                <Text style={{ color: bleeding === level ? "#fff" : c.text }}>
                                    {level}
                                </Text>
                                </TouchableOpacity>
                            ))}

                            {/* Section for logging symptoms, which displays the predefined symptom categories and options, and allows the user to select symptoms and specify intensity for certain symptoms that require it */ }
                            {symptomCategories.map((category) => (
                                <View key={category.key} style={{ marginTop: 15 }}>
                                <Text style={{ fontWeight: "bold", marginBottom: 5, color: c.text }}>{category.title}</Text>

                                {/* FlatList for displaying the symptom options for each category, which allows horizontal scrolling and renders buttons for each symptom option that can be toggled on or off, and opens the intensity modal for symptoms that require intensity tracking when pressed */ }
                                <FlatList
                                    horizontal
                                    data={category.options}
                                    keyExtractor={(item) => item}
                                    showsHorizontalScrollIndicator={false}
                                    nestedScrollEnabled
                                    renderItem={({ item }) => {
                                    const hasIntensity = intensitySymptoms.includes(item);
                                    const isSelected = hasIntensity
                                        ? !!symptomsWithIntensity.find(s => s.name === item) // If the symptom has intensity, check if it is included in the symptomsWithIntensity array to determine if it is selected
                                        : symptoms.includes(item); // If the symptom does not have intensity, check if it is included in the symptoms array to determine if it is selected
                                    const intensityEntry = symptomsWithIntensity.find(s => s.name === item);
                                    return (
                                        // Render a button for each symptom option, which updates the state when pressed to toggle the symptom on or off, and opens the intensity modal for symptoms that require intensity tracking
                                        <TouchableOpacity
                                            onPress={() => {
                                                if (intensitySymptoms.includes(item)) {
                                                    const existing = symptomsWithIntensity.find(s => s.name === item);
                                                    if (existing) {
                                                        setSymptomsWithIntensity(prev => prev.filter(s => s.name !== item));
                                                    } else {
                                                        setTimeout(() => openIntensityModal(item), 0);
                                                    }
                                                } else {
                                                    toggleSymptom(item);
                                                }
                                            }}
                                            style={[
                                                styles.optionButton,
                                                { backgroundColor: isSelected ? c.primary : c.surface, marginRight: 8, flexDirection: "row", alignItems: "center" },
                                            ]}
                                        >
                                            {/* Display the symptom name, and if the symptom has intensity tracking and is selected, also display a badge with the intensity level */ }
                                            <Text style={{ color: isSelected ? "#fff" : c.text, fontSize: 12 }}>
                                                {item}
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

                            {/* Section for logging notes, which provides a text input for the user to enter any additional information about their symptoms or experiences for the day, and automatically scrolls to the input when it is focused to ensure it is visible above the keyboard */ }
                            <Text style={{ marginTop: 10, marginBottom: 5, color: c.textSecondary }}>Notes:</Text>
                            <TextInput
                                ref={notesInputRef}
                                value={notes}
                                onChangeText={setNotes}
                                onFocus={() => {
                                    setTimeout(() => {
                                        scrollRef.current?.scrollToEnd({ animated: true });
                                    }, 200);
                
                                }}
                                placeholder="Anything you noticed today?"
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
                                
                            {/* Buttons for saving the log, deleting the log, or canceling and closing the modal */ }
                            <Button title="Save Log" onPress={handleLog} color={c.primary}/>
                            <Button title="Delete Log" onPress={handleDeleteLog} color={c.error} />
                            <Button title="Cancel" onPress={closeModal} color={c.textMuted} />

                            {/* Modal for selecting intensity level for symptoms that require intensity tracking */ }
                            {selectedSymptom && (
                                <Modal 
                                key ={selectedSymptom}
                                visible={true} 
                                animationType="fade" 
                                transparent
                                statusBarTranslucent
                                onRequestClose={() => setSelectedSymptom(null)}
                                >
                                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000000aa" }}>
                                    <View style={{ backgroundColor: c.card, padding: 20, borderRadius: 12, width: 250 }}>
                                    <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 10, color: c.text  }}>{selectedSymptom} Intensity</Text>
                                    <Text style={{ fontSize: 14, marginBottom: 10, color: c.textSecondary }}>Current Intensity: {selectedIntensity}</Text>

                                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
                                        {[1, 2, 3, 4, 5].map((level) => ( // Render buttons for selecting intensity levels from 1 to 5
                                        <TouchableOpacity
                                            key={level}
                                            onPress={() => setSelectedIntensity(level)}
                                            style={{
                                            width: 40, height: 40, borderRadius: 20,
                                            backgroundColor: selectedIntensity === level ? c.primary : c.surface,
                                            justifyContent: "center", alignItems: "center",
                                            }}
                                        >
                                            <Text style={{ color: selectedIntensity === level ? "#fff" : c.text }}> {level}</Text>
                                        </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Buttons for saving the selected intensity level for the symptom */ }
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
                            )}
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
    
    // Style for the main container of the History screen
    container: {
        flex: 1,
        padding: 20,
    },

    // Style for the title text at the top of the History screen
    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 10,
    },

    // Style for the background of the modal, which darkens the screen behind the modal content to focus attention on the modal
    modalBackground: {
        flex: 1,
        backgroundColor: "#000000aa",
        justifyContent: "center",
    },

    // Style for the container of the modal content
    modalContainer: {
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 10,
    },

    // Style for the title text within the modal
    modalTitle: {
        fontWeight: "bold",
        fontSize: 18,
        marginBottom: 10,
    },

    // Style for centering content
    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    // Style for the buttons used to select options such as bleeding level and symptoms
    optionButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 5,
    },

    // Style for the cards that display symptom categories and their options in the modal
    categoryCard: {
        width: 180,
        padding: 10,
        borderRadius: 12,
        marginRight: 12,
    },

    // Style for the title text of each symptom category in the modal
    categoryTitle: {
        fontWeight: "bold",
        marginBottom: 6,
        fontSize: 14,
    },

    // Style for the chips that represent individual symptoms in the modal
    symptomChip: {
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 20,
        marginBottom: 6,
        alignSelf: "flex-start",
    },

    // Style for the main card that contains the content of the modal
    modalCard: {
        marginHorizontal: 20,
        borderRadius: 12,
        maxHeight: "90%",
    },

    // Style for the row that displays the key statistics about the user's cycle at the top of the History screen
    statsRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 14,
    },

    // Style for the individual statistic cards within the statistics row, which display a specific statistic such as cycle day or average length with a value and label
    statCard: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        padding: 10,
        alignItems: "center",
        justifyContent: "center",
    },

    // Style for the value text within each statistic card
    statValue: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 2,
        textAlign: "center",
    },

    // Style for the label text within each statistic card
    statLabel: {
        fontSize: 10,
        fontWeight: "500",
        letterSpacing: 0.3,
        textAlign: "center",
    },

    // Style for the card that contains the calendar component
    calendarCard: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: "hidden",
        paddingHorizontal: 4,
        paddingBottom: 8,
    },

    // Style for the row that contains the legend for the calendar
    legendRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        borderRadius: 12,
        borderWidth: 1,
        paddingVertical: 10,
        marginTop: 10,
    },

    // Style for individual items in the calendar legend
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },

    // Style for the colored dots in the calendar legend that indicate different bleeding levels
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },

    // Style for the label text in the calendar legend 
    legendLabel: {
        fontSize: 11,
    },

    // Style for the title text of the recent logs section
    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 10,
    },

    // Style for the individual cards that display recent log entries
    recentCard: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
        overflow: "hidden",
    },

    // Style for the left section of the recent log card
    recentLeft: {
        width: 48,
        height: 48,
        justifyContent: "center",
        alignItems: "center",
    },

    // Style for the bleeding icon text in the left section of the recent log card
    recentBleedingIcon: {
        fontSize: 14,
    },

    // Style for the middle section of the recent log card
    recentMid: {
        flex: 1,
        paddingHorizontal: 12,
    },

    // Style for the date text in the middle section of the recent log card
    recentDate: {
        fontSize: 14,
        fontWeight: "600",
    },

    // Style for the subtext in the middle section of the recent log card that displays symptom count information
    recentSub: {
        fontSize: 12,
        marginTop: 2,
    },

    // Style for the badge in the right section of the recent log card that indicates the bleeding level of the log
    bleedingBadge: {
        marginRight: 12,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 20,
        borderWidth: 1,
    },

    // Style for the text within the bleeding badge in the recent log card
    bleedingBadgeText: {
        fontSize: 11,
        fontWeight: "600",
    },

    // Style for the content container of the scroll view within the modal
    modalScrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
});
// app/(tabs)/insights.tsx

/*
    This file defines the InsightsScreen component, which is responsible for:
    - Fetching the user's daily logs from Firestore and generating insights based on that data.
    - Displaying the insights in a list of cards, with different styles and content based on the type of insight (e.g. summary of today's log, symptom-specific insights, intensity charts, cycle phase information).
    - Implementing interactive cards that can be tapped to expand and show additional details such as descriptions, tips, and charts.
    - Using the ThemeContext to apply consistent styling based on the current theme.

    Key features:
    - Fetches the user's logs from Firestore and processes them to extract cycle information such as cycle day, current phase, and average cycle length.
    - Generates a variety of insights based on the logs, including summaries of today's log, symptom-specific insights with descriptions and tips, intensity insights with charts comparing recent symptom intensity to the user's average intensity, and cycle phase insights with descriptions and common symptoms for the current phase.
    - Renders the insights in a FlatList, with different card styles based on the type of insight (summary, symptom, intensity, prediction, phase).
    - Implements interactive cards that can be tapped to expand and show additional details, using React Native's Animated API for smooth transitions.
    - Uses the ThemeContext to apply consistent colors and styling to the insight cards based on the current theme.

    Types of insights generated:
    - Summary Insight: A summary of today's log, including bleeding level and symptoms tracked.
    - Symptom Insight: For each symptom tracked, an insight with a description of the symptom and tips for managing it.
    - Intensity Insight: For symptoms with intensity ratings, a chart comparing recent intensity to the user's average intensity for that symptom.
    - Cycle Phase Insight: An insight about the user's current cycle phase, with a description of the phase and common symptoms.

*/

// Imports
import { useTheme } from '@/context/ThemeContext';
import { auth, db } from '@/firebase/config';
import { useFocusEffect } from '@react-navigation/native';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { collection, getDocs } from 'firebase/firestore';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { symptomInfo } from '../data/symptomInfo';
import { getSymptomReason } from '../data/symptomReasons';
import { buildCycles, getCycleInfo } from '../utils/cyclePrediction';

// Type for symptom entries in daily logs
type SymptomEntry = {
    name: string; // Name of the symptom, e.g. "Cramps", "Headache"
    intensity?: number; // Optional intensity rating for the symptom, e.g. 1-5
}

// Type for daily logs retrieved from the database
type DailyLog = {
    id: string; // Unique identifier for the log
    bleeding: "None" | "Light" | "Medium" | "Heavy"; // Bleeding level for the day
    symptoms: SymptomEntry[]; // Array of symptoms tracked for the day, each with a name and optional intensity
    date?: string; // Optional date string for the log, in case it's not stored in the 'id' field
}

// Type for insights generated based on the user's logs
type Insight = {
    type: string; // Type of insight, e.g. "Today's Log", "Symptom: Cramps", "Intensity", "Prediction", "Cycle Phase"
    message: string; // Main message of the insight to be displayed to the user
    details?: any; // Additional details for the insight, which can vary based on the type (e.g. symptom description, tips, chart data)
    cardType: "summary" | "symptom" | "intensity" | "prediction" | "phase"; // Category of the insight, used for styling the card
};

// Function to get the phase of the cycle based on the cycle day and average cycle length
const getPhaseForDay = (cycleDay: number, avgLength: number): string => {
    
    // Define typical lengths for each phase of the menstrual cycle
    const periodLength = 5;
    const ovulationLength = 2;
    const lutealLength = 14;
    const follicularLength = Math.max(avgLength - periodLength - ovulationLength - lutealLength, 0);

    // An array of the hormonal phases and their corresponding lengths
    const phases = [
        { name: "Menstrual", length: periodLength }, 
        { name: "Follicular", length: follicularLength },
        { name: "Ovulation", length: ovulationLength },
        { name: "Luteal", length: lutealLength },
    ];

    // Loop through the phases and determine which phase the current cycle day falls into based on the cumulative lengths of the phases
    let running = 0;
    for (const phase of phases) {
        running += phase.length;
        if (cycleDay <= running) return phase.name;
    }
    return "Luteal";
};

// Data for cycle phases, including an emoji, description, and common symptoms for each phase
const PHASE_DATA: Record<string, { emoji: string, description: string; symptoms: string[] }> = {

    // The Menstrual phase is when the body sheds the uterine lining and bleeding occurs, with common symptoms like cramps and fatigue
    Menstrual: { 
        emoji: "🩸",
        description: "Your body is shedding the uterine lining. Energy tends to be low — rest is your friend right now.",
        symptoms: ["Cramps", "Headache", "Bloating", "Back pain", "Low mood", "Fatigue", "Nausea", "Low Libido", "Irritable", "Tender breasts", "Diarrhoea", "Gas"],
    },

    // The Follicular phase is when the body starts preparing for ovulation, with rising oestrogen levels
    Follicular: {
        emoji: "🌱",
        description: "Oestrogen is rising and energy is returning. This is often the best-feeling phase of the cycle.",
        symptoms: ["High energy", "Happy", "Energised", "High Libido", "Calm", "Acne", "Headache", "Increased appetite"],
    },

    // The Ovulation phase is when the body releases an egg, with a peak in oestrogen levels
    Ovulation: {
        emoji: "🥚",
        description: "Your body is releasing an egg. Oestrogen peaks and you may feel at your most sociable and confident.",
        symptoms: ["Ovulation pain", "Tender breasts", "Bloating", "High Libido", "Energised", "Acne", "Egg white discharge", "Back pain"],
    },

    // The Luteal phase is when the body produces progesterone to prepare for a potential pregnancy, and PMS symptoms are common
    Luteal: {
        emoji: "💤",
        description: "Progesterone rises then falls. PMS symptoms are common in the second half of this phase.",
        symptoms: ["Mood swings", "Bloating", "Tender breasts", "Irritable", "Anxious", "Low mood", "Insomnia", "Chocolate cravings", "Headache", "Exhausted", "Low Libido", "Acne"],
    },
};

// Intensity Chart component to visualize symptom intensity over time, with bars representing intensity levels and an average line for reference
function IntensityChart({ data, accent, progress }: {
    data: { date: string; intensity: number }[]; // Array of objects representing symptom intensity on different dates
    accent: string; // Accent color for the chart, used for bars and text
    progress: Animated.Value; // Animated value to control the animation of the chart when it expands or collapses
}) {
    const width = 280;
    const height = 100;
    const barWidth = 28;
    const maxVal = 5;
    const gap = (width - barWidth * data.length) / (data.length + 1);

    // Get today to highlight it
    const todayLabel = format(new Date(), 'dd/MM');
    const topPad = 14;

    // Render the chart using SVG elements
    return (
        <View style={{ alignItems: 'center', marginTop: 12 }}>
            {/* SVG container for the intensity bars and average line */}
            <Svg width={width} height={height + 30 + topPad}>
                {data.map((d, i) => {
                    const barHeight = (d.intensity / maxVal) * height;
                    const x = gap + i * (barWidth + gap);
                    const y = height - barHeight;
                    const isToday = d.date === todayLabel;

                    return (
                        <React.Fragment key={i}>
                            {/* Highlight Today*/}
                            {isToday && (
                                <Rect   
                                    x={x-3}
                                    y={topPad-3}
                                    width={barWidth+6}
                                    height={height+6}
                                    rx={9}
                                    fill="none"
                                    stroke={accent}
                                    strokeWidth={2}
                                    opacity={0.5}
                                />
                            )}
                            {/* Background bar */}
                            <Rect
                                x={x}
                                y={topPad}
                                width={barWidth}
                                height={height}
                                rx={6}
                                fill={isToday ? accent + "44" : accent + "22"}
                            />
                            {/* Filled bar */}
                            <Rect
                                x={x}
                                y={y+topPad}
                                width={barWidth}
                                height={barHeight}
                                rx={6}
                                fill={accent}
                                opacity={isToday ? 1 : 0.65}
                            />
                            {/* Intensity number */}
                            <SvgText
                                x={x + barWidth / 2}
                                y={isToday ? y - 4 + topPad - 2 : y - 4 + topPad }
                                fontSize={10}
                                fill={accent}
                                textAnchor="middle"
                                fontWeight="700"
                            >
                                {d.intensity}
                            </SvgText>
                            {/* Date label */}
                            <SvgText
                                x={x + barWidth / 2}
                                y={height + 14+ topPad}
                                fontSize={isToday ? 7.5 : 7}
                                fill={accent + 'aa'}
                                textAnchor="middle"
                                fontWeight={isToday ? "700" : "400"}
                            >
                                {d.date}
                            </SvgText>

                            {/* Today label */}
                            {isToday && (
                                <SvgText 
                                    x={x+barWidth/2}
                                    y={height+26 + topPad}
                                    fontSize={7}
                                    fill={accent}
                                    textAnchor='middle'
                                    fontWeight="600"
                                >
                                    Today
                                </SvgText>
                            )}
                        </React.Fragment>
                    );
                })}
                {/* Average line */}
                {data.length > 1 && (() => {
                    const avg = data.reduce((s, d) => s + d.intensity, 0) / data.length;
                    const avgY = height - (avg / maxVal) * height;
                    return (
                        <Line
                            x1={gap / 2}
                            y1={avgY+topPad}
                            x2={width - gap / 2}
                            y2={avgY+topPad}
                            stroke={accent}
                            strokeWidth={1}
                            strokeDasharray="4,3"
                            opacity={0.5}
                        />
                    );
                })()}
            </Svg>
            {/* Legend for the average line, explaining that it represents the user's average intensity over recent logs */}
            <Text style={{ fontSize: 10, color: accent + 'aa', marginTop: 2, fontStyle: 'italic' }}>
                Dashed line = your average intensity
            </Text>
        </View>
    );
}

// CycleDayHeatmap component to visualize the frequency of symptoms by cycle day, with circles representing each cycle day and their opacity indicating how often symptoms were tracked on that day across the user's logs
function CycleDayHeatmap({ dayCounts, avgLength, accent }: {
    dayCounts: Record<number, number>; // An object where keys are cycle days (1, 2, 3, ...) and values are the count of how many times symptoms were tracked on that day across the user's logs
    avgLength: number; // The average length of the user's menstrual cycle, used to determine how many cycle days to display in the heatmap
    accent: string; // Accent color for the heatmap circles, used to indicate frequency of symptoms on each cycle day
}) {
    const totalDays = Math.min(avgLength, 35);
    const bubbleSize = 22;
    const cols = 7;
    const rows = Math.ceil(totalDays / cols);
    const maxCount = Math.max(...Object.values(dayCounts), 1);

    // Render the heatmap using circles for each cycle day, with opacity based on how frequently symptoms were tracked on that day
    return (
        <View style={{ marginTop: 12 }}>
            {/* Title for the heatmap, indicating that it shows the frequency of symptoms by cycle day */ }
            <Text style={{ fontSize: 10, color: accent, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 }}>
                SYMPTOM FREQUENCY BY CYCLE DAY
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {/* Generate circles for each cycle day, with the opacity of the circle indicating how often symptoms were tracked on that day across the user's logs (darker means more frequent) */ }
                {Array.from({ length: totalDays }, (_, i) => {
                    const day = i + 1;
                    const count = dayCounts[day] ?? 0;
                    const opacity = count === 0 ? 0.12 : 0.2 + (count / maxCount) * 0.8;
                    {/* Each circle represents a cycle day, with the day number displayed in the center. The background color of the circle is determined by the accent color, and the opacity indicates how frequently symptoms were tracked on that day (darker means more frequent). */ }
                    return (
                        <View
                            key={day}
                            style={{
                                width: bubbleSize,
                                height: bubbleSize,
                                borderRadius: bubbleSize / 2,
                                backgroundColor: accent,
                                opacity,
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                        >
                            <Text style={{ fontSize: 7, color: '#fff', fontWeight: '700' }}>{day}</Text>
                        </View>
                    );
                })}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                <View style={{ flexDirection: 'row', gap: 3 }}>
                    {[0.12, 0.35, 0.6, 0.85].map((op, i) => (
                        <View key={i} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: accent, opacity: op }} />
                    ))}
                </View>
                {/* Legend for the heatmap, explaining that darker circles indicate cycle days on which symptoms were tracked more frequently across the user's logs */ }
                <Text style={{ fontSize: 9, color: accent + 'aa', fontStyle: 'italic' }}>
                    Darker = appeared more often on that day
                </Text>
            </View>
        </View>
    );
}

// Expandable medication section 
function MedicationBlock({ medication, accent} :{
    medication: { recommended?: { name: string; reason: string } []; avoid?: { name: string; reason: string } [] } | null;
    accent: string;
}) {
    const [open, setOpen] = useState(false);
    const animation = useRef(new Animated.Value(0)).current;

    if (!medication?.recommended?.length && !medication?.avoid?.length) return

    // Toggle the expansion of the medication section
    const toggle = (e: any) => {
        e.stopPropagation();
        const toValue = open ? 0 : 1;
        Animated.timing(animation, { toValue, duration: 220, useNativeDriver: false}).start();
        setOpen(!open);
    };

    return (
        <TouchableOpacity
            onPress={toggle}
            activeOpacity={0.85}
            style={{
                borderWidth: 1,
                borderColor: accent + "55",
                borderRadius: 10,
                overflow: 'hidden',
                marginTop: 10,
            }}
        >
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: accent + "14",
            }}>
                <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                }}>
                    <Text style={{ fontSize: 15}}>
                        💊
                    </Text>
                    <Text style={{ fontSize: 12, color: accent, fontWeight: '700', letterSpacing: 0.5 }}>
                        Medication options
                    </Text>
                </View>
                <Text style={{ fontSize: 11, color: accent }}>{open ? '▲' : '▼'}</Text>
            </View>

            <Animated.View style={{
                maxHeight: animation.interpolate({
                    inputRange: [0,1],
                    outputRange: [0, 9999], 
                }),
                opacity: animation,
                overflow: 'hidden',
            }}>
                <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: accent + "33" }}>
                    {(medication.recommended ?? []).length > 0 && (
                        <>
                            <Text style={[styles.sectionLabel, { color: accent }]}>Recommended</Text>
                            {medication.recommended!.map((med, idx) => (
                                <View key={idx} style={{ marginBottom: 10 }}>
                                    <Text style={[styles.whyText, { fontWeight: "700" }]}>{med.name}</Text>
                                    <Text style={[styles.whyText, { color: "#666" }]}>{med.reason}</Text>
                                </View>
                            ))}
                        </>
                    )}
                    {(medication.avoid ?? []).length > 0 && (
                        <>
                            <View style={{ height: 1, backgroundColor: accent + "33", marginVertical: 8 }} />
                            <Text style={[styles.sectionLabel, { color: "#c0392b" }]}>Avoid</Text>
                            {medication.avoid!.map((med, idx) => (
                                <View key={idx} style={{ marginBottom: 10 }}>
                                    <Text style={[styles.whyText, { color: "#c0392b", fontWeight: "600" }]}>{med.name}</Text>
                                    <Text style={[styles.whyText, { color: "#666" }]}>{med.reason}</Text>
                                </View>
                            ))}
                        </>
                    )}
                </View>
            </Animated.View>
        </TouchableOpacity>
    )
}

// Main InsightsScreen component that fetches the user's logs from the database, generates insights based on the logs, and renders them in a list of cards with different styles based on the type of insight
export default function InsightsScreen() {
    
    // Access the current theme from the ThemeContext 
    const { theme } = useTheme();
    const c = theme.colors;

    // Configuration for the different types of insight cards
    const CARD_CONFIG = {
        summary:    { emoji: "📋", accent: c.cardInsightBorder,    label: "Today's Log",  bg: c.cardInsight,    border: c.cardInsightBorder }, // Summary card
        symptom:    { emoji: "🌸", accent: c.cardInsightBorder,    label: "Tracked",      bg: c.cardInsight,    border: c.cardInsightBorder }, // Symptom card
        intensity:  { emoji: "📈", accent: c.cardIntensityBorder,  label: "Intensity",    bg: c.cardIntensity,  border: c.cardIntensityBorder }, // Intensity card
        prediction: { emoji: "🔮", accent: c.cardPredictionBorder, label: "Prediction",   bg: c.cardPrediction, border: c.cardPredictionBorder }, // Prediction card
        phase:      { emoji: "🌿", accent: c.cardPhaseBorder,      label: "Cycle Phase",  bg: c.cardPhase,      border: c.cardPhaseBorder }, // Cycle phase card
    };

    // State variables for the user's logs, generated insights, loading state, and which insight card is currently expanded (if any)
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const animations = useRef<Map<number, Animated.Value>>(new Map()).current;
    const chartProgress = useRef<Map<number, Animated.Value>>(new Map()).current;

    // Toggle the expansion of an insight card when it is tapped, using animations to smoothly expand or collapse the card and show additional details such as charts or descriptions based on the type of insight
    const toggleCard = (index: number) => {
        let animation = animations.get(index);
        
        // If there isn't already an animation value for this card index, create a new Animated.Value and store it in the animations map
        if (!animation) {
            animation = new Animated.Value(0);
            animations.set(index, animation);
        }

        // Get or create the progress animation value for the chart within the card, which controls the animation of the chart when the card is expanded or collapsed
        let progress = chartProgress.get(index);
        if (!progress) {
            progress = new Animated.Value(0);
            chartProgress.set(index, progress);
        }

        // Determine whether the card is currently expanded or not, and set the target value for the animations accordingly (0 for collapsed, 1 for expanded)
        const isOpen = expandedIndex === index;
        const toValue = isOpen ? 0 : 1;

        // Run the animations in parallel: one for the card expansion/collapse and one for the chart animation. When the animations complete, update the expandedIndex state to either expand or collapse the card based on the new state.
        Animated.parallel([
            Animated.timing(animation, { toValue, duration: 250, useNativeDriver: false }),
            Animated.timing(progress, { toValue, duration: 500, useNativeDriver: false }),
        ]).start(() => {
            if (isOpen) setExpandedIndex(null);
            else setExpandedIndex(index);
        });
    };

    // Convert the user's logs into a format suitable for generating insights
    const convertToCycleLogs = (logs: DailyLog[]) => {
        return logs.map(l => ({
            ...l,
            date: l.date ?? l.id,
            symptoms: l.symptoms.map(s => s.name)
        }));
    };

    // Generate insights based on the user's logs, including a summary of today's log, symptom-specific insights with descriptions and tips, and intensity insights with charts comparing recent symptom intensity to the user's average intensity over recent cycles
    const generateInsights = (logs: DailyLog[]) => {

        // If there are no logs, return early since insights cannot be generated without data
        if (!logs.length) return;

        // Convert the raw logs into a format that includes cycle information such as cycle day, current phase, cycle start date, and average cycle length
        const cycleLogs = convertToCycleLogs(logs);
        const { cycleDay, currentPhase, cycleStartDate, avgLength } = getCycleInfo(cycleLogs);

        // If cycle information cannot be determined  return early 
        if (!cycleDay || !currentPhase) return;

        // Determine the average cycle length to use for insights, defaulting to 28 days if it cannot be calculated 
        const resolvedAvgLength = avgLength || 28;

        // Find today's log from the user's logs 
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todayLog = logs.find(l => format(new Date(l.date || ""), 'yyyy-MM-dd') === todayStr);

        // Helper function to look up symptom information from the symptomInfo data
        const symptomInfoLookup = (name : string) => {
            return symptomInfo[name]
            ?? symptomInfo[name.toLowerCase()]
            ?? Object.entries(symptomInfo).find(
                ([k]) => k.toLowerCase() === name.toLowerCase()
            )?.[1];
        };

        // Initialize an array to hold the generated insights 
        const newInsights: Insight[] = [];

        // ── Summary card ──────────────────────────────────────────────────────

        // If today's log exists, create a summary insight that shows how many symptoms were tracked today
        if (todayLog) {

            const displayName = (name: string) =>
                name === "High" ? "High Energy"
                : name === "Medium" ? "Medium Energy"
                : name === "Low" ? "Low Energy"
                : name;

            const summarySymptoms = todayLog.symptoms.map(sym => ({
                name: displayName(sym.name),
                hasShoppingList: !!(symptomInfoLookup(sym.name)?.shoppingList?.length)
            }));

            // Create a summary insight card that displays the number of symptoms tracked today, and includes details about which symptoms were tracked and whether there are shopping list items associated with those symptoms in the symptomInfo data
            newInsights.push({
                cardType: "summary",
                type: "Today's Log",
                message: `You tracked ${summarySymptoms.length} symptom${summarySymptoms.length !== 1 ? "s" : ""} today`,
                details: { symptoms: summarySymptoms }
            });
        // If there is no log for today, create a summary insight that encourages the user to log their symptoms in order to receive insights based on their data
        } else {
            newInsights.push({
                cardType: "summary",
                type: "Today's Log",
                message: "You haven't logged anything today. Remember, the more you log, the better your insights!",
                details: { symptoms: [] }
            });
        }

        // ── Symptom cards ─────────────────────────────────────────────────────

        // If today's log exists, create a symptom insight card for each symptom tracked today
        if (todayLog) {
            todayLog.symptoms.forEach(sym => {
                const info = symptomInfoLookup(sym.name) ?? {};
                const hasContent = Array.isArray(info.shoppingList) && info.shoppingList.length > 0;
                if (!hasContent) return;

                const displayName = sym.name === "High" ? "High Energy"
                    : sym.name === "Medium" ? "Medium Energy"
                    : sym.name === "Low" ? "Low Energy"
                    : sym.name;

                const otherSymptomsNames = todayLog.symptoms
                    .filter(s => s.name !== sym.name)
                    .map(s => s.name);

                // Create a symptom insight card that displays the name of the symptom tracked today, along with additional details such as a description, tips, typical cycle phase, and shopping list items associated with that symptom from the symptomInfo data
                newInsights.push({
                    cardType: "symptom",
                    type: `Symptom: ${displayName}`,
                    message: `You tracked ${displayName} today`,
                    details: {
                        description: info.description ?? "No description available.",
                        why: getSymptomReason(
                            sym.name,
                            currentPhase as any,
                            todayLog.bleeding,
                            otherSymptomsNames,
                            sym.intensity,
                            cycleDay
                        ),
                        tips: Array.isArray(info.tips) ? info.tips : [],
                        phase: info.typicalCyclePhase ?? "Unknown phase",
                        shoppingList: Array.isArray(info.shoppingList) ? info.shoppingList : [],
                        medication: info.medication ?? null,
                    }
                });
            });
        }

        // ── Intensity cards ───────────────────────────────────────────────────

        // Generate cycles, identify the last 3 completed cycles, and create a set of dates that fall within those last 3 cycles 
        const cycles = buildCycles(cycleLogs);
        const last3Cycles = cycles.slice(-3);
        const last3CycleDates = new Set<string>();

        // For each of the last 3 completed cycles, calculate the start and end dates of the cycle and add all dates within that cycle to the last3CycleDates set
        last3Cycles.forEach((cycle, idx) => {
            const start = new Date(cycle.startDate);
            const nextCycle = last3Cycles[idx + 1];
            const end = nextCycle 
                ? addDays(new Date(nextCycle.startDate), -1) // If there is a next cycle, the end date of the current cycle is the day before the start of the next cycle
                : addDays(start, resolvedAvgLength - 1); // If there is no next cycle, estimate the end date based on the average cycle length
            
            // Add all dates from the start to the end of the cycle to the last3CycleDates set
            let current = new Date(start);
            while (current <= end) {
                last3CycleDates.add(format(current, 'yyyy-MM-dd'));
                current.setDate(current.getDate() + 1);
            }
        });

        // If today's log exists, create intensity insight cards for each symptom tracked today that has an intensity rating
        if (todayLog) {
            // For each symptom tracked today, check if there are at least 2 past logs within the last 3 cycles that also tracked that symptom with an intensity rating
            todayLog.symptoms.forEach(sym => {
                    const recentPastLogs = logs.filter(l => {
                        if (!l.date || l.date === todayLog.date) return false;
                        return l.date && last3CycleDates.has(l.date) && l.symptoms.some(
                            s => s.name.toLowerCase() === sym.name.toLowerCase() && s.intensity !== undefined
                        );
                    });

                // If there are not enough past logs with intensity ratings for this symptom, or if today's log does not have an intensity rating for this symptom, skip generating an intensity insight for this symptom
                if (recentPastLogs.length < 2 || sym.intensity === undefined) {
                    return;
                };

                // Calculate the average intensity for this symptom across the recent past logs, and compare it to today's intensity rating to determine if the symptom is worsening or improving compared to the user's recent average intensity for that symptom
                const avgRecentIntensity =
                    recentPastLogs.reduce((acc, l) => {
                        const s = l.symptoms.find(s => s.name === sym.name);
                        return acc + (s?.intensity || 0);
                    }, 0) / recentPastLogs.length;

                // Look up additional information about the symptom from the symptomInfo data, and create an intensity insight card 
                const info = symptomInfoLookup(sym.name);
                const isWorsening = sym.intensity > avgRecentIntensity;
                const isImproving = sym.intensity < avgRecentIntensity;

                if (isWorsening || isImproving) {
                    // Build chart data: last 6 occurrences + today
                    const allOccurrences = logs
                        .filter(l => l.symptoms.some(s => s.name === sym.name && s.intensity !== undefined))
                        .sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime())
                        .slice(-6)
                        .map(l => {
                            const s = l.symptoms.find(s => s.name === sym.name);
                            return {
                                date: format(new Date(l.date || ''), 'dd/MM'),
                                intensity: s?.intensity ?? 0,
                            };
                        });

                    // Create an intensity insight card that displays whether the symptom is worsening or improving 
                    newInsights.push({
                        cardType: "intensity",
                        type: sym.name,
                        message: isWorsening
                            ? `${sym.name} is higher than your recent average (${sym.intensity} vs avg ${avgRecentIntensity.toFixed(1)})`
                            : `${sym.name} is lower than your recent average (${sym.intensity} vs avg ${avgRecentIntensity.toFixed(1)})`,
                        details: {
                            trend: isWorsening ? "worsening" : "improving",
                            description: info?.description ?? "No description available.",
                            tips: Array.isArray(info?.tips) ? info.tips : [],
                            phase: info?.typicalCyclePhase ?? "Unknown phase",
                            shoppingList: Array.isArray(info?.shoppingList) ? info.shoppingList : [],
                            chartData: allOccurrences,
                            medication: info.medication ?? null,
                        }
                    });
                }
            });
        }

        // ── Prediction cards ──────────────────────────────────────────────────

        // Helper function to determine the cycle day and phase for a given date string
        const getCycleDayForDate = (dateStr: string): { day: number; phase: string } | null => {
            const logDate = new Date(dateStr);

            // Try to find the cycle that the log date falls into by checking each cycle's start and end dates
            for (const cycle of cycles) {
                const start = new Date(cycle.startDate);
                const nextCycle = cycles[cycles.indexOf(cycle) + 1];
                const end = nextCycle
                    ? addDays(new Date(nextCycle.startDate), -1) // If there is a next cycle, the end date of the current cycle is the day before the start of the next cycle
                    : addDays(start, resolvedAvgLength -1); // If there is no next cycle, estimate the end date based on the average cycle length
                
                // If the log date falls within the start and end dates of this cycle, calculate the cycle day and phase for that date and return it
                if (logDate >= start && logDate <= end) {
                    const day = differenceInCalendarDays(logDate, start) + 1;
                    return { day, phase: getPhaseForDay(day, resolvedAvgLength) };
                }
            }

            // If the log date does not fall within any of the cycles based on their start and end dates, try to find the most recent cycle that started before the log date and calculate the cycle day and phase based on that cycle's start date
            const precedingCycle = [...cycles].reverse().find(c => new Date(c.startDate) <= logDate);
            if (precedingCycle) {
                const day = differenceInCalendarDays(logDate, new Date(precedingCycle.startDate)) + 1;
                if (day > 0 && day <= resolvedAvgLength) {
                    return { day, phase: getPhaseForDay(day, resolvedAvgLength) };
                }
            }
            return null;
        };

        // Use a weighted approach to identify symptoms that frequently occur on specific cycle days across the user's logs, giving more weight to symptoms tracked in the most recent cycles
        const symptomDayWeighted: Record<string, Record<number, number>> = {};
        const symptomPhaseCount: Record<string, Record<string, number>> = {};

        const CYCLE_WEIGHTS = [1, 0.7, 0.4]; // More recent cycles count more
        
        // Build a map of dates to their corresponding cycle index using only the last 3 cycles for weighting
        const cycleIndexMap = new Map<string, { cycleIndex: number; cycleDay: number }>();
        const last3ForWeighting = cycles.slice(-3);

        // For each of the last 3 cycles, calculate the start and end dates, and populate the cycleIndexMap with entries for each date in those cycles
        last3ForWeighting.forEach((cycle, i) => {
            const start = new Date(cycle.startDate);
            const nextCycle = last3ForWeighting[i + 1]
            const end = nextCycle
                ? addDays(new Date(nextCycle.startDate), -1) // If there is a next cycle, the end date of the current cycle is the day before the start of the next cycle
                : addDays(start, resolvedAvgLength -1); // If there is no next cycle, estimate the end date based on the average cycle length
            let current = new Date(start);

            // For each date in the cycle, add an entry to the cycleIndexMap that maps the date string to an object containing the cycle index (which determines the weight for that cycle) and the cycle day (which is used for identifying patterns of symptoms on specific cycle days)
            while (current <= end) {
                const dateStr = format(current, 'yyyy-MM-dd');
                const day = differenceInCalendarDays(current, start) + 1;
                cycleIndexMap.set(dateStr, { cycleIndex: (last3ForWeighting.length - 1) - i, cycleDay: day });
                current.setDate(current.getDate() + 1);

            }
        });

        // Iterate through all logs and their symptoms to populate the symptomPhaseCount and symptomDayWeighted objects, which track how many times each symptom was tracked in each cycle phase and on each cycle day, respectively, with weighting applied based on how recent the cycle is
        logs.forEach(log => {
            
            // If the log does not have a date, skip it 
            if (!log.date) return;
            
            // Get the cycle day and phase for the log's date, skip if it cannot be determined
            const cyclePosition = getCycleDayForDate(log.date);
            if (!cyclePosition) return;
            const { day: logCycleDay, phase: logPhase } = cyclePosition;
            
            // Set mapped and weight to give more weight to symptoms tracked in the most recent cycles
            const mapped = cycleIndexMap.get(log.date);
            const weight = mapped !== undefined ? (CYCLE_WEIGHTS[mapped.cycleIndex] ?? 0) : 0;

            // For each symptom in the log, update the symptomPhaseCount to track how many times the symptom was tracked in each cycle phase, and update the symptomDayWeighted to track a weighted count of how many times the symptom was tracked on each cycle day across the user's logs
            log.symptoms.forEach(sym => {
                const name = sym.name;
                if (!symptomPhaseCount[name]) symptomPhaseCount[name] = {};
                if (!symptomPhaseCount[name][logPhase]) symptomPhaseCount[name][logPhase] = 0;
                symptomPhaseCount[name][logPhase]++;

                if (weight === 0) return; // Skip logs outside the last 3 cycles for prediction weighting
                if (!symptomDayWeighted[name]) symptomDayWeighted[name] = {};
                if (!symptomDayWeighted[name][logCycleDay]) symptomDayWeighted[name][logCycleDay] = 0;
                symptomDayWeighted[name][logCycleDay] += weight;
            });
        });

        // Identify symptoms that have a high weighted count on specific upcoming cycle days and create prediction insight cards for those symptoms, including details such as descriptions, tips, typical cycle phase, shopping list items from the symptomInfo data, and a heatmap showing the frequency of that symptom on different cycle days across the user's logs
        Object.keys(symptomDayWeighted).forEach(symName => {
            const dayCounts = symptomDayWeighted[symName];
            const upcomingDays = Array.from({ length: 3 }, (_, i) =>
                ((cycleDay + i) % resolvedAvgLength) + 1
            );

            // For each of the upcoming cycle days, check if the weighted count for this symptom on that day is above a certain threshold and, if so, create a prediction insight card for that symptom with details from the symptomInfo data and a heatmap of symptom frequency by cycle day    
            upcomingDays.forEach(day => {
                const score = dayCounts[day] ?? 0;
                
                console.log(`🔮 [${symName}] day ${day} → score: ${score.toFixed(2)} (threshold: 0.8)`);
                
                if (score < 1.1) {
                    console.log(`   ❌ Skipped — score too low`);
                    return;
                }
                
                const info = symptomInfoLookup(symName) || {};
                
                if (!info.shoppingList || info.shoppingList.length === 0) {
                    console.log(`   ❌ Skipped — no shopping list for "${symName}"`);
                    return;
                }

                const alreadyAdded = newInsights.some(i => i.cardType === "prediction" && i.type === `Prediction: ${symName}`);
                if (alreadyAdded) {
                    console.log(`   ❌ Skipped — already added`);
                    return;
                }

                console.log(`   ✅ Prediction added — score ${score.toFixed(2)} on cycle day ${day}`);
                console.log(`   🛒 Shopping list: ${info.shoppingList.join(', ')}`);
                // Add a new prediction insight card to the newInsights array 
                newInsights.push({
                    cardType: "prediction",
                    type: `Prediction: ${symName}`,
                    message: `Based on your history, you often experience ${symName} around day ${day} of your cycle. Consider preparing!`,
                    details: {
                        description: info.description ?? "No description available.",
                        tips: Array.isArray(info.tips) ? info.tips : [],
                        phase: info.typicalCyclePhase ?? "Unknown phase",
                        shoppingList: Array.isArray(info.shoppingList) ? info.shoppingList : [],
                        dayCounts,
                        avgLength: resolvedAvgLength,
                        medication: info.medication ?? null,
                    }
                });
                console.log("DONE")
            });
        });

        // ── Phase card ────────────────────────────────────────────────────────

        // Create a phase insight card for the current cycle phase
        const phaseData = PHASE_DATA[currentPhase];

        // If there is data for the current phase, create a phase insight card that includes a message about the current cycle phase and day, along with details such as a description of the phase and a selection of symptoms that are commonly experienced during this phase but have not yet been tracked in today's log, giving the user insights into what they might expect to experience during this phase based on their history and encouraging them to track any symptoms they may be experiencing
        if (phaseData) {
            const alreadyLoggedNames = new Set(todayLog?.symptoms.map(s => s.name) ?? []); // Create a set of symptom names that have already been logged today to avoid suggesting symptoms that the user has already tracked in today's log
            const dateSeed = parseInt(format(new Date(), 'yyyMMdd'));
            const available = phaseData.symptoms.filter(s => !alreadyLoggedNames.has(s)); // Filter the symptoms associated with the current phase to only include those that have not already been logged today, so that the insight can suggest symptoms that the user may be experiencing but has not yet tracked in today's log
            
            // Shuffle the available symptoms in a deterministic way based on the current date to provide variety in the insights while ensuring that the same symptoms are suggested for everyone on the same day, and pick a few symptoms to include in the phase insight card
            const shuffled = [...available].sort((a, b) => {
                const hashA = (a.charCodeAt(0) + dateSeed) % 97; //
                const hashB = (b.charCodeAt(0) + dateSeed) % 97;
                return hashA - hashB; 
            });

            // Pick up to 4 symptoms to include in the phase insight card, and if there are any symptoms to include, create a new phase insight card with details about the current cycle phase and the commonly associated symptoms that the user has not yet tracked today, providing insights into what they might expect to experience during this phase based on their history and encouraging them to track any symptoms they may be experiencing
            const picked = shuffled.slice(0, Math.min(4, shuffled.length));
            if (picked.length > 0) {
                newInsights.push({
                    cardType: "phase",
                    type: `${currentPhase} Phase - Day ${cycleDay}`,
                    message: phaseData.description,
                    details: { phaseEmoji: phaseData.emoji, symptoms: picked }
                });
            }
        }
        
        // Order for display: summary first, then symptom cards, then intensity, then predictions, then phase cards
        const order = { summary: 0, symptom: 1, intensity: 2, prediction: 3, phase: 4 };
        newInsights.sort((a, b) => order[a.cardType] - order[b.cardType]);
        return newInsights;
    };

    // When the InsightsScreen component is focused, update the user's logs from the database, generate insights based on the updated logs, and update the loading state accordingly. This ensures that the insights are always based on the most recent data whenever the user navigates to the Insights tab.
    useFocusEffect(
        useCallback(() => {

            // Get logs
            const fetchLogs = async () => {
                const currentUser = auth.currentUser;
                if (!currentUser) return;
                const snapshot = await getDocs(collection(db, "users", currentUser.uid, "dailyLogs"));
                const fetchedLogs = snapshot.docs.map((doc): DailyLog => {
                    const data = doc.data();
                    const rawSymptoms = data.symptoms || [];
                    const cleanedSymptoms: SymptomEntry[] = rawSymptoms.map((sym: any) => {
                        let nameStr = "";
                        if (typeof sym === "string") nameStr = sym;
                        else if (typeof sym === "object") {
                            if (typeof sym.name === "string") nameStr = sym.name;
                            else if (typeof sym.name === "object" && sym.name?.name) nameStr = sym.name.name;
                        }
                        return { name: nameStr, intensity: sym.intensity !== undefined ? Number(sym.intensity) : undefined };
                    });
                    const validBleeding = ["None", "Light", "Medium", "Heavy"];
                    const bleedingValue = validBleeding.includes(data.bleeding) ? data.bleeding : "None";
                    return {
                        id: doc.id,
                        date: data.date ? data.date : doc.id,
                        bleeding: bleedingValue as "None" | "Light" | "Medium" | "Heavy",
                        symptoms: cleanedSymptoms
                    };
                });
                // Set logs
                setLogs(fetchedLogs);
                const generatedInsights = generateInsights(fetchedLogs);
                if (generatedInsights) setInsights(generatedInsights);
                setLoading(false);
            };
            fetchLogs();
        }, [])
    );

    // If the insights are still loading, show a loading indicator 
    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: c.background }]}>
                <ActivityIndicator size="large" color={c.primary} />
            </View>
        );
    }

    // Render the insights page
    return (
        <View style={{ flex: 1, paddingTop: 50, backgroundColor: c.background }}>

            {/* Title for the insights page */ }
            <Text style={[styles.title, { color: c.text }]}>Your Insights</Text>

            {/* A flatlist that renders a list of insight cards based on the generated insights*/}
            <FlatList
                data={insights}
                keyExtractor={(item, index) => item.cardType + item.type + index}
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                renderItem={({ item, index }) => {
                    const animation = animations.get(index) || (() => { const a = new Animated.Value(0); animations.set(index, a); return a; })();
                    const progress = chartProgress.get(index) || (() => { const a = new Animated.Value(0); chartProgress.set(index, a); return a; })();
                    const isExpanded = expandedIndex === index;
                    const config = CARD_CONFIG[item.cardType as keyof typeof CARD_CONFIG];

                    // ── Summary card ──────────────────────────────────────────
                    if (item.cardType === "summary") {
                        // Get the symptoms from the details of the summary insight, and create a preview string that lists up to 4 symptoms tracked today
                        const symptoms: { name: string; hasShoppingList: boolean }[] = item.details?.symptoms ?? [];
                        const preview = symptoms.slice(0, 4).map(s => s.name).join("  ·  ");
                        const hasMore = symptoms.length > 4;
                        return (
                            <TouchableOpacity onPress={() => toggleCard(index)} activeOpacity={0.85}>
                                <View style={[styles.card, { backgroundColor: config.bg, borderColor: config.border }]}>
                                    <View style={[styles.leftBar, { backgroundColor: config.accent }]} />
                                    <View style={styles.cardInner}>

                                        {/* Emoji, label, and title for the summary card*/}
                                        <View style={styles.cardHeader}>
                                            <View style={styles.cardHeaderLeft}>
                                                <Text style={styles.cardEmoji}>{config.emoji}</Text>
                                                <View>
                                                    <Text style={[styles.cardLabel, { color: config.accent }]}>TODAY'S LOG</Text>
                                                    <Text style={[styles.cardTitle, { color: c.text }]}>{item.message}</Text>
                                                </View>
                                            </View>
                                            <Text style={[styles.chevron, { color: config.accent }]}>{isExpanded ? "▲" : "▼"}</Text>
                                        </View>

                                        <Animated.View style={{
                                            opacity: animation.interpolate({ inputRange: [0, 0.3], outputRange: [1, 0], extrapolate: "clamp" }),
                                            maxHeight: animation.interpolate({ inputRange: [0, 0.3], outputRange: [20, 0], extrapolate: "clamp" }),
                                            overflow: "hidden",
                                            width: "100%", 
                                        }}>
                                            {/* Preview of symptoms tracked today, showing up to 4 symptoms with a count of additional symptoms if there are more than 4 */ }
                                            <Text style={[styles.previewText, { color: c.textMuted }]} numberOfLines={1}>
                                                {preview}{hasMore ? `  +${symptoms.length - 4} more` : ""}
                                            </Text>
                                        </Animated.View>
                                        <Animated.View style={{
                                            maxHeight: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 9999] }),
                                            overflow: "hidden",
                                            opacity: animation,
                                            width: "100%", 
                                        }}>
                                            {/* Row of chips showing the symptoms tracked today */ }
                                            <View style={styles.chipsRow}>
                                                {symptoms.map((sym, i) => (
                                                    <View key={i} style={[styles.chip, sym.hasShoppingList
                                                        ? [styles.chipHighlight, { backgroundColor: c.primaryLight, borderColor: config.accent }] // Highlight symptoms that have shopping list items in the symptomInfo data to indicate that there are actionable insights available for those symptoms
                                                        : [styles.chipPlain, { backgroundColor: c.surface }]]}>
                                                            {/* The name of the symptom */ }
                                                        <Text style={[styles.chipText, { fontWeight: sym.hasShoppingList ? "700" : "400", color: sym.hasShoppingList ? config.accent : c.textSecondary }]}>
                                                            {sym.name}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                            {/* Tells the user about the actionable insights */ }
                                            {symptoms.length > 0 && (
                                                <Text style={[styles.chipHint, { color: c.textMuted }]}>✦ Bold symptoms have recommendations below</Text>
                                            )}

                                            {/* If no symptoms were tracked today, show a message encouraging the user to log symptoms in order to receive personalized insights and recommendations based on their data */ }
                                            {symptoms.length === 0 && (
                                                <>
                                                    <Text style={[styles.chipHint, { color: c.textMuted }]}>You haven't tracked any symptoms today.</Text>
                                                    <Text style={[styles.chipHint, { color: c.textMuted }]}>Try logging some to get personalized insights and recommendations!</Text>
                                                </>
                                            )}
                                        </Animated.View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }

                    // ── Phase card ────────────────────────────────────────────
                    if (item.cardType === "phase") {
                        const phaseSymptoms: string[] = item.details?.symptoms ?? [];
                        return (
                            <TouchableOpacity onPress={() => toggleCard(index)} activeOpacity={0.85}>
                                <View style={[styles.card, { backgroundColor: config.bg, borderColor: config.border }]}>
                                    <View style={[styles.leftBar, { backgroundColor: config.accent }]} />
                                    <View style={styles.cardInner}>
                                        {/* Emoji, label, and title for the phase card */ }
                                        <View style={styles.cardHeader}>
                                            <View style={styles.cardHeaderLeft}>
                                                <Text style={styles.cardEmoji}>{item.details?.phaseEmoji ?? config.emoji}</Text>
                                                <View style={{ flex: 1, paddingRight: 24 }}>
                                                    <Text style={[styles.cardLabel, { color: config.accent }]}>PHASE INSIGHT</Text>
                                                    <Text style={[styles.cardTitle, { color: c.text }]}>{item.type}</Text>
                                                </View>
                                            </View>
                                            <Text style={[styles.chevron, { color: config.accent }]}>{isExpanded ? "▲" : "▼"}</Text>
                                        </View>
                                        
                                        {/* Description of the current cycle phase */ }
                                        <Text style={[styles.phaseDescription, { color: c.textSecondary }]}>{item.message}</Text>
                                        <Animated.View style={{
                                            maxHeight: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 9999] }),
                                            overflow: "hidden",
                                            opacity: animation,
                                            width: "100%", 
                                        }}>
                                            <View style={[styles.divider, { backgroundColor: config.border }]} /> 

                                            {/* Section for common symptoms during this phase that the user has not yet tracked today */ }
                                            <Text style={[styles.sectionLabel, { color: config.accent }]}>Common this phase</Text>
                                            <View style={styles.chipsRow}>
                                                {phaseSymptoms.map((sym, i) => (
                                                    <View key={i} style={[styles.chip, { backgroundColor: c.card, borderWidth: 1, borderColor: config.accent }]}>
                                                        <Text style={[styles.chipText, { color: config.accent, fontWeight: "600" }]}>{sym}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                            {/* Hint about tapping symptoms for more insights */ }
                                            <Text style={[styles.chipHint, { color: c.textMuted }]}>✦ Tap a symptom in the log screen to track it</Text>
                                        </Animated.View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }

                    // ── Intensity card (with bar chart) ───────────────────────
                    if (item.cardType === "intensity") {
                        // Get the chart data 
                        const chartData: { date: string; intensity: number }[] = item.details?.chartData ?? [];

                        // Render an intensity insight card 
                        return (
                            <TouchableOpacity onPress={() => toggleCard(index)} activeOpacity={0.85}>
                                <Animated.View style={[
                                    styles.card,
                                    
                                    { backgroundColor: config.bg, borderColor: config.border, width: "100%"  },
                                    { transform: [{ scale: animation.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] }) }] }
                                ]}>
                                    <View style={[styles.leftBar, { backgroundColor: config.accent }]} />
                                    <View style={styles.cardInner}>
                                        {/* Emoji, label, title, and message for the intensity card */ }
                                        <View style={styles.cardHeader}>
                                            <View style={styles.cardHeaderLeft}>
                                                <Text style={styles.cardEmoji}>{config.emoji}</Text>
                                                <View style={{ flex: 1, paddingRight: 24 }}>
                                                    {/* Whether the symptom is worsening or improving  */ }
                                                    <Text style={[styles.cardLabel, { color: config.accent }]}>
                                                        INTENSITY {item.details?.trend === "worsening" ? "↑" : "↓"}
                                                    </Text>
                                                    <Text style={[styles.cardTitle, { color: c.text }]}>{item.type}</Text>
                                                    <Text style={[styles.cardMessage, { color: c.textSecondary }]}>{item.message}</Text>
                                                </View>
                                            </View>
                                            <Text style={[styles.chevron, { color: config.accent }]}>{isExpanded ? "▲" : "▼"}</Text>
                                        </View>
                                        <Animated.View style={{
                                            maxHeight: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 9999] }),
                                            overflow: "hidden",
                                            opacity: animation,
                                            width: "100%", 
                                        }}>
                                            <View style={[styles.divider, { backgroundColor: config.border }]} />

                                            {/* Bar chart */}
                                            {chartData.length > 0 && (
                                                <>
                                                    <Text style={[styles.sectionLabel, { color: config.accent }]}>Intensity History</Text>
                                                    <IntensityChart data={chartData} accent={config.accent} progress={progress} />
                                                </>
                                            )}
                                            
                                            {/* Description of the insight */ }
                                            {item.details?.description && (
                                                <Text style={[styles.expandDescription, { color: c.textSecondary, marginTop: 12 }]}>
                                                    {item.details.description}
                                                </Text>
                                            )}

                                            {/* Tips for managing the symptom, if available */ }
                                            {(item.details?.tips ?? []).length > 0 && (
                                                <View style={styles.tipsBlock}>
                                                    <Text style={[styles.sectionLabel, { color: config.accent }]}>Tips</Text>
                                                    {(item.details.tips as string[]).slice(0, 2).map((tip, idx) => (
                                                        <Text key={idx} style={[styles.tipText, { color: c.textSecondary }]}>• {tip}</Text>
                                                    ))}
                                                </View>
                                            )}

                                            {/* Recommended products related to the symptom, if available */ }
                                            {(item.details?.shoppingList ?? []).length > 0 && (
                                                <View style={[styles.shoppingBlock, { minWidth: 0 }]}>
                                                    <Text style={[styles.sectionLabel, { color: config.accent }]}>Recommended Products</Text>
                                                    {(item.details.shoppingList as string[]).map((product, idx) => (
                                                        <View key={idx} style={styles.productRow}>
                                                            <Text style={[styles.productDot, { color: config.accent }]}>●</Text>
                                                            <Text style={[styles.productText, { color: c.text }]}>{product}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}

                                            {/* Medication recommendations */}
                                            <MedicationBlock medication={item.details?.medication ?? null} accent={config.accent} />
                                        </Animated.View>
                                    </View>
                                </Animated.View>
                            </TouchableOpacity>
                        );
                    }

                    // ── Prediction card (with heatmap) ────────────────────────
                    if (item.cardType === "prediction") {
                        const dayCounts: Record<number, number> = item.details?.dayCounts ?? {};
                        const avgLen: number = item.details?.avgLength ?? 28;
                        
                        // Render the prediction insight card
                        return (
                            <TouchableOpacity onPress={() => toggleCard(index)} activeOpacity={0.85}>
                                <Animated.View style={[
                                    styles.card,
                                    { backgroundColor: config.bg, borderColor: config.border, width: "100%" },
                                    { transform: [{ scale: animation.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] }) }] }
                                ]}>
                                    <View style={[styles.leftBar, { backgroundColor: config.accent }]} />
                                    <View style={styles.cardInner}>

                                        {/* Emoji, label, title, and message for the prediction card */ }
                                        <View style={styles.cardHeader}>
                                            <View style={styles.cardHeaderLeft}>
                                                <Text style={styles.cardEmoji}>{config.emoji}</Text>
                                                <View style={{ flex: 1, paddingRight: 24 }}>
                                                    <Text style={[styles.cardLabel, { color: config.accent }]}>PREDICTION</Text>
                                                    <Text style={[styles.cardTitle, { color: c.text }]}>{item.type}</Text>
                                                    <Text style={[styles.cardMessage, { color: c.textSecondary }]}>{item.message}</Text>
                                                </View>
                                            </View>
                                            <Text style={[styles.chevron, { color: config.accent }]}>{isExpanded ? "▲" : "▼"}</Text>
                                        </View>
                                        <Animated.View style={{
                                            maxHeight: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 9999] }),
                                            overflow: "hidden",
                                            opacity: animation,
                                            width: "100%", 
                                        }}>
                                            <View style={[styles.divider, { backgroundColor: config.border }]} />

                                            {/* Heatmap */}
                                            <CycleDayHeatmap dayCounts={dayCounts} avgLength={avgLen} accent={config.accent} />

                                            {/* Description of the prediction insight */ }
                                            {item.details?.description && (
                                                <Text style={[styles.expandDescription, { color: c.textSecondary, marginTop: 12 }]}>
                                                    {item.details.description}
                                                </Text>
                                            )}

                                            {/* Typical cycle phase for the symptom, if available */ }
                                            {(item.details?.tips ?? []).length > 0 && (
                                                <View style={styles.tipsBlock}>
                                                    <Text style={[styles.sectionLabel, { color: config.accent }]}>Tips</Text>
                                                    {(item.details.tips as string[]).slice(0, 2).map((tip, idx) => (
                                                        <Text key={idx} style={[styles.tipText, { color: c.textSecondary }]}>• {tip}</Text>
                                                    ))}
                                                </View>
                                            )}

                                            {/* Recommended products related to the symptom, if available */ }
                                            {(item.details?.shoppingList ?? []).length > 0 && (
                                                <View style={[styles.shoppingBlock, { minWidth: 0 }]}>
                                                    <Text style={[styles.sectionLabel, { color: config.accent }]}>Recommended Products</Text>
                                                    {(item.details.shoppingList as string[]).map((product, idx) => (
                                                        <View key={idx} style={styles.productRow}>
                                                            <Text style={[styles.productDot, { color: config.accent }]}>●</Text>
                                                            <Text style={[styles.productText, { color: c.text }]}>{product}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}

                                            {/* Medication recommendations */}
                                            <MedicationBlock medication={item.details?.medication ?? null} accent={config.accent} />
                                        </Animated.View>
                                    </View>
                                </Animated.View>
                            </TouchableOpacity>
                        );
                    }

                    // ── Default card (symptom) ────────────────────────────────
                    return (
                        <TouchableOpacity onPress={() => toggleCard(index)} activeOpacity={0.85}>
                            <Animated.View style={[
                                styles.card,
                                { backgroundColor: config.bg, borderColor: config.border, width: "100%" },
                                { transform: [{ scale: animation.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] }) }] }
                            ]}>
                                <View style={[styles.leftBar, { backgroundColor: config.accent }]} />
                                <View style={styles.cardInner}>

                                    {/* Emoji, label, title, and message for the symptom card */ }
                                    <View style={styles.cardHeader}>
                                        <View style={styles.cardHeaderLeft}>
                                            <Text style={styles.cardEmoji}>{config.emoji}</Text>
                                            <View style={{ flex: 1, paddingRight: 24 }}>
                                                <Text style={[styles.cardLabel, { color: config.accent }]}>
                                                    {config.label.toUpperCase()}
                                                </Text>
                                                <Text style={[styles.cardTitle, { color: c.text }]}>{item.type}</Text>
                                                <Text style={[styles.cardMessage, { color: c.textSecondary }]}>{item.message}</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.chevron, { color: config.accent }]}>{isExpanded ? "▲" : "▼"}</Text>
                                    </View>
                                    <Animated.View style={{
                                        maxHeight: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 9999] }),
                                        overflow: "hidden",
                                        opacity: animation,
                                        width: "100%"
                                    }}>
                                        <View style={[styles.divider, { backgroundColor: config.border }]} />

                                        {/* Description of the insight */ }
                                        {item.details?.description && (
                                            <Text style={[styles.expandDescription, { color: c.textSecondary }]}>{item.details.description}</Text>
                                        )}
                                        
                                        {/* Why am I feeling this?*/}
                                        {item.details?.why && (
                                            <View style={styles.whyBlock}>
                                                <Text style={[styles.sectionLabel, { color: config.accent}]}>Why am I feeling this?</Text>
                                                <Text style={[styles.whyText, { color: c.textSecondary}]}>{item.details.why}</Text>
                                            </View>
                                        )}

                                        {/* Typical cycle phase for the symptom, if available */ }
                                        {item.details?.phase && item.details.phase !== "Any" && (
                                            <View style={styles.phaseRow}>
                                                <Text style={[styles.phaseTag, { backgroundColor: config.border, color: c.background }]}>{item.details.phase}</Text>
                                            </View>
                                        )}

                                        {/* Tips for managing the symptom, if available */ }
                                        {(item.details?.tips ?? []).length > 0 && (
                                            <View style={styles.tipsBlock}>
                                                <Text style={[styles.sectionLabel, { color: config.accent }]}>Tips</Text>
                                                {(item.details.tips as string[]).slice(0, 2).map((tip, idx) => (
                                                    <Text key={idx} style={[styles.tipText, { color: c.textSecondary }]}>• {tip}</Text>
                                                ))}
                                            </View>
                                        )}

                                        {/* Recommended products related to the symptom, if available */ }
                                        {(item.details?.shoppingList ?? []).length > 0 && (
                                            <View style={[styles.shoppingBlock, { minWidth: 0 }]}>
                                                <Text style={[styles.sectionLabel, { color: config.accent }]}>Recommended Products</Text>
                                                {(item.details.shoppingList as string[]).map((product, idx) => (
                                                    <View key={idx} style={styles.productRow}>
                                                        <Text style={[styles.productDot, { color: config.accent }]}>●</Text>
                                                        <Text style={[styles.productText, { color: c.text }]}>{product}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}

                                        {/* Medication recommendations */}
                                        <MedicationBlock medication={item.details?.medication ?? null} accent={config.accent} />
                                                
                                    </Animated.View>
                                </View>
                            </Animated.View>
                        </TouchableOpacity>
                    );
                }}

                // If there are no insights to display, show a message encouraging the user to keep logging in order to receive insights based on their data 
                ListEmptyComponent={
                    <Text style={{ textAlign: "center", marginTop: 50, color: c.textMuted }}>
                        No insights yet — keep logging!
                    </Text>
                }
            />
        </View>
    );
}

// Styles
const styles = StyleSheet.create({
    
    // Center style for the loading state of the insights screen
    center: { 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center" 
    },

    // Title style for the insights screen
    title: { 
        fontSize: 26, 
        fontWeight: "800", 
        textAlign: "center", 
        marginBottom: 16, 
        letterSpacing: -0.5 
    },

    // Style for the insight cards
    card: {
        flexDirection: "row", 
        borderRadius: 16, 
        marginBottom: 12, 
        borderWidth: 1,
        overflow: "hidden", 
        shadowColor: "#000", 
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07, 
        shadowRadius: 6, 
        elevation: 2,
    },

    // Style for the coloured bar on the left side of the insight cards
    leftBar: { 
        width: 4,
    },

    // Style for the inner content of the insight cards
    cardInner: { 
        flex: 1, 
        padding: 14,
        minWidth: 0,
        width: "100%",
    },

    // Style for the header of the insight cards, which contains the emoji, label, title, and chevron
    cardHeader: { 
        flexDirection: "row", 
        alignItems: "flex-start", 
        justifyContent: "space-between" 
    },

    // Style for the left side of the card header, which contains the emoji, label, and title, arranged horizontally with some spacing between them
    cardHeaderLeft: { 
        flexDirection: "row", 
        alignItems: "flex-start", 
        flex: 1, 
        gap: 10 
    },

    // Style for the emoji in the card header, which visually represents the type of insight 
    cardEmoji: { 
        fontSize: 22, 
        marginTop: 1 
    },

    // Style for the label in the card header, which indicates the category of the insight 
    cardLabel: { 
        fontSize: 10, 
        fontWeight: "700", 
        letterSpacing: 1, 
        marginBottom: 2 
    },

    // Style for the title of the insight in the card header, which gives a brief summary of the insight
    cardTitle: { 
        fontSize: 15, 
        fontWeight: "700" 
    },

    // Style for the message of the insight
    cardMessage: { 
        fontSize: 12, 
        marginTop: 2, 
        lineHeight: 17 
    },

    // Style for the chevron in the card header
    chevron: { 
        fontSize: 13, 
        fontWeight: "600", 
        marginTop: 2 
    },

    // Style for the preview text in the summary card
    previewText: { 
        fontSize: 12, 
        marginTop: 6, 
        fontStyle: "italic" 
    },

    // Style for rows of chips, which are used to display symptoms in the summary card and common symptoms in the phase card
    chipsRow: { 
        flexDirection: "row", 
        flexWrap: "wrap", 
        gap: 6, 
        marginTop: 10 
    },

    // Style for individual chips
    chip: { 
        paddingVertical: 4, 
        paddingHorizontal: 10, 
        borderRadius: 20 
    },

    // Style for highlighted chips, which indicate symptoms that have actionable insights available based on the symptomInfo data
    chipHighlight: { 
        borderWidth: 1 
    },

    // No style for plain chips that do not have actionable insights available
    chipPlain: {
        // No border for plain chips
    },

    // Style for the text inside the chips
    chipText: { 
        fontSize: 11, 
        color: "#562b2b" 
    },

    // Style for the hint text below the chips in the summary card
    chipHint: { 
        fontSize: 10, 
        marginTop: 8, 
        fontStyle: "italic" 
    },

    // Style for the divider line that separates sections within the insight cards
    divider: { 
        height: 1, 
        marginVertical: 10, 
        opacity: 0.5 
    },

    // Style for the description text that appears when an insight card is expanded
    expandDescription: { 
        fontSize: 13, 
        lineHeight: 19 
    },

    // Style for the row that contains the phase tag in the symptom cards
    phaseRow: { 
        marginTop: 8 
    },

    // Style for the phase tag in the symptom cards
    phaseTag: { 
        alignSelf: "flex-start", 
        fontSize: 11, 
        fontWeight: "600", 
        paddingVertical: 3,
        paddingHorizontal: 10, 
        borderRadius: 20, 
        overflow: "hidden", 
        color: "#fff" 
    },

    // Style for the block that contains tips for managing symptoms
    tipsBlock: { 
        marginTop: 10 
    },

    // Style for the section label above the tips and recommended products sections within the insight cards
    sectionLabel: { 
        fontSize: 11, 
        fontWeight: "700", 
        marginBottom: 4, 
        letterSpacing: 0.8, 
        textTransform: "uppercase" 
    },

    // Style for individual tips within the tips block of the insight cards
    tipText: { 
        fontSize: 13, 
        lineHeight: 19, 
        fontStyle: "italic" 
    },

    // Style for the block that contains recommended products related to the symptoms
    shoppingBlock: { 
        marginTop: 10 
    },

    // Style for rows of recommended products
    productRow: { 
        flexDirection: "row", 
        alignItems: "flex-start", 
        width: "100%",
    },

    // Style for the bullet point 
    productDot: { 
        fontSize: 12, 
        marginTop: 2 
    },

    // Style for the text of the recommended products
    productText: { 
        fontSize: 13, 
        flex: 1, 
        lineHeight: 19,
        flexShrink: 1, 
    },

    // Style for the description of the cycle phase in the phase insight cards
    phaseDescription: { 
        fontSize: 13, 
        lineHeight: 19, 
        marginTop: 6, 
        marginBottom: 4 
    },

    whyBlock: {
        marginTop: 10,
        backgroundColor: "#00000008",
        borderRadius: 10,
        padding: 10
    },

    whyText: {
        fontSize: 13,
        lineHeight: 20,
        fontStyle: 'italic',
    },

    bullet: {
        width: 14,
        alignItems: "center",
        justifyContent: "flex-start",
    },


});

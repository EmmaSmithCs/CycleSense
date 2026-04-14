import { useTheme } from '@/context/ThemeContext';
import { auth, db } from '@/firebase/config';
import { useFocusEffect } from '@react-navigation/native';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { collection, getDocs } from 'firebase/firestore';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { symptomInfo } from '../data/symptomInfo';
import { buildCycles, getCycleInfo } from '../utils/cyclePrediction';


type SymptomEntry = {
    name: string;
    intensity?: number; 
}

type DailyLog = {
    id: string;
    bleeding: "None" | "Light" | "Medium" | "Heavy";
    symptoms: SymptomEntry[];
    date?: string;
}

type Insight = {
    type: string;
    message: string;
    details?: any;
    cardType: "summary" | "symptom" | "intensity" | "prediction" | "phase";
};

const getPhaseForDay = (cycleDay: number, avgLength: number): string => {
    const periodLength = 5;
    const ovulationLength = 2;
    const lutealLength = 14;
    const follicularLength = Math.max(avgLength - periodLength - ovulationLength - lutealLength, 0);
    const phases = [
        { name: "Menstrual", length: periodLength },
        { name: "Follicular", length: follicularLength },
        { name: "Ovulation", length: ovulationLength },
        { name: "Luteal", length: lutealLength },
    ];
    let running = 0;
    for (const phase of phases) {
        running += phase.length;
        if (cycleDay <= running) return phase.name;
    }
    return "Luteal";
};

const PHASE_DATA: Record<string, { emoji: string, description: string; symptoms: string[] }> = {
    Menstrual: {
        emoji: "🩸",
        description: "Your body is shedding the uterine lining. Energy tends to be low — rest is your friend right now.",
        symptoms: ["Cramps", "Headache", "Bloating", "Back pain", "Low mood", "Fatigue", "Nausea", "Low Libido", "Irritable", "Tender breasts", "Diarrhoea", "Gas"],
    },
    Follicular: {
        emoji: "🌱",
        description: "Oestrogen is rising and energy is returning. This is often the best-feeling phase of the cycle.",
        symptoms: ["High energy", "Happy", "Energised", "High Libido", "Calm", "Acne", "Headache", "Increased appetite"],
    },
    Ovulation: {
        emoji: "🥚",
        description: "Your body is releasing an egg. Oestrogen peaks and you may feel at your most sociable and confident.",
        symptoms: ["Ovulation pain", "Tender breasts", "Bloating", "High Libido", "Energised", "Acne", "Egg white discharge", "Back pain"],
    },
    Luteal: {
        emoji: "💤",
        description: "Progesterone rises then falls. PMS symptoms are common in the second half of this phase.",
        symptoms: ["Mood swings", "Bloating", "Tender breasts", "Irritable", "Anxious", "Low mood", "Insomnia", "Chocolate cravings", "Headache", "Exhausted", "Low Libido", "Acne"],
    },
};

// ── Intensity Bar Chart ───────────────────────────────────────────────────────
function IntensityChart({ data, accent, progress }: {
    data: { date: string; intensity: number }[];
    accent: string;
    progress: Animated.Value;
}) {
    const width = 280;
    const height = 100;
    const barWidth = 28;
    const maxVal = 5;
    const gap = (width - barWidth * data.length) / (data.length + 1);

    return (
        <View style={{ alignItems: 'center', marginTop: 12 }}>
            <Svg width={width} height={height + 20}>
                {data.map((d, i) => {
                    const barHeight = (d.intensity / maxVal) * height;
                    const x = gap + i * (barWidth + gap);
                    const y = height - barHeight;
                    return (
                        <React.Fragment key={i}>
                            {/* Background bar */}
                            <Rect
                                x={x}
                                y={0}
                                width={barWidth}
                                height={height}
                                rx={6}
                                fill={accent + '22'}
                            />
                            {/* Filled bar */}
                            <Rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                rx={6}
                                fill={accent}
                                opacity={0.85}
                            />
                            {/* Intensity number */}
                            <SvgText
                                x={x + barWidth / 2}
                                y={y - 4}
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
                                y={height + 14}
                                fontSize={8}
                                fill={accent + 'aa'}
                                textAnchor="middle"
                            >
                                {d.date}
                            </SvgText>
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
                            y1={avgY}
                            x2={width - gap / 2}
                            y2={avgY}
                            stroke={accent}
                            strokeWidth={1}
                            strokeDasharray="4,3"
                            opacity={0.5}
                        />
                    );
                })()}
            </Svg>
            <Text style={{ fontSize: 10, color: accent + 'aa', marginTop: 2, fontStyle: 'italic' }}>
                Dashed line = your average intensity
            </Text>
        </View>
    );
}

// ── Cycle Day Heatmap ─────────────────────────────────────────────────────────
function CycleDayHeatmap({ dayCounts, avgLength, accent }: {
    dayCounts: Record<number, number>;
    avgLength: number;
    accent: string;
}) {
    const totalDays = Math.min(avgLength, 35);
    const bubbleSize = 22;
    const cols = 7;
    const rows = Math.ceil(totalDays / cols);
    const maxCount = Math.max(...Object.values(dayCounts), 1);

    return (
        <View style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 10, color: accent, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 }}>
                SYMPTOM FREQUENCY BY CYCLE DAY
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                {Array.from({ length: totalDays }, (_, i) => {
                    const day = i + 1;
                    const count = dayCounts[day] ?? 0;
                    const opacity = count === 0 ? 0.12 : 0.2 + (count / maxCount) * 0.8;
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
                <Text style={{ fontSize: 9, color: accent + 'aa', fontStyle: 'italic' }}>
                    Darker = appeared more often on that day
                </Text>
            </View>
        </View>
    );
}


export default function InsightsScreen() {
    const { theme } = useTheme();
    const c = theme.colors;

    const CARD_CONFIG = {
        summary:    { emoji: "📋", accent: c.cardInsightBorder,    label: "Today's Log",  bg: c.cardInsight,    border: c.cardInsightBorder },
        symptom:    { emoji: "🌸", accent: c.cardInsightBorder,    label: "Tracked",      bg: c.cardInsight,    border: c.cardInsightBorder },
        intensity:  { emoji: "📈", accent: c.cardIntensityBorder,  label: "Intensity",    bg: c.cardIntensity,  border: c.cardIntensityBorder },
        prediction: { emoji: "🔮", accent: c.cardPredictionBorder, label: "Prediction",   bg: c.cardPrediction, border: c.cardPredictionBorder },
        phase:      { emoji: "🌿", accent: c.cardPhaseBorder,      label: "Cycle Phase",  bg: c.cardPhase,      border: c.cardPhaseBorder },
    };

    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const animations = useRef<Map<number, Animated.Value>>(new Map()).current;
    const chartProgress = useRef<Map<number, Animated.Value>>(new Map()).current;

    const toggleCard = (index: number) => {
        let animation = animations.get(index);
        if (!animation) {
            animation = new Animated.Value(0);
            animations.set(index, animation);
        }
        let progress = chartProgress.get(index);
        if (!progress) {
            progress = new Animated.Value(0);
            chartProgress.set(index, progress);
        }

        const isOpen = expandedIndex === index;
        const toValue = isOpen ? 0 : 1;

        Animated.parallel([
            Animated.timing(animation, { toValue, duration: 250, useNativeDriver: false }),
            Animated.timing(progress, { toValue, duration: 500, useNativeDriver: false }),
        ]).start(() => {
            if (isOpen) setExpandedIndex(null);
            else setExpandedIndex(index);
        });
    };

    const convertToCycleLogs = (logs: DailyLog[]) => {
        return logs.map(l => ({
            ...l,
            date: l.date ?? l.id,
            symptoms: l.symptoms.map(s => s.name)
        }));
    };

    const generateInsights = (logs: DailyLog[]) => {
        if (!logs.length) return;

        const cycleLogs = convertToCycleLogs(logs);
        const { cycleDay, currentPhase, cycleStartDate, avgLength } = getCycleInfo(cycleLogs);

        if (!cycleDay || !currentPhase) return;

        const resolvedAvgLength = avgLength || 28;
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todayLog = logs.find(l => format(new Date(l.date || ""), 'yyyy-MM-dd') === todayStr);

        const symptomInfoLookup = (name : string) => {
            return symptomInfo[name]
            ?? symptomInfo[name.toLowerCase()]
            ?? Object.entries(symptomInfo).find(
                ([k]) => k.toLowerCase() === name.toLowerCase()
            )?.[1];
        };

        const newInsights: Insight[] = [];

        // ── Summary card ──────────────────────────────────────────────────────
        if (todayLog) {
            const summarySymptoms = todayLog.symptoms.map(sym => ({
                name: sym.name,
                hasShoppingList: !!(symptomInfoLookup(sym.name)?.shoppingList?.length)
            }));
            newInsights.push({
                cardType: "summary",
                type: "Today's Log",
                message: `You tracked ${summarySymptoms.length} symptom${summarySymptoms.length !== 1 ? "s" : ""} today`,
                details: { symptoms: summarySymptoms }
            });
        } else {
            newInsights.push({
                cardType: "summary",
                type: "Today's Log",
                message: "You haven't logged anything today. Remember, the more you log, the better your insights!",
                details: { symptoms: [] }
            });
        }

        // ── Symptom cards ─────────────────────────────────────────────────────
        if (todayLog) {
            todayLog.symptoms.forEach(sym => {
                const info = symptomInfoLookup(sym.name) ?? {};
                const hasContent = Array.isArray(info.shoppingList) && info.shoppingList.length > 0;
                if (!hasContent) return;
                newInsights.push({
                    cardType: "symptom",
                    type: `Symptom: ${sym.name}`,
                    message: `You tracked ${sym.name} today`,
                    details: {
                        description: info.description ?? "No description available.",
                        tips: Array.isArray(info.tips) ? info.tips : [],
                        phase: info.typicalCyclePhase ?? "Unknown phase",
                        shoppingList: Array.isArray(info.shoppingList) ? info.shoppingList : [],
                    }
                });
            });
        }

        // ── Intensity cards ───────────────────────────────────────────────────
        const cycles = buildCycles(cycleLogs);
        const last3Cycles = cycles.slice(-3);
        const last3CycleDates = new Set<string>();
        last3Cycles.forEach((cycle, idx) => {
            const start = new Date(cycle.startDate);
            // End is the day before the next cycle starts, or start + avgLength
            const nextCycle = last3Cycles[idx + 1];
            const end = nextCycle 
                ? addDays(new Date(nextCycle.startDate), -1)
                : addDays(start, resolvedAvgLength - 1);
            
            let current = new Date(start);
            while (current <= end) {
                last3CycleDates.add(format(current, 'yyyy-MM-dd'));
                current.setDate(current.getDate() + 1);
            }
        });

        const backPainHistorical = logs.filter(l => 
            l.symptoms.some(s => s.name.toLowerCase() === "back pain" && s.intensity !== undefined)
        );
        console.log("All Back pain logs with intensity:", backPainHistorical.map(l => ({
            date: l.date,
            inDateSet: l.date ? last3CycleDates.has(l.date) : false,
            intensity: l.symptoms.find(s => s.name.toLowerCase() === "back pain")?.intensity
        })));

        if (todayLog) {
            todayLog.symptoms.forEach(sym => {
                    console.log("=== Checking intensity for:", sym.name)
                    const recentPastLogs = logs.filter(l => {
                        if (!l.date || l.date === todayLog.date) return false;
                        return l.date && last3CycleDates.has(l.date) && l.symptoms.some(
                            s => s.name.toLowerCase() === sym.name.toLowerCase() && s.intensity !== undefined
                        );
                    });

                console.log("last3CycleDates size:", last3CycleDates.size);
                console.log("last3Cycles:", last3Cycles.map(c => ({ start: c.startDate, end: c.endDate })));
                console.log("completedCycles count:", last3Cycles.length);

                console.log("Recent past logs found:", recentPastLogs.length);
                console.log("Sym intensity:", sym.intensity);
                if (recentPastLogs.length < 2 || sym.intensity === undefined) {
                    console.log("SKIPPED - not enough logs or no intensity");
                    return;
                };

                const avgRecentIntensity =
                    recentPastLogs.reduce((acc, l) => {
                        const s = l.symptoms.find(s => s.name === sym.name);
                        return acc + (s?.intensity || 0);
                    }, 0) / recentPastLogs.length;

                    console.log("Avg recent intensity:", avgRecentIntensity);
                    console.log("isWorsening:", sym.intensity > avgRecentIntensity);
                    console.log("isImproving:", sym.intensity < avgRecentIntensity);

                const info = symptomInfoLookup(sym.name);
                console.log("Info found:", !!info, "Shopping list:", info?.shoppingList);
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
                        }
                    });
                }
            });
        }

        // ── Prediction cards ──────────────────────────────────────────────────
        const getCycleDayForDate = (dateStr: string): { day: number; phase: string } | null => {
            const logDate = new Date(dateStr);
            for (const cycle of cycles) {
                const start = new Date(cycle.startDate);
                const end = new Date(cycle.endDate);
                if (logDate >= start && logDate <= end) {
                    const day = differenceInCalendarDays(logDate, start) + 1;
                    return { day, phase: getPhaseForDay(day, resolvedAvgLength) };
                }
            }
            const precedingCycle = [...cycles].reverse().find(c => new Date(c.startDate) <= logDate);
            if (precedingCycle) {
                const day = differenceInCalendarDays(logDate, new Date(precedingCycle.startDate)) + 1;
                if (day > 0 && day <= resolvedAvgLength) {
                    return { day, phase: getPhaseForDay(day, resolvedAvgLength) };
                }
            }
            return null;
        };

        const symptomDayWeighted: Record<string, Record<number, number>> = {};
        const symptomPhaseCount: Record<string, Record<string, number>> = {};

        const CYCLE_WEIGHTS = [1, 0.7, 0.4]; // More recent cycles count more
        
        const cycleIndexMap = new Map<string, { cycleIndex: number; cycleDay: number }>();
        const last3ForWeighting = cycles.slice(-3);

        last3ForWeighting.forEach((cycle, i) => {
            const start = new Date(cycle.startDate);
            const end = new Date(cycle.endDate);
            let current = new Date(start);
            while (current <= end) {
                const dateStr = format(current, 'yyyy-MM-dd');
                const day = differenceInCalendarDays(current, start) + 1;
                cycleIndexMap.set(dateStr, { cycleIndex: (last3ForWeighting.length - 1) - i, cycleDay: day });
                current.setDate(current.getDate() + 1);

            }
        });

        logs.forEach(log => {
            if (!log.date) return;
            const cyclePosition = getCycleDayForDate(log.date);
            if (!cyclePosition) return;
            const { day: logCycleDay, phase: logPhase } = cyclePosition;
            
            const mapped = cycleIndexMap.get(log.date);
            const weight = mapped !== undefined ? (CYCLE_WEIGHTS[mapped.cycleIndex] ?? 0) : 0;


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

        Object.keys(symptomDayWeighted).forEach(symName => {
            const dayCounts = symptomDayWeighted[symName];
            const upcomingDays = [
                ((cycleDay % resolvedAvgLength) + 1),
                ((cycleDay + 1) % resolvedAvgLength) + 1,
            ];
            upcomingDays.forEach(day => {
                const score = dayCounts[day] ?? 0;
                if (score < 1.5) return;
                const info = symptomInfoLookup(symName) || {};
                if (!info.shoppingList || info.shoppingList.length === 0) return;
                const alreadyAdded = newInsights.some(i => i.cardType === "prediction" && i.type === `Prediction: ${symName}`);
                if (alreadyAdded) return;
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
                    }
                });
            });
        });

        // ── Phase card ────────────────────────────────────────────────────────
        const phaseData = PHASE_DATA[currentPhase];
        if (phaseData) {
            const alreadyLoggedNames = new Set(todayLog?.symptoms.map(s => s.name) ?? []);
            const dateSeed = parseInt(format(new Date(), 'yyyMMdd'));
            const available = phaseData.symptoms.filter(s => !alreadyLoggedNames.has(s));
            const shuffled = [...available].sort((a, b) => {
                const hashA = (a.charCodeAt(0) + dateSeed) % 97;
                const hashB = (b.charCodeAt(0) + dateSeed) % 97;
                return hashA - hashB;
            });
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

        const order = { summary: 0, symptom: 1, intensity: 2, prediction: 3, phase: 4 };
        newInsights.sort((a, b) => order[a.cardType] - order[b.cardType]);
        return newInsights;
    };

    useFocusEffect(
        useCallback(() => {
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
                setLogs(fetchedLogs);
                const generatedInsights = generateInsights(fetchedLogs);
                if (generatedInsights) setInsights(generatedInsights);
                setLoading(false);
            };
            fetchLogs();
        }, [])
    );

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: c.background }]}>
                <ActivityIndicator size="large" color={c.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, paddingTop: 50, backgroundColor: c.background }}>
            <Text style={[styles.title, { color: c.text }]}>Your Insights</Text>
            <FlatList
                data={insights}
                keyExtractor={(item, index) => item.cardType + item.type + index}
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                renderItem={({ item, index }) => {
                    const animation = animations.get(index) || (() => { const a = new Animated.Value(0); animations.set(index, a); return a; })();
                    const progress = chartProgress.get(index) || (() => { const a = new Animated.Value(0); chartProgress.set(index, a); return a; })();
                    const isExpanded = expandedIndex === index;
                    const config = CARD_CONFIG[item.cardType];

                    // ── Summary card ──────────────────────────────────────────
                    if (item.cardType === "summary") {
                        const symptoms: { name: string; hasShoppingList: boolean }[] = item.details?.symptoms ?? [];
                        const preview = symptoms.slice(0, 4).map(s => s.name).join("  ·  ");
                        const hasMore = symptoms.length > 4;
                        return (
                            <TouchableOpacity onPress={() => toggleCard(index)} activeOpacity={0.85}>
                                <View style={[styles.card, { backgroundColor: config.bg, borderColor: config.border }]}>
                                    <View style={[styles.leftBar, { backgroundColor: config.accent }]} />
                                    <View style={styles.cardInner}>
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
                                        {!isExpanded && (
                                            <Text style={[styles.previewText, { color: c.textMuted }]} numberOfLines={1}>
                                                {preview}{hasMore ? `  +${symptoms.length - 4} more` : ""}
                                            </Text>
                                        )}
                                        <Animated.View style={{
                                            maxHeight: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 500] }),
                                            overflow: "hidden",
                                            opacity: animation,
                                        }}>
                                            <View style={styles.chipsRow}>
                                                {symptoms.map((sym, i) => (
                                                    <View key={i} style={[styles.chip, sym.hasShoppingList
                                                        ? [styles.chipHighlight, { backgroundColor: c.primaryLight, borderColor: config.accent }]
                                                        : [styles.chipPlain, { backgroundColor: c.surface }]]}>
                                                        <Text style={[styles.chipText, { fontWeight: sym.hasShoppingList ? "700" : "400", color: sym.hasShoppingList ? config.accent : c.textSecondary }]}>
                                                            {sym.name}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                            {symptoms.length > 0 && (
                                                <Text style={[styles.chipHint, { color: c.textMuted }]}>✦ Bold symptoms have recommendations below</Text>
                                            )}
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
                                        <Text style={[styles.phaseDescription, { color: c.textSecondary }]}>{item.message}</Text>
                                        <Animated.View style={{
                                            maxHeight: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 300] }),
                                            overflow: "hidden",
                                            opacity: animation,
                                        }}>
                                            <View style={[styles.divider, { backgroundColor: config.border }]} />
                                            <Text style={[styles.sectionLabel, { color: config.accent }]}>Common this phase</Text>
                                            <View style={styles.chipsRow}>
                                                {phaseSymptoms.map((sym, i) => (
                                                    <View key={i} style={[styles.chip, { backgroundColor: c.card, borderWidth: 1, borderColor: config.accent }]}>
                                                        <Text style={[styles.chipText, { color: config.accent, fontWeight: "600" }]}>{sym}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                            <Text style={[styles.chipHint, { color: c.textMuted }]}>✦ Tap a symptom in the log screen to track it</Text>
                                        </Animated.View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }

                    // ── Intensity card (with bar chart) ───────────────────────
                    if (item.cardType === "intensity") {
                        const chartData: { date: string; intensity: number }[] = item.details?.chartData ?? [];
                        return (
                            <TouchableOpacity onPress={() => toggleCard(index)} activeOpacity={0.85}>
                                <Animated.View style={[
                                    styles.card,
                                    { backgroundColor: config.bg, borderColor: config.border },
                                    { transform: [{ scale: animation.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] }) }] }
                                ]}>
                                    <View style={[styles.leftBar, { backgroundColor: config.accent }]} />
                                    <View style={styles.cardInner}>
                                        <View style={styles.cardHeader}>
                                            <View style={styles.cardHeaderLeft}>
                                                <Text style={styles.cardEmoji}>{config.emoji}</Text>
                                                <View style={{ flex: 1, paddingRight: 24 }}>
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
                                            maxHeight: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 500] }),
                                            overflow: "hidden",
                                            opacity: animation,
                                        }}>
                                            <View style={[styles.divider, { backgroundColor: config.border }]} />

                                            {/* Bar chart */}
                                            {chartData.length > 0 && (
                                                <>
                                                    <Text style={[styles.sectionLabel, { color: config.accent }]}>Intensity History</Text>
                                                    <IntensityChart data={chartData} accent={config.accent} progress={progress} />
                                                </>
                                            )}

                                            {item.details?.description && (
                                                <Text style={[styles.expandDescription, { color: c.textSecondary, marginTop: 12 }]}>
                                                    {item.details.description}
                                                </Text>
                                            )}
                                            {(item.details?.tips ?? []).length > 0 && (
                                                <View style={styles.tipsBlock}>
                                                    <Text style={[styles.sectionLabel, { color: config.accent }]}>Tips</Text>
                                                    {(item.details.tips as string[]).slice(0, 2).map((tip, idx) => (
                                                        <Text key={idx} style={[styles.tipText, { color: c.textSecondary }]}>• {tip}</Text>
                                                    ))}
                                                </View>
                                            )}
                                            {(item.details?.shoppingList ?? []).length > 0 && (
                                                <View style={styles.shoppingBlock}>
                                                    <Text style={[styles.sectionLabel, { color: config.accent }]}>Recommended Products</Text>
                                                    {(item.details.shoppingList as string[]).map((product, idx) => (
                                                        <View key={idx} style={styles.productRow}>
                                                            <Text style={[styles.productDot, { color: config.accent }]}>●</Text>
                                                            <Text style={[styles.productText, { color: c.text }]}>{product}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
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
                        return (
                            <TouchableOpacity onPress={() => toggleCard(index)} activeOpacity={0.85}>
                                <Animated.View style={[
                                    styles.card,
                                    { backgroundColor: config.bg, borderColor: config.border },
                                    { transform: [{ scale: animation.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] }) }] }
                                ]}>
                                    <View style={[styles.leftBar, { backgroundColor: config.accent }]} />
                                    <View style={styles.cardInner}>
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
                                            maxHeight: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 600] }),
                                            overflow: "hidden",
                                            opacity: animation,
                                        }}>
                                            <View style={[styles.divider, { backgroundColor: config.border }]} />

                                            {/* Heatmap */}
                                            <CycleDayHeatmap dayCounts={dayCounts} avgLength={avgLen} accent={config.accent} />

                                            {item.details?.description && (
                                                <Text style={[styles.expandDescription, { color: c.textSecondary, marginTop: 12 }]}>
                                                    {item.details.description}
                                                </Text>
                                            )}
                                            {(item.details?.tips ?? []).length > 0 && (
                                                <View style={styles.tipsBlock}>
                                                    <Text style={[styles.sectionLabel, { color: config.accent }]}>Tips</Text>
                                                    {(item.details.tips as string[]).slice(0, 2).map((tip, idx) => (
                                                        <Text key={idx} style={[styles.tipText, { color: c.textSecondary }]}>• {tip}</Text>
                                                    ))}
                                                </View>
                                            )}
                                            {(item.details?.shoppingList ?? []).length > 0 && (
                                                <View style={styles.shoppingBlock}>
                                                    <Text style={[styles.sectionLabel, { color: config.accent }]}>Recommended Products</Text>
                                                    {(item.details.shoppingList as string[]).map((product, idx) => (
                                                        <View key={idx} style={styles.productRow}>
                                                            <Text style={[styles.productDot, { color: config.accent }]}>●</Text>
                                                            <Text style={[styles.productText, { color: c.text }]}>{product}</Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
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
                                { backgroundColor: config.bg, borderColor: config.border },
                                { transform: [{ scale: animation.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] }) }] }
                            ]}>
                                <View style={[styles.leftBar, { backgroundColor: config.accent }]} />
                                <View style={styles.cardInner}>
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
                                        maxHeight: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 350] }),
                                        overflow: "hidden",
                                        opacity: animation,
                                    }}>
                                        <View style={[styles.divider, { backgroundColor: config.border }]} />
                                        {item.details?.description && (
                                            <Text style={[styles.expandDescription, { color: c.textSecondary }]}>{item.details.description}</Text>
                                        )}
                                        {item.details?.phase && item.details.phase !== "Any" && (
                                            <View style={styles.phaseRow}>
                                                <Text style={[styles.phaseTag, { backgroundColor: config.border, color: c.background }]}>{item.details.phase}</Text>
                                            </View>
                                        )}
                                        {(item.details?.tips ?? []).length > 0 && (
                                            <View style={styles.tipsBlock}>
                                                <Text style={[styles.sectionLabel, { color: config.accent }]}>Tips</Text>
                                                {(item.details.tips as string[]).slice(0, 2).map((tip, idx) => (
                                                    <Text key={idx} style={[styles.tipText, { color: c.textSecondary }]}>• {tip}</Text>
                                                ))}
                                            </View>
                                        )}
                                        {(item.details?.shoppingList ?? []).length > 0 && (
                                            <View style={styles.shoppingBlock}>
                                                <Text style={[styles.sectionLabel, { color: config.accent }]}>Recommended Products</Text>
                                                {(item.details.shoppingList as string[]).map((product, idx) => (
                                                    <View key={idx} style={styles.productRow}>
                                                        <Text style={[styles.productDot, { color: config.accent }]}>●</Text>
                                                        <Text style={[styles.productText, { color: c.text }]}>{product}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </Animated.View>
                                </View>
                            </Animated.View>
                        </TouchableOpacity>
                    );
                }}
                ListEmptyComponent={
                    <Text style={{ textAlign: "center", marginTop: 50, color: c.textMuted }}>
                        No insights yet — keep logging!
                    </Text>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    center: { 
        flex: 1, 
        justifyContent: "center", alignItems: "center" },
    title: { fontSize: 26, fontWeight: "800", textAlign: "center", marginBottom: 16, letterSpacing: -0.5 },
    card: {
        flexDirection: "row", borderRadius: 16, marginBottom: 12, borderWidth: 1,
        overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
    },
    leftBar: { width: 4 },
    cardInner: { flex: 1, padding: 14 },
    cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
    cardHeaderLeft: { flexDirection: "row", alignItems: "flex-start", flex: 1, gap: 10 },
    cardEmoji: { fontSize: 22, marginTop: 1 },
    cardLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 2 },
    cardTitle: { fontSize: 15, fontWeight: "700" },
    cardMessage: { fontSize: 12, marginTop: 2, lineHeight: 17 },
    chevron: { fontSize: 13, fontWeight: "600", marginTop: 2 },
    previewText: { fontSize: 12, marginTop: 6, fontStyle: "italic" },
    chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
    chip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
    chipHighlight: { borderWidth: 1 },
    chipPlain: {},
    chipText: { fontSize: 11, color: "#562b2b" },
    chipHint: { fontSize: 10, marginTop: 8, fontStyle: "italic" },
    divider: { height: 1, marginVertical: 10, opacity: 0.5 },
    expandDescription: { fontSize: 13, lineHeight: 19 },
    phaseRow: { marginTop: 8 },
    phaseTag: { alignSelf: "flex-start", fontSize: 11, fontWeight: "600", paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20, overflow: "hidden", color: "#fff" },
    tipsBlock: { marginTop: 10 },
    sectionLabel: { fontSize: 11, fontWeight: "700", marginBottom: 4, letterSpacing: 0.8, textTransform: "uppercase" },
    tipText: { fontSize: 13, lineHeight: 19, fontStyle: "italic" },
    shoppingBlock: { marginTop: 10 },
    productRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 3 },
    productDot: { fontSize: 8, marginTop: 5 },
    productText: { fontSize: 13, flex: 1, lineHeight: 19 },
    phaseDescription: { fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 4 },
});
import { auth, db } from '@/firebase/config';
import { useFocusEffect } from '@react-navigation/native';
import { differenceInCalendarDays, format } from 'date-fns';
import { collection, getDocs } from 'firebase/firestore';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    cardType: "summary" | "symptom" | "intensity" | "prediction";
};

const getPhaseForDay = (cycleDay: number, avgLength: number): string => {
    const periodLength = 5;
    const ovulationLength = 2;
    const lutealLength = 14;
    const follicularLength = Math.max(
        avgLength - periodLength - ovulationLength - lutealLength,
        0
    );

    const phases = [
        { name: "Menstrual", length: periodLength },
        { name: "Follicular", length: follicularLength },
        { name: "Ovulation", length: ovulationLength },
        { name: "Luteal", length: lutealLength },
    ];

    let running = 0;
    for (const phase of phases) {
        running += phase.length;
        if (cycleDay <= running) {
            return phase.name;
        }
    }

    return "Luteal";
};

const CARD_CONFIG = {
    summary:    { emoji: "📋", accent: "#e91e8c", label: "Today's Log",   bg: "#fce4ec", border: "#f48fb1" },
    symptom:    { emoji: "🌸", accent: "#e91e8c", label: "Tracked",       bg: "#fce4ec", border: "#f48fb1" },
    intensity:  { emoji: "📈", accent: "#ef6c00", label: "Intensity",     bg: "#fff3e0", border: "#ffb74d" },
    prediction: { emoji: "🔮", accent: "#5c6bc0", label: "Prediction",    bg: "#e8eaf6", border: "#9fa8da" },
};


export default function InsightsScreen() {
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
    const animations = useRef<Map<number, Animated.Value>>(new Map()).current;


    const toggleCard = (index: number) => {
        let animation = animations.get(index);
        if (!animation) {
            animation = new Animated.Value(0);
            animations.set(index,animation);
        }

        const toValue = expandedIndex === index ? 0 : 1;
        Animated.timing(animation, {
            toValue,
            duration: 250,
            useNativeDriver: false,
        }).start(() => {
            if (expandedIndex === index) setExpandedIndex(null);
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
        console.log("Fetched Logs for Insights:", logs);
        if (!logs.length) return;

        const cycleLogs = convertToCycleLogs(logs);
        const { cycleDay, currentPhase, cycleStartDate, avgLength } = getCycleInfo(cycleLogs);

        if (!cycleDay || !currentPhase) return;

        const resolvedAvgLength = avgLength || 28;

        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todayLog = logs.find(l => format(new Date(l.date || ""), 'yyyy-MM-dd') === todayStr);
        if (!todayLog) return;

        // console log to show todays data
        console.log("Today's Log:", todayLog);

        const newInsights: Insight[] = [];

        // Summary card
        const summarySymptoms = todayLog.symptoms.map(sym => ({
            name: sym.name,
            hasShoppingList: !!(symptomInfo[sym.name]?.shoppingList?.length)
        }));

        newInsights.push({
            cardType: "summary",
            type: "Today's Log",
            message: `You tracked ${summarySymptoms.length} symptom${summarySymptoms.length !== 1 ? "s" : ""} today`,
            details: {
                symptoms: summarySymptoms,
            }
        });

        // Symptoms today
        todayLog.symptoms.forEach(sym => {
            const info = symptomInfo[sym.name] ?? {};
            const intensity = Number(sym.intensity) || 0;
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



        // Intensity trends
        todayLog.symptoms.forEach(sym => {
            const pastLogs = logs
                .filter(l => l.date !== todayLog.date)
                .filter(l => l.symptoms.some(s => s.name === sym.name));

            const intensity = Number(sym.intensity) || 0;

            if (pastLogs.length && sym.intensity !== undefined) {
                const avgPastIntensity = 
                    pastLogs.reduce((acc, l) => {
                        const s = l.symptoms.find(s => s.name === sym.name);
                        return acc + (s?.intensity || 0);
                    } , 0) / pastLogs.length;
            
                

                if (sym.intensity > avgPastIntensity) {
                    const info = symptomInfo[sym.name];
                    newInsights.push({
                        cardType: "intensity",
                        type: 'Intensity: ' + sym.name,
                        message: `${sym.name} seems to be worsening (intensity ${sym.intensity} vs avg ${avgPastIntensity.toFixed(1)}).`,
                        details: {
                            description: info?.description ?? "No description available.",
                            tips: Array.isArray(info?.tips) ? info.tips : [],
                            phase: info?.typicalCyclePhase ?? "Unknown phase",
                            shoppingList: Array.isArray(info?.shoppingList) ? info.shoppingList : [],
                        } 
                    });
                } else if (sym.intensity < avgPastIntensity) {
                    const info = symptomInfo[sym.name];
                    newInsights.push({
                        cardType: "intensity",
                        type: 'Intensity: ' + sym.name,
                        message: `${sym.name} is improving (intensity ${sym.intensity} vs avg ${avgPastIntensity.toFixed(1)}).`,
                        details: {
                            description: info?.description ?? "No description available.",
                            tips: Array.isArray(info?.tips) ? info.tips : [],
                            phase: info?.typicalCyclePhase ?? "Unknown phase",
                            shoppingList: Array.isArray(info?.shoppingList) ? info.shoppingList : [],
                        } 
                    });
                }
            
            }
        });

        // Predicted phase insights

        const cycles = buildCycles(cycleLogs);
        const getCycleDayForDate = (dateStr: string): {day: number; phase: string} | null => {
            const logDate = new Date(dateStr);
            for (const cycle of cycles) {
                const start = new Date(cycle.startDate);
                const end = new Date(cycle.endDate);

                if (logDate >= start && logDate <= end) {
                    const day = differenceInCalendarDays(logDate, start) + 1;
                    const phase = getPhaseForDay(day, resolvedAvgLength);
                    return { day, phase };
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

        const symptomPhaseCount: Record<string, Record<string, number>> = {};
        const symptomDayCount: Record<string, Record<number, number>> = {};

        // Frequency maps
        logs.forEach(log => {
            if (!log.date) return;

            const cyclePosition = getCycleDayForDate(log.date);
            if (!cyclePosition) return;

            const { day: logCycleDay, phase: logPhase } = cyclePosition;

        
            log.symptoms.forEach(sym => {
                console.log(`Symptom: ${sym.name}, log date: ${log.date}, calculated cycle day: ${logCycleDay}`)
                const name = sym.name;

    
                if (!symptomPhaseCount[name]) symptomPhaseCount[name] = {};
                if (!symptomPhaseCount[name][logPhase || "Unknown"]) symptomPhaseCount[name][logPhase || "Unknown"] = 0;

                symptomPhaseCount[name][logPhase || "Unknown"]++;

                // Day tracking
                if (!symptomDayCount[name]) symptomDayCount[name] = {};
                if (!symptomDayCount[name][logCycleDay]) symptomDayCount[name][logCycleDay] = 0;

                symptomDayCount[name][logCycleDay]++;

                console.log(`Detected symptom: ${name} on cycle day ${logCycleDay} (phase: ${logPhase}) - count so far: ${symptomDayCount[name][logCycleDay]} occurrences on this day, ${symptomPhaseCount[name][logPhase || "Unknown"]} occurrences in this phase.`);
            });
        });

        // Generate prediction insights
        Object.keys(symptomDayCount).forEach(symName => {
            const dayCounts = symptomDayCount[symName];

            const upcomingDays = [
                ((cycleDay % resolvedAvgLength) + 1),
                ((cycleDay + 1) % resolvedAvgLength) + 1,
            ];

            upcomingDays.forEach(day => {
                const count = dayCounts[day] ?? 0;
                if (count < 2) return;

                const info = symptomInfo[symName] || {};

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
                    }
                });
            }); 

        });

        const order = {summary: 0, symptom: 1, intensity: 2, prediction: 3};
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
                        if (typeof sym === "string") {
                            nameStr = sym;
                        } else if (typeof sym === "object") {
                            if (typeof sym.name === "string") {
                                nameStr = sym.name;
                            } else if (typeof sym.name === "object" && sym.name?.name) {
                                nameStr = sym.name.name;
                            }
                        }
                

                        return {
                            name: nameStr,
                            intensity: sym.intensity !== undefined ? Number(sym.intensity) : undefined,
                        };
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
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#f06292" />
            </View>
        );
    }

    

    return (
        <View style={{ flex: 1, paddingTop: 50, backgroundColor: "#fafafa" }}>
            <Text style={styles.title}>Your Insights</Text>
            <FlatList
                data={insights}
                keyExtractor={(item, index) => item.cardType + item.type + index}
                contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
                renderItem={({ item, index }) => {
                    const animation = animations.get(index) || new Animated.Value(0);
                    if (!animations.has(index)) animations.set(index, animation);
                    const isExpanded = expandedIndex === index;
                    const config = CARD_CONFIG[item.cardType];
 
                    // ── Summary card ─────────────────────────────────────────
                    if (item.cardType === "summary") {
                        const symptoms: { name: string; hasShoppingList: boolean }[] = item.details?.symptoms ?? [];
                        const preview = symptoms.slice(0, 4).map(s => s.name).join("  ·  ");
                        const hasMore = symptoms.length > 4;
 
                        return (
                            <TouchableOpacity onPress={() => toggleCard(index)} activeOpacity={0.85}>
                                <View style={[styles.card, { backgroundColor: config.bg, borderColor: config.border }]}>
                                    {/* Coloured left bar */}
                                    <View style={[styles.leftBar, { backgroundColor: config.accent }]} />
 
                                    <View style={styles.cardInner}>
                                        {/* Header row */}
                                        <View style={styles.cardHeader}>
                                            <View style={styles.cardHeaderLeft}>
                                                <Text style={styles.cardEmoji}>{config.emoji}</Text>
                                                <View>
                                                    <Text style={[styles.cardLabel, { color: config.accent }]}>TODAY'S LOG</Text>
                                                    <Text style={styles.cardTitle}>{item.message}</Text>
                                                </View>
                                            </View>
                                            <Text style={[styles.chevron, { color: config.accent }]}>
                                                {isExpanded ? "▲" : "▼"}
                                            </Text>
                                        </View>
 
                                        {/* Preview row when collapsed */}
                                        {!isExpanded && (
                                            <Text style={styles.previewText} numberOfLines={1}>
                                                {preview}{hasMore ? `  +${symptoms.length - 4} more` : ""}
                                            </Text>
                                        )}
 
                                        {/* Expanded symptom chips */}
                                        <Animated.View style={{
                                            maxHeight: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 500] }),
                                            overflow: "hidden",
                                            opacity: animation,
                                        }}>
                                            <View style={styles.chipsRow}>
                                                {symptoms.map((sym, i) => (
                                                    <View
                                                        key={i}
                                                        style={[
                                                            styles.chip,
                                                            sym.hasShoppingList
                                                                ? styles.chipHighlight
                                                                : styles.chipPlain,
                                                        ]}
                                                    >
                                                        <Text style={[
                                                            styles.chipText,
                                                            { fontWeight: sym.hasShoppingList ? "700" : "400",
                                                              color: sym.hasShoppingList ? "#c2185b" : "#666" }
                                                        ]}>
                                                            {sym.name}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                            <Text style={styles.chipHint}>
                                                ✦ Bold symptoms have recommendations below
                                            </Text>
                                        </Animated.View>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }
 
                    // ── Symptom / Intensity / Prediction cards ───────────────
                    return (
                        <TouchableOpacity onPress={() => toggleCard(index)} activeOpacity={0.85}>
                            <Animated.View style={[
                                styles.card,
                                { backgroundColor: config.bg, borderColor: config.border },
                                { transform: [{ scale: animation.interpolate({ inputRange: [0, 1], outputRange: [1, 1.015] }) }] }
                            ]}>
                                {/* Coloured left bar */}
                                <View style={[styles.leftBar, { backgroundColor: config.accent }]} />
 
                                <View style={styles.cardInner}>
                                    {/* Header row */}
                                    <View style={styles.cardHeader}>
                                        <View style={styles.cardHeaderLeft}>
                                            <Text style={styles.cardEmoji}>{config.emoji}</Text>
                                            <View style={{ flex: 1, paddingRight: 24 }}>
                                                <Text style={[styles.cardLabel, { color: config.accent }]}>
                                                    {config.label.toUpperCase()}
                                                    {item.cardType === "intensity" && item.details?.trend
                                                        ? `  ${item.details.trend === "worsening" ? "↑" : "↓"}`
                                                        : ""}
                                                </Text>
                                                <Text style={styles.cardTitle}>{item.type}</Text>
                                                <Text style={styles.cardMessage}>{item.message}</Text>
                                            </View>
                                        </View>
                                        <Text style={[styles.chevron, { color: config.accent }]}>
                                            {isExpanded ? "▲" : "▼"}
                                        </Text>
                                    </View>
 
                                    {/* Expanded content */}
                                    <Animated.View style={{
                                        maxHeight: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 350] }),
                                        overflow: "hidden",
                                        opacity: animation,
                                    }}>
                                        <View style={[styles.divider, { backgroundColor: config.border }]} />
 
                                        {item.details?.description && (
                                            <Text style={styles.expandDescription}>
                                                {item.details.description}
                                            </Text>
                                        )}
 
                                        {item.details?.phase && item.details.phase !== "Any" && (
                                            <View style={styles.phaseRow}>
                                                <Text style={[styles.phaseTag, { backgroundColor: config.border, color: config.accent }]}>
                                                    {item.details.phase}
                                                </Text>
                                            </View>
                                        )}
 
                                        {(item.details?.tips ?? []).length > 0 && (
                                            <View style={styles.tipsBlock}>
                                                <Text style={[styles.sectionLabel, { color: config.accent }]}>Tips</Text>
                                                {(item.details.tips as string[]).slice(0, 2).map((tip, idx) => (
                                                    <Text key={idx} style={styles.tipText}>• {tip}</Text>
                                                ))}
                                            </View>
                                        )}
 
                                        {(item.details?.shoppingList ?? []).length > 0 && (
                                            <View style={styles.shoppingBlock}>
                                                <Text style={[styles.sectionLabel, { color: config.accent }]}>
                                                    Recommended Products
                                                </Text>
                                                {(item.details.shoppingList as string[]).map((product, idx) => (
                                                    <View key={idx} style={styles.productRow}>
                                                        <Text style={[styles.productDot, { color: config.accent }]}>●</Text>
                                                        <Text style={styles.productText}>{product}</Text>
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
                    <Text style={{ textAlign: "center", color: "#aaa", marginTop: 40 }}>
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
        justifyContent: "center",
        alignItems: "center",
    },

    title: {
        fontSize: 26,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 16,
        color: "#222",
        letterSpacing: -0.5,
    },

    card: {
        flexDirection: "row",
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2},
        shadowOpacity: 0.07,
        shadowRadius: 6,
        elevation: 2,
    },

    leftBar: {
        width: 4,
        borderRadius: 0,
    },

    cardInner: {
        flex: 1,
        padding: 14,
    },

    cardHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
    },

    cardHeaderLeft: {
        flexDirection: "row",
        alignItems: "flex-start",
        flex: 1,
        gap: 10,
    },

    cardEmoji: {
        fontSize: 22,
        marginTop: 1,
    },

    cardLabel: {
        fontSize: 10,
        fontWeight: "700",
        letterSpacing: 1,
        marginBottom: 2,
    },

    cardTitle: {
        fontSize: 15,
        fontWeight: "700",
        color: "#1a1a1a",
    },

    cardMessage: {
        fontSize: 12,
        color: "#666",
        marginTop: 2,
        lineHeight: 17,
    },

    chevron: {
        fontSize: 13,
        fontWeight: "600",
        marginTop: 2,
    },

    previewText: {
        fontSize: 12,
        color: "#888",
        marginTop: 6,
        fontStyle: "italic",
    },

    chipsRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        marginTop: 10,
    },

    chip: {
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 20,
    },

    chipPlain: {
        backgroundColor: "#f5f5f5",
    },

    chipHighlight: {
        backgroundColor: "#fce4ec",
        borderWidth: 1,
        borderColor: "#f48fb1",
    },

    chipText: {
        fontSize: 11,
    },

    chipHint: {
        fontSize: 10,
        color: "#bbb",
        marginTop: 8,
        fontStyle: "italic",
    },

    divider: {
        height: 1,
        marginVertical: 10,
        opacity: 0.5,
    },

    expandDescription: {
        fontSize: 13,
        color: "#444",
        lineHeight: 19,
    },

    phaseRow: {
        marginTop: 8,
    },

    phaseTag: {
        alignSelf: "flex-start",
        fontSize: 11,
        fontWeight: "600",
        paddingVertical: 3,
        paddingHorizontal: 10,
        borderRadius: 20,
        overflow: "hidden",
    },
    
    tipsBlock: {
        marginTop: 10,
    },

    sectionLabel: {
        fontSize: 11,
        fontWeight: "700",
        marginBottom: 4,
        letterSpacing: 0.8,
        textTransform: "uppercase",
    },

    tipText: {
        fontSize: 13,
        color: "#555",
        lineHeight: 19,
        fontStyle: "italic",
    },

    shoppingBlock: {
        marginTop: 10,
    },

    productRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 6,
        marginBottom: 3,
    },

    productDot: {
        fontSize: 8,
        marginTop: 5,
    },

    productText: {
        fontSize: 13,
        color: "#444",
        flex: 1,
        lineHeight: 19,
    },


});
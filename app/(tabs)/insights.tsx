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
        <View style={{ flex: 1, paddingTop: 50, backgroundColor: "#fff" }}>
            <Text style={styles.title}>Your Insights</Text>
            <FlatList
                data={insights}
                keyExtractor={(item, index) => item.type +index}
                contentContainerStyle={{ padding: 20 }}
renderItem={({ item, index }) => {
    const animation = animations.get(index) || new Animated.Value(0);
    if (!animations.has(index)) animations.set(index, animation);
    const isExpanded = expandedIndex === index;

    if (item.cardType === "summary") {
        const symptoms: { name: string; hasShoppingList: boolean }[] = item.details?.symptoms ?? [];
        const preview = symptoms.slice(0, 4).map(s => s.name).join(", ");
        const hasMore = symptoms.length > 4;

        return (
            <TouchableOpacity onPress={() => toggleCard(index)}>
                <View style={[styles.insightCard, styles.summaryCard]}>
                    <Text style={{ position: "absolute", top: 10, right: 10, fontSize: 18 }}>
                        {isExpanded ? "▲" : "▼"}
                    </Text>
                    <Text style={styles.insightType}>📋 Today's Log</Text>
                    <Text style={styles.insightMessage}>
                        {isExpanded
                            ? "All symptoms tracked today:"
                            : `${preview}${hasMore ? ` +${symptoms.length - 4} more` : ""}`
                        }
                    </Text>

                    <Animated.View
                        style={{
                            maxHeight: animation.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 400],
                            }),
                            overflow: "hidden",
                            opacity: animation,
                            marginTop: 8,
                        }}
                    >
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                            {symptoms.map((sym, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.symptomChip,
                                        sym.hasShoppingList && styles.symptomChipHighlight,
                                    ]}
                                >
                                    <Text style={{
                                        fontSize: 12,
                                        fontWeight: sym.hasShoppingList ? "bold" : "normal",
                                        color: sym.hasShoppingList ? "#c2185b" : "#555",
                                    }}>
                                        {sym.name}
                                    </Text>
                                </View>
                            ))}
                        </View>
                        <Text style={{ fontSize: 11, color: "#999", marginTop: 8 }}>
                            Bold symptoms have tips &amp; product recommendations below
                        </Text>
                    </Animated.View>
                </View>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity onPress={() => toggleCard(index)}>
            <Animated.View
                style={[
                    styles.insightCard,
                    item.cardType === "intensity" && styles.intensityCard,
                    item.cardType === "prediction" && styles.predictionCard,
                    {
                        transform: [
                            {
                                scale: animation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [1, 1.02],
                                }),
                            },
                        ]
                    }
                ]}>
                <Text style={{ position: "absolute", top: 10, right: 10, fontSize: 18 }}>
                    {isExpanded ? "▲" : "▼"}
                </Text>
                <Text style={styles.insightType}>{item.type}</Text>
                <Text style={styles.insightMessage}>{item.message}</Text>

                <Animated.View
                    style={{
                        maxHeight: animation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 300],
                        }),
                        overflow: "hidden",
                        opacity: animation,
                        marginTop: 10,
                    }}
                >
                    {item.details?.description && (
                        <Text style={{ marginTop: 5 }}>
                            {item.details.description}
                        </Text>
                    )}

                    {item.details?.phase && item.details.phase !== "Any" && (
                        <Text style={{ marginTop: 5, fontStyle: "italic" }}>
                            Phase: {item.details.phase}
                        </Text>
                    )}

                    {(item.details?.tips ?? []).length > 0 && (
                        <View style={{ marginTop: 5 }}>
                            {(item.details?.tips ?? []).slice(0, 2).map((tip: string, idx: number) => (
                                <Text key={idx} style={{ fontStyle: "italic" }}>
                                    • {tip}
                                </Text>
                            ))}
                        </View>
                    )}

                    {(item.details?.shoppingList ?? []).length > 0 && (
                        <View style={{ marginTop: 5 }}>
                            <Text style={{ fontWeight: "bold" }}>Recommended Products:</Text>
                            {(item.details?.shoppingList ?? []).map((product: string, idx: number) => (
                                <Text key={idx} style={{ fontStyle: "italic" }}>
                                    • {product}
                                </Text>
                            ))}
                        </View>
                    )}
                </Animated.View>
            </Animated.View>
        </TouchableOpacity>
    );
}}
                ListEmptyComponent={<Text style={{ textAlign: "center" }}>No Insights</Text>}
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
        fontSize: 24,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 20,
    },  

    insightCard: {
        backgroundColor: "#fbe4ec",
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
    },

    summaryCard: {
        backgroundColor: "#fce4ec",
        borderWidth: 1,
        borderColor: "#f06292",
    },

    intensityCard: {
        backgroundColor: "#fff3e0"
    },

    predictionCard: {
        backgroundColor: "#e8eaf6"
    },

    insightType: {
        fontSize: 14,
        fontWeight: "bold",
    },

    insightMessage: {
        fontSize: 12,
        marginTop: 3,
    },

    symptomChip: {
        backgroundColor: "#ede7f6",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },

    symptomChipHighlight: {
        backgroundColor: "#fce4ec",
        borderWidth: 1,
        borderColor: "#f48fb1",
    },
});


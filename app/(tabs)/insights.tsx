import { auth, db } from '@/firebase/config';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { collection, getDocs } from 'firebase/firestore';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { symptomInfo } from '../data/symptomInfo';
import { getCycleInfo } from '../utils/cyclePrediction';



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

        const { cycleDay, currentPhase } = getCycleInfo(convertToCycleLogs(logs));

        if (!cycleDay || !currentPhase) return;

        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const todayLog = logs.find(l => format(new Date(l.date || ""), 'yyyy-MM-dd') === todayStr);
        if (!todayLog) return;

        // console log to show todays data
        console.log("Today's Log:", todayLog);

        const newInsights: Insight[] = [];

        // Symptoms today
        todayLog.symptoms.forEach(sym => {
            const info = symptomInfo[sym.name] ?? {};
            const intensity = Number(sym.intensity) || 0;

            newInsights.push({
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

        const symptomPhaseCount: Record<string, Record<string, number>> = {};
        const symptomDayCount: Record<string, Record<number, number>> = {};

        // Frequency maps
        logs.forEach(log => {
            if (!log.date) return;

            const logDate = new Date(log.date);
            const today = new Date();

            const daysAgo = Math.floor(
                (today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (!logs.length) return;

            const firstLogDate = logs[0].date;
            const cycleStartDate = firstLogDate ? new Date(firstLogDate) : new Date();

            const logCycleDay = Math.floor((new Date(log.date).getTime() - cycleStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            if (logCycleDay <= 0) return;
        
            log.symptoms.forEach(sym => {
                console.log(`Symptom: ${sym.name}, log date: ${log.date}, calculated cycle day: ${logCycleDay}`)
                const name = sym.name;

                // Phase tracking
                const { currentPhase: logPhase } = getCycleInfo(convertToCycleLogs([log]));

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

            const mostCommonDay = Object.keys(dayCounts).reduce((a, b) =>
                dayCounts[Number(a)] > dayCounts[Number(b)] ? a : b
            );

            const day = Number(mostCommonDay);

            if (Math.abs(day - cycleDay) <= 2) {
                const info = symptomInfo[symName] || {};

                newInsights.push({
                    type: `Prediction: ${symName}`,
                    message: `You often experience ${symName} around day ${day} of your cycle (${currentPhase} phase) - consider buying:`,
                    details: {
                        shoppingList: Array.isArray(info.shoppingList) ? info.shoppingList : []
                    }
                });
            }

        });
  
       

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
                            intensity: Number(sym.intensity) || 0,
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
                    return (
                        <TouchableOpacity onPress={() => toggleCard(index)}>
                            <Animated.View 
                                style={[
                                    styles.insightCard,
                                    {
                                        transform: [
                                            {scale: animation.interpolate({
                                                inputRange: [0, 1],
                                                outputRange: [1, 1.02],
                                            }) ?? 1},
                                        ]
                                    }
                                ]}>
                                <Text style = {{ position: "absolute", top: 10, right: 10, fontSize: 18 }}>
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
                                        <Text style={{ marginTop: 5}}>
                                            {item.details.description}
                                        </Text>
                                    )}

                                    {item.details?.phase && item.details.phase !== "Any" && (
                                        <Text style={{ marginTop: 5, fontStyle: "italic"}}>
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
                
                ListEmptyComponent={<Text style={{ textAlign: "center"}}>No Insights</Text>}
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

    insightType: {
        fontSize: 14,
        fontWeight: "bold",
    },

    insightMessage: {
        fontSize: 12,
    },
});


    
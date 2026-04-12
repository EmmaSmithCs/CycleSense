import { useTheme } from '@/context/ThemeContext';
import { auth, db } from '@/firebase/config';
import { useFocusEffect } from '@react-navigation/native';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { collection, deleteDoc, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveDailyLog } from '../../firebase/dailyLogs';

const intensitySymptoms = ["Cramps", "Headache", "Migraine", "Back pain", "Tender breasts", "Acne", "Nausea", "Joint pain", "Ovulation pain", "Insomnia", "Bloating", "Gas", "Diarrhoea", "Constipation"];

type SymptomEntry = {
  name: string;
  intensity?: number; 
}

const symptomCategories = [
  {
    key: "mood",
    title: "Feelings",
    options: ["Happy", "Calm", "Anxious", "Irritable", "Low mood", "Mood swings", "Emotional", "Energised", "Exhausted"],
  },
  {
    key: "physical",
    title: "Physical",
    options: ["Cramps", "Headache", "Migraine", "Back pain", "Tender breasts", "Acne", "Nausea", "Joint pain", "Ovulation pain", "Insomnia"],
  },
  {
    key: "gut",
    title: "Gut & Appetite",
    options: ["Bloating", "Gas", "Diarrhoea", "Constipation", "Low appetite", "Increased appetite", "Chocolate cravings", "Salty cravings"],
  },
  {
    key: "mucus",
    title: "Cervical mucus",
    options: ["None", "Watery", "Egg white", "Creamy", "Sticky", "Clumpy white", "Brown", "Pink"],
  },
  {
    key: "energy",
    title: "Energy level",
    options: ["High", "Medium", "Low"],
  },
  {
    key: "libido",
    title: "Libido",
    options: ["High Libido", "Low Libido", "Solo", "Protected", "Unprotected"],
  },
  {
    key: "activity",
    title: "Activities",
    options: ["Meditation", "Running", "Cardio", "Yoga", "Weights", "Dancing", "Relaxing", "Reading", "Napping", "Walking"],
  },
  {
    key: "disruption",
    title: "Cycle disruption",
    options: ["Travel", "Illness", "Stress", "Sleep disruption", "Medication change"],
  },
  {
    key: "birthControl",
    title: "Birth control",
    options: ["None", "Pill", "Missed Pill", "IUD", "Implant", "Injection", "Patch", "Ring", "Condoms", "Other"],
  },
  {
    key: "medication",
    title: "Medication",
    options: ["Painkillers", "Hormonal medication", "Antibiotics", "Antidepressants", "Anti-Anxiety", "Antipsychotics", "Antihistamines", "HRT", "Benzos", "Mood Stabilizers"],
  },
  {
    key: "supplements",
    title: "Supplements",
    options: ["Vitamins", "Magnesium", "Zinc", "Iron", "Omega 3", "Probiotics", "Adaptogens", "Protein powder", "Fiber supplements"],
  }
];

// Type for daily log
type DailyLog = {
  id: string;
  bleeding: string;
  symptoms: string[] | SymptomEntry[];
  date?: string;
  notes?: string;
};

const BLEEDING_COLORS: Record<string, string> = {
    Heavy: "#c2185b",
    Medium: "#e361a8",
    Light: "#f5a9cb",
    None: "#64b5fb",
};

const BLEEDING_LABELS: Record<string, string> = {
    Heavy: "🩸🩸🩸",
    Medium: "🩸🩸",
    Light: "🩸",
    None: "o",
};

export default function HistoryScreen() {
    const { theme } = useTheme();
    const c = theme.colors;

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
    
    const [bleeding, setBleeding] = useState<"None" | "Light" | "Medium" | "Heavy">("None");
    const [symptoms, setSymptoms] = useState<string[]>([]);

    const getStats = () => {
        const sorted = [...allLogs]
            .filter(l => l.bleeding !== "None")
            .sort((a, b) => a.id.localeCompare(b.id));

        // Group consecutive bleeding days into periods
        const periodStarts: string[] = [];
        sorted.forEach((log, i) => {
            const prev = sorted[i - 1];
            const daysSincePrev = prev
                ? differenceInCalendarDays(parseISO(log.id), parseISO(prev.id))
                : 999;
            if (daysSincePrev > 2) {
                periodStarts.push(log.id);
            }
        });

        const lastPeriodStart = periodStarts[periodStarts.length - 1];
        const cycleDay = lastPeriodStart
            ? differenceInCalendarDays(new Date(), parseISO(lastPeriodStart)) + 1
            : null;

        let avgLength: number | null = null;
        if (periodStarts.length >= 2) {
            const gaps = [];
            for (let i = 1; i < periodStarts.length; i++) {
                gaps.push(differenceInCalendarDays(parseISO(periodStarts[i]), parseISO(periodStarts[i - 1])));
            }
            avgLength = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
        }

        const nextPeriod = lastPeriodStart && avgLength
            ? differenceInCalendarDays(
                new Date(parseISO(lastPeriodStart).getTime() + avgLength * 86400000),
                new Date()
            )
            : null;

        return { cycleDay, avgLength, nextPeriod, totalLogs: allLogs.length };
    };

    const getDotColor = (bleeding: string) => {
      return BLEEDING_COLORS[bleeding] || BLEEDING_COLORS["None"];
    };

    const loadMarkedDates = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const logsRef = collection(db, 'users', user.uid, 'dailyLogs');
      const snapshot = await getDocs(logsRef);

      const marked: any = {};
      const logs: { id: string; bleeding: string; symptomCount: number }[] = [];

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

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      marked[todayStr] = {
        ...(marked[todayStr] || {}),
        selected: true,
        selectedColor: c.primary,
        marked: !!(marked[todayStr]?.marked),
        dotColor: marked[todayStr]?.dotColor,
      };

      setMarkedDates(marked);
      setAllLogs(logs);
      setLoading(false);
    };

    useFocusEffect(
      useCallback(() => {
        loadMarkedDates();
        setCalendarKey((prev) => prev + 1);
      }, [])
    );

    const openIntensityModal = (symptom: string) => {
      const entry = symptomsWithIntensity.find(s => s.name === symptom);
      setSelectedSymptom(symptom);
      setSelectedIntensity(entry?.intensity || 3);
    };

    const handleLog = async () => {
      if (!auth.currentUser || !selectedDate) return;
    
      const intentsityNames = new Set(symptomsWithIntensity.map(s => s.name));

      const finalSymptoms: SymptomEntry[] = [
        ...symptomsWithIntensity,
        ...symptoms
          .filter(name => !intentsityNames.has(name))
          .map(name => ({ name })),
      ];

      const logData: any = {
        bleeding,
        symptoms: finalSymptoms,
      };

      if (notes.trim()) {
        logData.notes = notes.trim();
      }

      await saveDailyLog(auth.currentUser.uid, new Date(selectedDate), logData);

      setModalVisible(false);
      await loadMarkedDates();
      setCalendarKey((prev) => prev + 1);
      Alert.alert('Saved!', 'Your daily log has been saved successfully.');
      setSelectedSymptom(null);
    };  

    const onDayPress = async (day: any) => {
      const date = day.dateString;
      setSelectedDate(date);
      await loadLogForDate(new Date(date));
      
      setModalVisible(true);
    };

    const toggleSymptom = (symptom: string) => {
      setSymptoms((prev) =>
        prev.includes(symptom)
          ? prev.filter((s) => s !== symptom)
          : [...prev, symptom]
      );
    };
            

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

    const loadLogForDate = async (date: Date) => {
      if (!auth.currentUser) return;

      setBleeding("None");
      setSymptoms([]);
      setSymptomsWithIntensity([]);
      setNotes("");
      
      const dateStr = format(date, 'yyyy-MM-dd');
      const logRef = doc(db, 'users', auth.currentUser.uid, 'dailyLogs', dateStr);
      const snap = await getDoc(logRef);

      if (snap.exists()) {
        const data = snap.data();
        setBleeding(data.bleeding || "None");
        setNotes(data.notes || "");

        const withIntensity: SymptomEntry[] = [];
        const normalSymptoms: string[] = [];

        (data.symptoms || []).forEach((s: any) => {
          if (s?.intensity !== undefined) {
            withIntensity.push({ name: s.name, intensity: s.intensity });
          } 
        });

        const intensityNames = new Set(withIntensity.map(s => s.name));

        (data.symptoms || []).forEach((s: any) => {
          if (s?.intensity === undefined) {
            const name = s.name || s;
            if (!intensityNames.has(name)) {
              normalSymptoms.push(name);
            }
          }
        });

        setSymptomsWithIntensity(withIntensity);
        setSymptoms(normalSymptoms);
      } else {
        setBleeding("None");
        setNotes("");
        setSymptoms([]);
        setSymptomsWithIntensity([]);
      }
      
    };

   
    const closeModal = () => {
      setModalVisible(false);
      setSelectedDate(null);
    };

    const stats = getStats();
    const recentLogs = [...allLogs].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 6);

    if (loading) {
        return (
            <View style={[styles.centered, { backgroundColor: c.background }]}>
                <ActivityIndicator size="large" color={c.primary} />
            </View>
        );
    }

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <ScrollView showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={[styles.title, { color: c.text }]}>History</Text>

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
                                <View style={[styles.recentLeft, { backgroundColor: BLEEDING_COLORS[log.bleeding] + '33' }]}>
                                    <Text style={[styles.recentBleedingIcon, { color: c.primary}]}>
                                        {BLEEDING_LABELS[log.bleeding]}
                                    </Text>
                                </View> 
                                <View style={styles.recentMid}>
                                    <Text style={[styles.recentDate, { color: c.text }]}>
                                        {format(parseISO(log.id), 'EEE d MMM')}
                                    </Text>
                                    <Text style={[styles.recentSub, { color: c.textMuted}]}>
                                        {log.symptomCount > 0 ? `${log.symptomCount} symptom${log.symptomCount > 1 ? 's' : ''}` : 'No symptoms logged'}
                                    </Text>
                                </View>
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
        

        <Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent onRequestClose={closeModal}>
          <SafeAreaView style={styles.modalBackground}>
             <View style={[styles.modalCard, { backgroundColor: c.card }]}>
                <ScrollView 
                  contentContainerStyle={styles.modalScrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}>
                  <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10, color: c.text }}>
                    Log for {selectedDate || format(new Date(), "yyyy-MM-dd")}
                  </Text>

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

                  {symptomCategories.map((category) => (
                    <View key={category.key} style={{ marginTop: 15 }}>
                      <Text style={{ fontWeight: "bold", marginBottom: 5, color: c.text }}>{category.title}</Text>

                      <FlatList
                        horizontal
                        data={category.options}
                        keyExtractor={(item) => item}
                        showsHorizontalScrollIndicator={false}
                        nestedScrollEnabled
                        renderItem={({ item }) => {
                          const hasIntensity = intensitySymptoms.includes(item);
                          const isSelected = hasIntensity
                            ? !!symptomsWithIntensity.find(s => s.name === item)
                            : symptoms.includes(item);
                          return (
                            <TouchableOpacity
                              onPress={() => {
                                if (intensitySymptoms.includes(item)) {
                                  setTimeout(() => openIntensityModal(item), 0);
                                } else {
                                  toggleSymptom(item);
                                }
}}
                              style={[
                                styles.optionButton,
                                { backgroundColor: isSelected ? c.primary : c.surface, marginRight: 8 },
                              ]}
                            >
                              <Text
                                style={{ color: isSelected ? "#fff" : c.text, fontSize: 12 }}
                              >
                                {item}
                              </Text>
                            </TouchableOpacity>
                          );
                        }}
                      />
                    </View>
                  ))}

                  <Text style={{ marginTop: 10, marginBottom: 5, color: c.textSecondary }}>Notes:</Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
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
                    
                  <Button title="Save Log" onPress={handleLog} color={c.primary}/>
                  <Button title="Delete Log" onPress={handleDeleteLog} color={c.error} />
                  <Button title="Cancel" onPress={closeModal} color={c.textMuted} />

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
                            {[1, 2, 3, 4, 5].map((level) => (
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
        </Modal>


      </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },

    title: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 10,
    },

    modalBackground: {
        flex: 1,
        backgroundColor: "#000000aa",
        justifyContent: "center",
    },

    modalContainer: {
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 10,
    },

    modalTitle: {
        fontWeight: "bold",
        fontSize: 18,
        marginBottom: 10,
    },

    centered: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    optionButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 5,
    },

    categoryCard: {
        width: 180,
        padding: 10,
        borderRadius: 12,
        marginRight: 12,
    },

    categoryTitle: {
        fontWeight: "bold",
        marginBottom: 6,
        fontSize: 14,
    },

    symptomChip: {
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 20,
        marginBottom: 6,
        alignSelf: "flex-start",
    },

    modalCard: {
        marginHorizontal: 20,
        borderRadius: 12,
        maxHeight: "90%",
    },

    lScrollContent: {
        padding: 20,
        paddingBottom: 40,
    },

    statsRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 14,
    },

    statCard: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 1,
        padding: 10,
        alignItems: "center",
        justifyContent: "center",
    },

    statValue: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 2,
        textAlign: "center",
    },

    statLabel: {
        fontSize: 10,
        fontWeight: "500",
        letterSpacing: 0.3,
        textAlign: "center",
    },

    calendarCard: {
        borderRadius: 16,
        borderWidth: 1,
        overflow: "hidden",
        paddingHorizontal: 4,
        paddingBottom: 8,
    },

    legendRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        borderRadius: 12,
        borderWidth: 1,
        paddingVertical: 10,
        marginTop: 10,
    },

    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },

    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },

    legendLabel: {
        fontSize: 11,
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 10,
    },

    recentCard: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
        overflow: "hidden",
    },

    recentLeft: {
        width: 48,
        height: 48,
        justifyContent: "center",
        alignItems: "center",
    },

    recentBleedingIcon: {
        fontSize: 14,
    },

    recentMid: {
        flex: 1,
        paddingHorizontal: 12,
    },

    recentDate: {
        fontSize: 14,
        fontWeight: "600",
    },

    recentSub: {
        fontSize: 12,
        marginTop: 2,
    },

    bleedingBadge: {
        marginRight: 12,
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 20,
        borderWidth: 1,
    },

    bleedingBadgeText: {
        fontSize: 11,
        fontWeight: "600",
    },

    modalScrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    

});



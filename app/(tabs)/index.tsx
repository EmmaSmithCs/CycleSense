import { useTheme } from '@/context/ThemeContext';
import { auth } from '@/firebase/config';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { useFocusEffect, useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CycleProgressRing from '../../components/CycleProgressRing';
import { db } from '../../firebase/config';
import { saveDailyLog } from '../../firebase/dailyLogs';
import { buildCycles, DailyLog, getCycleProgress, predictNextPeriod } from '../utils/cyclePrediction';

const router = useRouter();

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
    key: "distuption",
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


export default function DailyTrackingScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const getToday = new Date();

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    const fetchUserName = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userDocRef = doc(db, 'users', currentUser.uid);
      const userSnapshot = await getDoc(userDocRef);

      if (userSnapshot.exists()) {
        const data = userSnapshot.data();
        setUserName(data.name || "User");
      }
      setLoading(false);
    };

    fetchUserName();
  }, []);

  // 7 days for horisontal scroll
  const dateRange = Array.from({ length: 7 }, (_, i) => 
    addDays(getToday, i - 3)
  );

  const toggleSymptom = (symptom: string) => {
    if (symptoms.includes(symptom)) {
      setSymptoms(symptoms.filter(s => s !== symptom));
    } else {
      setSymptoms([...symptoms, symptom]);
    }
  };

  

  const fetchCycleData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const logsRef = collection(db, 'users', user.uid, 'dailyLogs');
    const snapshot = await getDocs(logsRef);

    const logs: DailyLog[] = snapshot.docs.map(doc => ({
      date: doc.id,
      bleeding: doc.data().bleeding || "None",
      symptoms: doc.data().symptoms || [],
      notes: doc.data().notes || "",
    }));

    const cycles = buildCycles(logs);
    const progress = getCycleProgress(cycles);
    const nextPeriod = predictNextPeriod(cycles);

    if (cycles.length === 0) {
      setCycleDay(null);
      setAvgCycleLength(null);
      setNextPeriodDate(null);
      setPeriodLength(null);
      setLoadingCycleData(false);
      return;
    }

    const today = new Date();
    const lastCycle = cycles[cycles.length - 1];
    const lastPeriodStart = new Date(lastCycle.startDate);
    const dayOfCycle = differenceInCalendarDays(today, lastPeriodStart) + 1;

    const periodLogs = logs
      .filter(log => new Date(log.date) >= lastPeriodStart)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let actualPeriodLength = 0;
    for (const log of periodLogs) {
      if (log.bleeding !== "None") {
        actualPeriodLength++;
      } else {
        break; // stop when bleeding ends
      }
    }

    setPeriodLength(actualPeriodLength);

    const todayStr = format(new Date(), "yyyy-MM-dd");
    const todayLog = logs.find(l => l.date === todayStr);

    setIsBleedingToday(!!todayLog && todayLog.bleeding !== "None");


    setCycleDay(dayOfCycle);
    setAvgCycleLength(progress?.avgLength ?? null);
    setNextPeriodDate(nextPeriod ?? null);
    setLoadingCycleData(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchCycleData();
    }, [])
  );
  


  const handleLog = async () => {
    if (!auth.currentUser) return;

    const intensityNames = new Set(symptomsWithIntensity.map(s => s.name));

    const finalSymptoms: SymptomEntry[] = [
      ...symptomsWithIntensity,
      ...symptoms
        .filter(name => !intensityNames.has(name))
        .map(name => ({ name })),
    ];

    const logData: any = {
      bleeding,
      symptoms: finalSymptoms,
    };

    if (notes?.trim()) {
      logData.notes = notes.trim();
    }

    await saveDailyLog(auth.currentUser.uid, selectedDate, logData);
    setModalVisible(false);
    fetchCycleData();
  };

  const loadLogForDate = async (date: Date) => {
    if (!auth.currentUser) return;

    setBleeding("None");
    setSymptoms([]);
    setSymptomsWithIntensity([]);
    setNotes("");

    const dateStr = format(date, "yyyy-MM-dd");
    const logRef = doc(db, "users", auth.currentUser.uid, "dailyLogs", dateStr);
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
      setSymptoms([]);
      setSymptomsWithIntensity([]);
      setNotes("");
    }
    
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  if (loading || loadingCycleData) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: c.background }}>
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: 50, backgroundColor: c.background }}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={[styles.helloText, { color: c.text }]}>
          {getGreeting()}, {userName}!
        </Text>
        <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal Date Selector */}
      <FlatList
        horizontal
        data={dateRange}
        keyExtractor={(item) => item.toISOString()}
        contentContainerStyle={{ paddingHorizontal: 10, marginVertical: 20 }}
        renderItem={({ item }) => {
          const isSelected =
            format(item, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
          return (
            <TouchableOpacity
              onPress={async () => {
                setSelectedDate(item);
                await loadLogForDate(item);
                setModalVisible(true);
              }}
              style={[
                styles.dateButton,
                { backgroundColor: isSelected ? c.primary : c.surface, height: 70, justifyContent: "center", alignItems: "center" },
              ]}
            >
              <Text style={{ color: isSelected ? "#fff" : c.text }}>
                {format(item, "dd MMM")}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Cycle Progress Ring */}
      <View style={styles.cycleCircle}>
        {cycleDay !== null && avgCycleLength !== null ? (
          <CycleProgressRing
            cycleDay={cycleDay}
            avgLength={avgCycleLength}
            periodLength={periodLength ?? 0}
            isBleedingToday={isBleedingToday}
          />
        ) : (
          <Text style={{ textAlign: "center", color: c.textSecondary }}>Between cycles</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: c.primary }]}
        onPress={async () => {
          await loadLogForDate(selectedDate);
          setModalVisible(true);
        }}
      >
        <Text style={{ color: "#fff", fontSize: 28 }}>+</Text>
      </TouchableOpacity>

            

      {/* Log Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalBackground}>
          <View style={[styles.modalCard, { backgroundColor: c.card }]}>
            <ScrollView 
                style={styles.modalScrollContent}
                showsVerticalScrollIndicator={false}>
              <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10, color: c.text }}>
                Log for {format(selectedDate, "yyyy-MM-dd")}
              </Text>

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
                  <Text style={{ color: bleeding === level ? "#fff" : c.text }}>
                    {level}
                  </Text>
                </TouchableOpacity>
              ))}

              {symptomCategories.map((categoryData) => (
              <View key={categoryData.key} style={{ marginBottom: 15 }}>
                <Text style={{ fontWeight: "bold", marginBottom: 5, color: c.text }}>{categoryData.title}</Text>

                      <FlatList
                        horizontal
                        data={categoryData.options}
                        keyExtractor={(item) => item}
                        showsHorizontalScrollIndicator={false}
                        renderItem={({ item }) => {
                          const hasIntensity = intensitySymptoms.includes(item);
                          const isSelected = hasIntensity
                            ? !!symptomsWithIntensity.find(s => s.name === item)
                            : symptoms.includes(item);
                          
                          return (
                            <TouchableOpacity
                              onPress={() => {
                                if (hasIntensity) {
                                  setSelectedSymptom(item);
                                  const entry = symptomsWithIntensity.find(s => s.name === item);
                                  setSelectedIntensity(entry?.intensity || 3);
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
                                style={{
                                  color: isSelected ? "#fff" : c.text,
                                  fontSize: 12,
                                }}
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

              <Button title="Save Log" onPress={handleLog} color={c.primary} />
              <Button title="Cancel" onPress={closeModal} color={c.textMuted} />

              <Modal visible={!!selectedSymptom} animationType="fade" transparent>
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000000aa" }}>
                    <View style={{ backgroundColor: c.card, padding: 20, borderRadius: 12, width: 250 }}>
                      <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 10, color: c.text }}>{selectedSymptom} Intensity</Text>
                      <Text style={{ fontSize: 14, marginBottom: 10, color: c.textSecondary }}>Current Intensity: {selectedIntensity}</Text>

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
                            <Text style={{ color: selectedIntensity === level ? "#fff" : c.text }}>{level}</Text>
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

            </ScrollView>
          </View>
      </SafeAreaView>
    </Modal>
  </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    marginTop: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  helloText: { fontSize: 25, fontWeight: "bold" },
    profileIcon: { fontSize: 24 },
    dateButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },

  cycleCircle: {
    marginVertical: 20,
    alignSelf: "center",
    width: 220,
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 150,
  },

  cycleText: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginBottom: 5 
  },

  cycleDayText: { 
    fontSize: 16, 
    marginBottom: 10 
  },

  nextPeriodText: { 
    fontSize: 14, 
    color: "#666",
    marginBottom: 10,
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "#000000aa",
    justifyContent: "center",
  },

  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 5,
  },


  symptomChip: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 20,
    marginBottom: 6,
    alignSelf: "flex-start",
  },

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

  modalCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    maxHeight: "90%",
  },

  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  }
});




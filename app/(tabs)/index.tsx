import { auth } from '@/firebase/config';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { useFocusEffect } from 'expo-router';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CycleProgressRing from '../../components/CycleProgressRing';
import { db } from '../../firebase/config';
import { saveDailyLog } from '../../firebase/dailyLogs';
import { buildCycles, DailyLog, getCycleProgress, predictNextPeriod } from '../utils/cyclePrediction';

const today = new Date();


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
];


export default function DailyTrackingScreen() {
  const [selectedDate, setSelectedDate] = useState(today);
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
    addDays(today, i - 3)
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

    setIsBleedingToday(todayLog?.bleeding !== "None");


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

    await saveDailyLog(auth.currentUser.uid, selectedDate, {
      bleeding,
      symptoms,
    });
    setModalVisible(false);
    fetchCycleData();
  };

  const loadLogForDate = async (date: Date) => {
    if (!auth.currentUser) return;

    const dateStr = format(date, "yyyy-MM-dd");
    const logRef = doc(db, "users", auth.currentUser.uid, "dailyLogs", dateStr);
    const snap = await getDoc(logRef);

    if (snap.exists()) {
      const data = snap.data();
      setBleeding(data.bleeding || "None");
      setSymptoms(data.symptoms || []);
    } else {
      // Reset if no log exists for that day
      setBleeding("None");
      setSymptoms([]);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  if (loading || loadingCycleData) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#f06292" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, paddingTop: 50, backgroundColor: "#fff" }}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.helloText}>
          {getGreeting()}, {userName}!
        </Text>
        <TouchableOpacity>
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
                { backgroundColor: isSelected ? "#f06292" : "#eee", height: 70, justifyContent: "center", alignItems: "center" },
              ]}
            >
              <Text style={{ color: isSelected ? "#fff" : "#000" }}>
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
          <Text style={{ textAlign: "center" }}>Between cycles</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={async () => {
          await loadLogForDate(selectedDate);
          setModalVisible(true);
        }}
      >
        <Text style={{ color: "#fff", fontSize: 28 }}>＋</Text>
      </TouchableOpacity>

            

      {/* Log Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>
              Log for {format(selectedDate, "yyyy-MM-dd")}
            </Text>

            <Text style={{ marginBottom: 5 }}>Bleeding:</Text>
            {["None", "Light", "Medium", "Heavy"].map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => setBleeding(level as any)}
                style={[
                  styles.optionButton,
                  { backgroundColor: bleeding === level ? "#f06292" : "#eee" },
                ]}
              >
                <Text style={{ color: bleeding === level ? "#fff" : "#000" }}>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}

            <Text style={{ marginTop: 10, marginBottom: 5, fontWeight: "bold" }}>
              Symptoms
            </Text>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={symptomCategories}
              keyExtractor={(item) => item.key}
              contentContainerStyle={{ paddingVertical: 10 }}
              renderItem={({ item }) => (
                <View style={styles.categoryCard}>
                  <Text style={styles.categoryTitle}>{item.title}</Text>

                  {item.options.map((symptom) => {
                    const selected = symptoms.includes(symptom);

                    return (
                      <TouchableOpacity
                        key={symptom}
                        onPress={() => toggleSymptom(symptom)}
                        style={[
                          styles.symptomChip,
                          { backgroundColor: selected ? "#f06292" : "#eee" },
                        ]}
                      >
                        <Text style={{ color: selected ? "#fff" : "#000", fontSize: 12 }}>
                          {symptom}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />

            <Button title="Save Log" onPress={handleLog} />
            <Button title="Cancel" onPress={closeModal} />
          </View>
      </View>
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
    marginTop: 50,
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

  modalContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 10,
  },

  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 5,
  },

  categoryCard: {
    width: 180,
    backgroundColor: "#fafafa",
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

  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f06292",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  
});




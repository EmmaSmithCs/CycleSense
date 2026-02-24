import { auth } from '@/firebase/config';
import { addDays, format } from 'date-fns';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../firebase/config';
import { saveDailyLog } from '../../firebase/dailyLogs';

const today = new Date();


const symptomOptions = ["Cramps", "Fatigue", "Mood", "Headache", "Bloating", "Acne"];

export default function DailyTrackingScreen() {
  const [selectedDate, setSelectedDate] = useState(today);
  const [modalVisible, setModalVisible] = useState(false);
  const [bleeding, setBleeding] = useState<"None" | "Light" | "Medium" | "Heavy">("None");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  const handleLog = async () => {
    if (!auth.currentUser) return;

    await saveDailyLog(auth.currentUser.uid, selectedDate, {
      bleeding,
      symptoms,
    });
    setModalVisible(false);
  };

  if (loading) {
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
              onPress={() => setSelectedDate(item)}
              style={[
                styles.dateButton,
                { backgroundColor: isSelected ? "#f06292" : "#eee" },
              ]}
            >
              <Text style={{ color: isSelected ? "#fff" : "#000" }}>
                {format(item, "dd MMM")}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* Cycle Circle */}
      <View style={styles.cycleCircle}>
        <Text style={styles.cycleText}>Period</Text>
        <Text style={styles.cycleDayText}>Day 2</Text>
        <Button title="+ Log" onPress={() => setModalVisible(true)} />
      </View>

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

            <Text style={{ marginTop: 10, marginBottom: 5 }}>Symptoms:</Text>
            {symptomOptions.map((symptom) => (
              <TouchableOpacity
                key={symptom}
                onPress={() => toggleSymptom(symptom)}
                style={[
                  styles.optionButton,
                  { backgroundColor: symptoms.includes(symptom) ? "#f06292" : "#eee" },
                ]}
              >
                <Text style={{ color: symptoms.includes(symptom) ? "#fff" : "#000" }}>
                  {symptom}
                </Text>
              </TouchableOpacity>
            ))}

            <Button title="Save Log" onPress={handleLog} />
            <Button title="Cancel" onPress={() => setModalVisible(false)} />
          </View>
      </View>
    </Modal>
  </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  helloText: { fontSize: 20, fontWeight: "bold" },
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
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#f06292",
    justifyContent: "center",
    alignItems: "center",
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
});




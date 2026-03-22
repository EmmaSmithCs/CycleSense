import { auth, db } from '@/firebase/config';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
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
}



export default function HistoryScreen() {
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


    const [bleeding, setBleeding] = useState<"None" | "Light" | "Medium" | "Heavy">("None");
    const [symptoms, setSymptoms] = useState<string[]>([]);

    const getDotColor = (bleeding: string) => {
      switch (bleeding) {
        case "Heavy":
          return "#ff1a75";
        case "Medium":
          return "#ff66b3";
        case "Light":
          return "#ff99cc";
        case "None":
          return "#66ccff";
        default:
          return "#f06292";
      }
    };

    const loadMarkedDates = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const logsRef = collection(db, 'users', user.uid, 'dailyLogs');
      const snapshot = await getDocs(logsRef);

      const marked: any = {};

      snapshot.docs.forEach((doc) => {
          marked[doc.id] = {
              marked: true,
              dotColor: getDotColor(doc.data().bleeding || "None"),
          };
      });

      const todayStr = format(new Date(), 'yyyy-MM-dd');
      marked[todayStr] = {
        ...(marked[todayStr] || {}),
        selected: true,
        selectedColor: "#ba68c8",
      };

      setMarkedDates(marked);
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


    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#f06292" />
            </View>
        );
    }

    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>History</Text>

        <Calendar
          key={calendarKey}
          current ={format(new Date(), 'yyyy-MM-dd')}
          markedDates={markedDates}
          onDayPress={onDayPress}
          theme={{
            todayTextColor: "#ba68c8",
            arrowColor: "#f06292",
            selectedDayBackgroundColor: "#f06292",
          }}
        />

        <Modal visible={modalVisible} animationType="slide" transparent statusBarTranslucent onRequestClose={closeModal}>
          <SafeAreaView style={styles.modalBackground}>
             <View style={styles.modalCard}>
                <ScrollView 
                  contentContainerStyle={styles.modalScrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}>
                  <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10 }}>
                    Log for {selectedDate || format(new Date(), "yyyy-MM-dd")}
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

                  {symptomCategories.map((category) => (
                    <View key={category.key} style={{ marginTop: 15 }}>
                      <Text style={{ fontWeight: "bold", marginBottom: 5 }}>{category.title}</Text>

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
                                {
                                  backgroundColor: isSelected ? "#f06292" : "#eee",
                                  marginRight: 8,
                                },
                              ]}
                            >
                              <Text
                                style={{
                                  color: isSelected ? "#fff" : "#000",
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

                  <Text style={{ marginTop: 10, marginBottom: 5 }}>Notes:</Text>
                  <TextInput
                    value={notes}
                    onChangeText={setNotes}
                    placeholder="Anything you noticed today?"
                    multiline
                    style={{
                      borderWidth: 1,
                      borderColor: "#ddd",
                      borderRadius: 8,
                      padding: 10,
                      minHeight: 80,
                      textAlignVertical: "top",
                    }}
                  />
                    
                  <Button title="Save Log" onPress={handleLog} />
                  <Button title="Delete Log" onPress={handleDeleteLog} color="#ff4d4d" />
                  <Button title="Cancel" onPress={closeModal} />

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
                        <View style={{ backgroundColor: "#fff", padding: 20, borderRadius: 12, width: 250 }}>
                          <Text style={{ fontWeight: "bold", fontSize: 16, marginBottom: 10 }}>{selectedSymptom} Intensity</Text>
                          <Text style={{ fontSize: 14, marginBottom: 10 }}>Current Intensity: {selectedIntensity}</Text>

                          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
                            {[1, 2, 3, 4, 5].map((level) => (
                              <TouchableOpacity
                                key={level}
                                onPress={() => setSelectedIntensity(level)}
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 20,
                                  backgroundColor: selectedIntensity === level ? "#f06292" : "#eee",
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              >
                                <Text style={{ color: selectedIntensity === level ? "#fff" : "#000" }}>{level}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>

                          <Button
                            title="Save"
                            onPress={() => {
                              setSymptomsWithIntensity(prev => {
                                const filtered = prev.filter(s => s.name !== selectedSymptom);
                                return [...filtered, { name: selectedSymptom!, intensity: selectedIntensity }];
                              });
                              setSelectedSymptom(null);
                            }}
                          />
                          <Button title="Cancel" onPress={() => setSelectedSymptom(null)} />

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
    backgroundColor: "#fff",
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
    backgroundColor: "#fff",
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

  modalCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 12,
    maxHeight: "90%",
  },

  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  }

    
});



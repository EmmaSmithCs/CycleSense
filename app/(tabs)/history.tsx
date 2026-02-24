import { auth, db } from '@/firebase/config';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';


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

// Type for daily log
type DailyLog = {
    id: string;
    bleeding: string;
    symptoms: string[];
    date?: string;
}

//
export default function HistoryScreen() {
    const [markedDates, setMarkedDates] = useState<any>({});
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [log, setLog] = useState<DailyLog | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [calendarKey, setCalendarKey] = useState(0);


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

        const today = format(new Date(), 'yyyy-MM-dd');
        marked[today] = {
            ...(marked[today] || {}),
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

    const onDayPress = async (day: any) => {
        const date = day.dateString;
        setSelectedDate(date);
        await loadLogForDate(new Date(date));
        
        const user = auth.currentUser;
        if (!user) return;

        const logRef = doc(db, 'users', user.uid, 'dailyLogs', date);
        const snapshot = await getDoc(logRef);

        if (snapshot.exists()) {
            const logData = snapshot.data() as DailyLog;
            setLog(logData);
            setBleeding(logData.bleeding as any);
            setSymptoms(logData.symptoms || []);
        } else {
            setLog(null);
            setBleeding("None");
            setSymptoms([]);
        }

        setModalVisible(true);
    };

    const toggleSymptom = (symptom: string) => {
        setSymptoms((prev) =>
            prev.includes(symptom)
                ? prev.filter((s) => s !== symptom)
                : [...prev, symptom]
        );
    };
            
    


    const handleSaveLog = async () => {
        if (!selectedDate) return;
        const user = auth.currentUser;
        if (!user) return;

        await setDoc(doc(db, 'users', user.uid, 'dailyLogs', selectedDate), {
            bleeding,
            symptoms,
            updatedAt: serverTimestamp(),
        });

        setModalVisible(false);
        await loadMarkedDates();

        Alert.alert('Saved!', 'Your daily log has been saved successfully.');
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

            <Modal visible={modalVisible} animationType="slide" transparent>
                    <SafeAreaView style={styles.modalBackground}>
                      <View style={styles.modalContainer}>
            
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
            
                        <Button title="Save Log" onPress={handleSaveLog} />
                        <Button title="Cancel" onPress={closeModal} />
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

    
});











            
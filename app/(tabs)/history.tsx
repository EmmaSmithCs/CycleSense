import { auth, db } from '@/firebase/config';
import { format } from 'date-fns';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Button, Modal, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';



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

    useEffect(() => {
        const loadMarkedDates = async () => {
            const user = auth.currentUser;
            if (!user) return;

            const logsRef = collection(db, 'users', user.uid, 'dailyLogs');
            const snapshot = await getDocs(logsRef);

            const marked: any = {};

            snapshot.docs.forEach((doc) => {
                marked[doc.id] = {
                    marked: true,
                    dotColor: "#f06292",
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

        loadMarkedDates();
    }, []);

    const onDayPress = async (day: any) => {
        const date = day.dateString;
        setSelectedDate(date);

        const user = auth.currentUser;
        if (!user) return;

        const logRef = doc(db, 'users', user.uid, 'dailyLogs', date);
        const snapshot = await getDoc(logRef);

        if (snapshot.exists()) {
            setLog(snapshot.data() as DailyLog);
        } else {
            setLog(null);
        }

        setModalVisible(true);
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
                markedDates={markedDates}
                onDayPress={onDayPress}
                theme={{
                    todayTextColor: "#ba68c8",
                    arrowColor: "#f06292",
                    selectedDayBackgroundColor: "#f06292",
                }}
            />

            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>{selectedDate}</Text>

                        {log ? (
                            <>
                                <Text>Bleeding: {log.bleeding}</Text>
                                <Text>Symptoms:
                                    {log.symptoms.length > 0 ? log.symptoms.join(", ") : "None"}
                                </Text>

                                <Button title="Edit Log" onPress={() => {}} />
                                <Button title="Delete Log" onPress={() => {}} color="red" />
                            </>

                        ) : (
                            <>
                                <Text>No log for this day.</Text>
                                <Button title="Add Log" onPress={() => {}} />
                            </>
                        )}

                        <Button title="Close" onPress={() => setModalVisible(false)} />
                    </View>
                </View>
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

    
});











            
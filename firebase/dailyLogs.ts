// app/firebase/dailyLogs.ts

// Imports
import { formatDate } from "date-fns";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./config";

export type DailyLog = {
    bleeding?: "None" | "Light" | "Medium" | "Heavy";
    symptoms?: string[];
    timestamp?: any;
};

// Get log
export async function getDailyLog(userId: string, date: Date): Promise<DailyLog | null> {
    const docRef = doc(db, "users", userId, "dailyLogs", formatDate(date, "yyyy-MM-dd"));
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as DailyLog) : null;
}

// Save or update log
export async function saveDailyLog(userId: string, date: Date, data: DailyLog): Promise<void> {
    const docRef = doc(db, "users", userId, "dailyLogs", formatDate(date, "yyyy-MM-dd"));
    await setDoc(docRef, {
        ...data,
        timestamp: serverTimestamp(),
    }, { merge: false });  // 
}


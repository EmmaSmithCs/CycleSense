// app/firebase/dailyLogs.ts

/*
    This file contains functions for managing daily logs in the app using Firebase Firestore.
    It defines the structure of a daily log entry, which can include information about bleeding levels and symptoms for a specific day. 
    The getDailyLog function retrieves a daily log for a given user and date, while the saveDailyLog function saves or updates a daily log in Firestore with the provided data and a timestamp.

    Key features:
    - Defines a DailyLog type that includes optional fields for bleeding levels, symptoms, and a timestamp.
    - Implements getDailyLog to fetch a daily log document from Firestore based on the user ID and date, returning the log data if it exists or null if it doesn't.
    - Implements saveDailyLog to create or update a daily log document in Firestore with the provided data and a server timestamp, ensuring that each log entry is associated with the correct user and date.
    
*/

// Imports
import { formatDate } from "date-fns";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./config";

// Type for a daily log entry
export type DailyLog = {
    bleeding?: "None" | "Light" | "Medium" | "Heavy"; // Level of bleeding for the day
    symptoms?: string[]; // List of symptoms experienced on that day
    timestamp?: any; // Firestore timestamp of when the log was created or last updated
};

// Function to get a daily log for a specific user and date 
export async function getDailyLog(userId: string, date: Date): Promise<DailyLog | null> {
    const docRef = doc(db, "users", userId, "dailyLogs", formatDate(date, "yyyy-MM-dd"));
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as DailyLog) : null;
}

// Function to save a daily log for a specific user and date. It creates or updates the log document in Firestore with the provided data and adds a timestamp.
export async function saveDailyLog(userId: string, date: Date, data: DailyLog): Promise<void> {
    const docRef = doc(db, "users", userId, "dailyLogs", formatDate(date, "yyyy-MM-dd"));
    await setDoc(docRef, {
        ...data,
        timestamp: serverTimestamp(),
    }, { merge: false });  // 
}
// app/utils/notifications.ts

/*
    This module provides utility functions for managing notifications in the period tracker app. 
    It includes functionality to schedule notifications based on user logs, generate insights about upcoming symptoms, and handle notification permissions. 

    Key features:
    - Schedules personalized notifications to remind users about upcoming symptoms based on patterns detected in their logs.
    - Provides functions to request notification permissions and manage scheduled notifications.
    - Uses Expo Notifications API for scheduling and managing notifications across both iOS and Android platforms.

*/

// Imports
import { auth, db } from '@/firebase/config';
import * as Notifications from "expo-notifications";
import { collection, getDocs } from "firebase/firestore";
import { symptomInfo } from '../data/symptomInfo';
import { buildCycles, getCycleInfo, predictNextPeriod } from "./cyclePrediction";

// Set notification handler to show notifications when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

// Define types for logs, insights, and scheduling results
type DailyLog = {
    id: string; // Unique identifier for the log, typically the date in 'YYYY-MM-DD' format
    bleeding: "None" | "Light" | "Medium" | "Heavy"; // Bleeding level for the day
    symptoms:  {name: string; intensity?: number}[]; // List of symptoms with optional intensity
    date?: string; // Date of the log entry, can be derived from the id if not explicitly provided
}

// Insight type for predictions based on symptom patterns
type Insight = {
    type: string; // Type of insight, e.g., "Prediction: Cramps"
    message: string; // User-friendly message to display in the notification
    details?: any; // Additional details for the insight, such as symptom description, tips, etc.
    cardType: "prediction"; // Type of card to display in the app, can be used to render different UI components
};

// Result type for scheduling a period reminder notification
type ScheduleResult = {
    id: string; // ID of the scheduled notification, can be used for cancellation or tracking
    predictedPeriodDate: string; // The predicted date of the next period, in ISO string format
    reminderDate: string; // The date when the reminder notification is scheduled to be shown, in ISO string format
    cycleLengthUsed: number | null; // The cycle length that was used for the prediction, if available
    debug?: { // Optional debug information for development purposes
        cycles: any[]; // The cycles that were detected from the logs, can be used to verify the prediction logic
        logsUsed: number; // The number of logs that were used in the prediction, can help understand the data sufficiency for predictions
    };
};

// Type for logs used in scheduling reminders, includes all necessary information for prediction
type ReminderLog = {
    id: string; // Unique identifier for the log, typically the date in 'YYYY-MM-DD' format
    bleeding: "None" | "Light" | "Medium" | "Heavy"; // Bleeding level for the day
    symptoms: { name: string; intensity?: number }[]; // List of symptoms with optional intensity
    date: string; // Date of the log entry, should be in ISO string format for consistency
};

// Main function to schedule a period reminder notification based on user's logs
export async function schedulePeriodReminderFromLogs(
    logs: ReminderLog[],
    daysBefore: number = 2
): Promise<ScheduleResult | null> {

    // Validate that there are logs to analyze for prediction
    if (!logs.length) {
        console.log("🩸 No logs provided");
        return null;
    }

    // Build cycles
    const cycles = buildCycles(
        logs.map(l => ({
            bleeding: l.bleeding,
            symptoms: l.symptoms.map(s => s.name),
            date: l.date
        }))
    );

    // Validate that cycles were detected for prediction
    if (!cycles.length) {
        console.log("🩸 No cycles detected");
        return null;
    }

    // Predict next period
    const predictedDate = predictNextPeriod(cycles);

    // Validate that a predicted date was obtained from the prediction function
    if (!predictedDate) {
        return null;
    }

    // Calculate reminder date
    const reminderDate = new Date(predictedDate);
    reminderDate.setDate(reminderDate.getDate() - daysBefore);

    // Safety fallback (never schedule in past)
    const now = new Date();
    if (reminderDate <= now) {
        return null;
    }

    // Schedule notification
    const id = await scheduleNotification(
        "🩸 Period Reminder",
        `Your period is expected around ${predictedDate.toDateString()} — stay prepared!`,
        reminderDate
    );

    // Return the scheduled notification ID and prediction details for potential debugging or future reference
    const debugCycles = cycles;

    // Log the prediction 
    return {
        id,
        predictedPeriodDate: predictedDate.toISOString(),
        reminderDate: reminderDate.toISOString(),
        cycleLengthUsed: cycles[cycles.length - 1]?.cycleLength ?? null,
        debug: {
            cycles: debugCycles,
            logsUsed: logs.length
        }

    };
}

// Generate insights based on symptom patterns in the logs to predict upcoming symptoms and provide user-friendly notifications
export const generatePredictionInsights = (logs: DailyLog[]): Insight[] => {

    // Validate that there are logs to analyze for insights
    if (!logs.length) return [];

    // Transform logs to ensure they have the necessary structure for cycle analysis and symptom counting
    const cycleLogs = logs.map(l => ({
        ...l,
        date: l.date ?? l.id,
        symptoms: l.symptoms.map(s => s.name)
    }));

    // Get current cycle day and average cycle length to contextualize symptom patterns within the user's menstrual cycle
    const { cycleDay, avgLength } = getCycleInfo(cycleLogs);
    const resolvedAvgLength = avgLength || 28;

    // If we can't determine the current cycle day we return an empty array
    if (cycleDay === null) return [];

    // Builds cycles from logs
    const cycles = buildCycles(cycleLogs);

    // Count symptom occurrences by cycle day
    const symptomDayCount: Record<string, Record<number, number>> = {};

    logs.forEach(log => {

        // Skip logs without a date
        if (!log.date) return;

        // Parse the log date and determine which day of the cycle it corresponds to, if possible
        const logDate = new Date(log.date);
        let dayInCycle: number | null = null;

        // Check if the log falls within a known cycle
        for (const cycle of cycles) {
            const start = new Date(cycle.startDate);
            const end = new Date(cycle.endDate);
            
            // If the log date falls within this cycle, calculate the day in cycle
            if (logDate >= start && logDate <= end) {
                dayInCycle = Math.floor((logDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                break;
            }
        }

        // Fallback: find the most recent cycle that started before this log
        if (dayInCycle === null) {
            const precedingCycle = [...cycles].reverse().find(c => new Date(c.startDate) <= logDate);
            
            // If we find a preceding cycle, we can estimate the day in cycle based on the average cycle length
            if (precedingCycle) {
                const day = Math.floor((logDate.getTime() - new Date(precedingCycle.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
                if (day > 0 && day <= resolvedAvgLength) {
                    dayInCycle = day;
                }
            }
        }

        // If we still can't determine the day in cycle, we skip counting symptoms for this log since we want to focus on patterns related to cycle days
        if (dayInCycle === null) return;

        // Count each symptom for the determined day in cycle, building a structure that allows us to see which symptoms are most common on which days across the user's history
        log.symptoms.forEach(sym => {
            if (!symptomDayCount[sym.name]) symptomDayCount[sym.name] = {};
            if (!symptomDayCount[sym.name][dayInCycle!]) symptomDayCount[sym.name][dayInCycle!] = 0;
            symptomDayCount[sym.name][dayInCycle!]++;
        });
    });

    // Determine upcoming days in the cycle to focus our predictions on and create prediction insights array
    const upcomingDays = [((cycleDay % resolvedAvgLength) + 1), ((cycleDay + 1) % resolvedAvgLength) + 1];
    const predictionInsights: Insight[] = [];

    // For each symptom, check if it has a strong historical pattern on any of the upcoming days in the cycle
    Object.keys(symptomDayCount).forEach(symName => {

        // Day counts for this symptom
        const dayCounts = symptomDayCount[symName];

        // If the symptom occurs frequently, at least 2 times on any of the upcoming days, we consider it a strong pattern worth notifying the user about, and we create an insight with details from our symptomInfo dataset to provide helpful context and tips in the notification
        upcomingDays.forEach(day => {
            
            if ((dayCounts[day] ?? 0) < 2) return;
            const info = symptomInfo[symName];
            if (!info || !info.shoppingList?.length) return;

            // Check if we've already added an insight for this symptom to avoid duplicates in the notification feed
            const alreadyAdded = predictionInsights.some(i => i.type === `Prediction: ${symName}`);
            if (alreadyAdded) return;

            // If we have a strong pattern and relevant info, we add an insight to the array 
            predictionInsights.push({
                cardType: "prediction",
                type: `Prediction: ${symName}`,
                message: `Based on your history, you often experience ${symName} around day ${day} of your cycle. Consider preparing!`,
                details: {
                description: info.description ?? "No description available.",
                tips: info.tips ?? [],
                phase: info.typicalCyclePhase ?? "Unknown phase",
                shoppingList: info.shoppingList ?? [],
                }
            });
        });
    });

    // Return the generated insights
    return predictionInsights;
};

// Function to fetch user's logs, generate insights, and schedule a notification about upcoming symptoms based on detected patterns in the logs
export async function notifyUpcomingSymptomsForUser(date?: Date) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    // Fetch logs
    const snapshot = await getDocs(collection(db, "users", currentUser.uid, "dailyLogs"));
    const logs: DailyLog[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        const rawSymptoms = data.symptoms || [];
        const cleanedSymptoms = rawSymptoms.map((sym: any) => {
            let nameStr = "";
            if (typeof sym === "string") nameStr = sym;
            else if (typeof sym === "object") nameStr = sym.name?.name ?? sym.name ?? "";
            return {
                name: nameStr,
                intensity: sym.intensity !== undefined ? Number(sym.intensity) : undefined,
            };
        });

        // Ensure bleeding value is valid, default to "None" if not provided or invalid
        const validBleeding = ["None", "Light", "Medium", "Heavy"];
        const bleedingValue = validBleeding.includes(data.bleeding) ? data.bleeding : "None";

        // Return the cleaned log entry with a consistent structure for further analysis
        return {
            id: doc.id,
            date: data.date ?? doc.id,
            bleeding: bleedingValue as "None" | "Light" | "Medium" | "Heavy",
            symptoms: cleanedSymptoms,
        };
    });

    // If no logs, we can't generate insights, so we skip scheduling a notification and log this case for debugging purposes
    if (!logs.length) {
        console.log("No logs found, skipping insights notification.");
        return;
    }

    // Generate insights
    const insights = generatePredictionInsights(logs);
    if (!insights.length) {
        console.log("No insights to notify.");
        return;
    }

    // For demonstration purposes, we take the first insight to create a notification
    const prediction = insights[0];

    // Request notification permission from the user, 
    const granted = await requestNotificationPermission();
    if (!granted) {
        console.log("Notification permissions not granted");
        return;
    }

    // Schedule the notification for the predicted symptom, using the provided date or defaulting to 5 seconds
    const scheduledDate = date ?? new Date(Date.now() + 5000);

    // Schedule the notification and log the scheduled ID 
    const id = await scheduleNotification(
        prediction.type,
        prediction.message,
        scheduledDate
    );

    console.log(`Scheduled notification with ID: ${id} for insight: ${prediction.type}`);

    // Return the scheduled notification ID for potential future reference or cancellation
    return id;
}


// Ask permission
export async function requestNotificationPermission() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
}

// Schedule a one-shot notification at a specific date
export async function scheduleNotification(title: string, body: string, date: Date) {
    const now = new Date();
    if (date <= now) {
        console.warn("Scheduled date is in the past — defaulting to 5 seconds from now");
        date = new Date(now.getTime() + 5000);
    }

    // Schedule the notification using Expo Notifications API, calculating the trigger time based on the provided date and ensuring that it is set to go off at the correct time
    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.max(1, Math.floor((date.getTime() - Date.now()) / 1000)),
        },
    });
    return id;
}

// Schedule a daily repeating notification at a fixed hour/minute
export async function scheduleDailyNotification(title: string, body: string, hour: number, minute: number) {
    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: true,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            hour,
            minute,
            repeats: true,
        },
    });
    return id;
}

// Cancel all notifications
export async function cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

// Cancel a specific notification by ID
export async function cancelNotification(id: string) {
    await Notifications.cancelScheduledNotificationAsync(id);
}
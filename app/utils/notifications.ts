// utils/notifications.ts

// Imports
import { auth, db } from '@/firebase/config';
import * as Notifications from "expo-notifications";
import { collection, getDocs } from "firebase/firestore";
import { symptomInfo } from '../data/symptomInfo';
import { buildCycles, getCycleInfo } from "./cyclePrediction";

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

type DailyLog = {
    id: string;
    bleeding: "None" | "Light" | "Medium" | "Heavy";
    symptoms:  {name: string; intensity?: number}[];
    date?: string;
}

type Insight = {
    type: string;
    message: string;
    details?: any;
    cardType: "prediction";
};


export const generatePredictionInsights = (logs: DailyLog[]): Insight[] => {
  if (!logs.length) return [];

  const cycleLogs = logs.map(l => ({
    ...l,
    date: l.date ?? l.id,
    symptoms: l.symptoms.map(s => s.name)
  }));

  const { cycleDay, avgLength } = getCycleInfo(cycleLogs);
  const resolvedAvgLength = avgLength || 28;

  if (cycleDay === null) return [];

  const cycles = buildCycles(cycleLogs);

  // Count symptom occurrences by cycle day
  const symptomDayCount: Record<string, Record<number, number>> = {};

  logs.forEach(log => {
    if (!log.date) return;

    const logDate = new Date(log.date);
    let dayInCycle: number | null = null;

    // Check if the log falls within a known cycle
    for (const cycle of cycles) {
      const start = new Date(cycle.startDate);
      const end = new Date(cycle.endDate);
      if (logDate >= start && logDate <= end) {
        dayInCycle = Math.floor((logDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        break;
      }
    }

    // Fallback: find the most recent cycle that started before this log
    if (dayInCycle === null) {
      const precedingCycle = [...cycles].reverse().find(c => new Date(c.startDate) <= logDate);
      if (precedingCycle) {
        const day = Math.floor((logDate.getTime() - new Date(precedingCycle.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
        if (day > 0 && day <= resolvedAvgLength) {
          dayInCycle = day;
        }
      }
    }

    if (dayInCycle === null) return;

    log.symptoms.forEach(sym => {
      if (!symptomDayCount[sym.name]) symptomDayCount[sym.name] = {};
      if (!symptomDayCount[sym.name][dayInCycle!]) symptomDayCount[sym.name][dayInCycle!] = 0;
      symptomDayCount[sym.name][dayInCycle!]++;
    });
  });

  const upcomingDays = [((cycleDay % resolvedAvgLength) + 1), ((cycleDay + 1) % resolvedAvgLength) + 1];

  const predictionInsights: Insight[] = [];

  Object.keys(symptomDayCount).forEach(symName => {
    const dayCounts = symptomDayCount[symName];

    upcomingDays.forEach(day => {
      if ((dayCounts[day] ?? 0) < 2) return;
      const info = symptomInfo[symName];
      if (!info || !info.shoppingList?.length) return;

      const alreadyAdded = predictionInsights.some(i => i.type === `Prediction: ${symName}`);
      if (alreadyAdded) return;

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

  return predictionInsights;
};


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

        const validBleeding = ["None", "Light", "Medium", "Heavy"];
        const bleedingValue = validBleeding.includes(data.bleeding) ? data.bleeding : "None";

        return {
            id: doc.id,
            date: data.date ?? doc.id,
            bleeding: bleedingValue as "None" | "Light" | "Medium" | "Heavy",
            symptoms: cleanedSymptoms,
        };
    });

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

    const prediction = insights[0];

    const granted = await requestNotificationPermission();
    if (!granted) {
        console.log("Notification permissions not granted");
        return;
    }

    const scheduledDate = date ?? new Date(Date.now() + 5000);

    const id = await scheduleNotification(
        prediction.type,
        prediction.message,
        scheduledDate
    );

    console.log(`Scheduled notification with ID: ${id} for insight: ${prediction.type}`);

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

export async function cancelNotification(id: string) {
    await Notifications.cancelScheduledNotificationAsync(id);
}
// utils/notifications.ts

// Imports
import * as Notifications from "expo-notifications";

// Ask permission
export async function requestNotificationPermission() {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
}

// Schedule a notification
export async function scheduleNotification(title: string, body: string, date: Date) {
    const now = new Date();
    if (date <= now) {
        console.warn("Cannot schedule notification in the past");
        date = new Date(now.getTime() + 5000); // Schedule 5 seconds from now
    }

    const secondsFromNow = Math.floor((date.getTime() - new Date().getTime()) / 1000);

    const id = await Notifications.scheduleNotificationAsync({
        content: {
            title,
            body,
            sound: true,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.floor((date.getTime() - Date.now()) / 1000), }, });
    return id;
}

// Cancel all notifications
export async function cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function cancelNotification(id: string) {
    await Notifications.cancelScheduledNotificationAsync(id);
}


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
    await Notifications.scheduleNotificationAsync({
        content: {
            title: title,
            body: body,
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: Math.floor((date.getTime() - Date.now()) / 1000),
        },
    });
}

// Cancel all notifications
export async function cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
}


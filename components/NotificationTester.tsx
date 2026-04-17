// app/components/NotificationTester.tsx

/*
    This component is a testing utility for the CycleSense app.
    It provides a user interface to test various notification functionalities, including:

    - Requesting notification permissions from the user.
    - Scheduling different types of notifications (general test, period reminder, daily tracking reminder, insights notification).
    - Scheduling a repeating daily notification for testing purposes.
    - Displaying logs of each test's status (pending, success, failure) along with details for debugging.
    - Canceling all scheduled notifications immediately.

    Key features:
    - Uses Expo Notifications API to manage notifications.
    - Provides a clear and interactive UI for running tests and viewing results.

    Usage:
    - Tap "Run All Tests" to execute a series of notification tests. Background the app immediately to see the notifications as they fire.
    - Each test will log its status and details in the log box below the buttons.
    - Tap "Cancel All" to clear all scheduled notifications immediately.

*/

// Imports
import * as Notifications from "expo-notifications";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { cancelAllNotifications, notifyUpcomingSymptomsForUser, requestNotificationPermission, scheduleDailyNotification, scheduleNotification, schedulePeriodReminderFromLogs } from "../app/utils/notifications";


type LogEntry = { label: string; status: "pending" | "ok" | "fail"; detail?: string };

type ReminderLog = Parameters<typeof schedulePeriodReminderFromLogs>[0][number];
 
// NotificationTester component to test various notification functionalities
export default function NotificationTester() {

    // State variables to hold logs of test results and whether tests are currently running
    const [log, setLog] = useState<LogEntry[]>([]);
    const [running, setRunning] = useState(false);

    // Helper function to add a log entry to the log state
    const addLog = (entry: LogEntry) => setLog(prev => [entry, ...prev]);
 
    // Helper function to run a test with a given label and async function, logging the result as pending, then ok or fail based on the outcome
    const run = async (label: string, fn: () => Promise<string | undefined | void>) => {
        addLog({ label, status: "pending" }); // Log the start of the test as pending
        try {
            const result = await fn();
            addLog({ label, status: "ok", detail: result ? `ID: ${result}` : "done" }); // Success
        } catch (e: any) {
            addLog({ label, status: "fail", detail: e?.message ?? String(e) }); // Fail
        }
    };
 
    // Main function to run all notification tests in sequence, demonstrating various notification features and logging results
    const handleRunAll = async () => {

        // Clear previous logs and set running state to true to disable the button while tests are running
        setRunning(true);
        setLog([]);
 
        // Request notification permission from the user
        await run("Request permission", async () => {
            const granted = await requestNotificationPermission();
            if (!granted) throw new Error("Permission denied");
            return "granted";
        
        });
 
        // Schedule a general test notification to fire in 5 seconds, demonstrating basic notification scheduling functionality
        await run("scheduleNotification (5s)", () =>
            scheduleNotification("🔔 General Test", "Notifications are working!", new Date(Date.now() + 5000))
            
        );
 
        // Schedule a period reminder notification to fire in 10 seconds, demonstrating the ability to schedule specific types of notifications with custom content
        await run("Period Reminder (10s)", () =>
            scheduleNotification("🩸 Period Reminder", "Your period may be approaching — stay prepared!", new Date(Date.now() + 10000))
        );
 
        // Schedule a daily tracking reminder to fire in 15 seconds, demonstrating the ability to schedule notifications that encourage user engagement and regular app usage
        await run("Daily Tracking Reminder (15s)", () =>
            scheduleNotification("📋 Daily Tracking", "Don't forget to log your symptoms and mood!", new Date(Date.now() + 15000))
        );
 
        // repearingId will hold the ID of a repeating notification that we will schedule next, allowing us to cancel it later for cleanup
        let repeatingId: string | undefined;

        // Schedule a repeating daily notification to fire every day at the current time plus 1 minute, demonstrating the ability to schedule recurring notifications and log the scheduled ID for future reference
        await run("scheduleDailyNotification TEST (1 min)", async () => {
            const now = new Date();

            repeatingId = await scheduleDailyNotification(
                "📋 Daily Tracking (repeating TEST)",
                "Don't forget to log your symptoms and mood!",
                now.getHours(),
                now.getMinutes() + 1 // 👈 fires in 1 minute
            );

            return `registered - ID: ${repeatingId}`;
        });

 
        // Schedule an insights notification to fire in 20 seconds, demonstrating the ability to create notifications based on user data and insights generated by the app
        await run("Insights notification (20s)", () =>
            notifyUpcomingSymptomsForUser(new Date(Date.now() + 20000))
        );


        // Schedule a period reminder based on fake logs to test the cycle prediction and notification scheduling logic, demonstrating how the app can use user data to generate personalized notifications and log the predicted dates and details for debugging purposes
        await run("Fake period reminder (5s)", async () => {
            const fakeLogs: ReminderLog[] = [
                {
                    id: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString(),
                    bleeding: "Light",
                    symptoms: [],
                    date: new Date(Date.now() - 26 * 24 * 60 * 60 * 1000).toISOString(),
                }
            ];

            // Schedule the period reminder based on the fake logs, which simulates a user having logged a light bleeding day 26 days ago, and we want to see if the app correctly predicts the next period and schedules a notification accordingly
            const result = await schedulePeriodReminderFromLogs(fakeLogs, 2);
            if (!result) return "failed";

            console.log("🧪 PERIOD REMINDER RESULT:", result);

            return `🩸 Period Reminder Debug

            ID: ${result.id}
            Predicted: ${result.predictedPeriodDate}
            Reminder: ${result.reminderDate}
            Cycle Length: ${result.cycleLengthUsed ?? "unknown"}

            Logs Used: ${result.debug?.logsUsed ?? 0}
            Cycles Found: ${result.debug?.cycles?.length ?? 0}
            `;
        });
 
        // List all scheduled notifications after running the tests to verify that they have been scheduled correctly and log the details for debugging purposes
        await run("List scheduled notifications", async () => {
            const all = await Notifications.getAllScheduledNotificationsAsync();
            return `${all.length} scheduled: ${all.map(n => n.content.title).join(", ") || "none"}`;
        });
 
        // After 70 seconds, cancel the repeating notification and all notifications to clean up after the test, demonstrating how to manage and cancel scheduled notifications programmatically and log the cleanup actions for debugging purposes
        setTimeout(async () => {
            try {
                if (repeatingId) {
                    await Notifications.cancelScheduledNotificationAsync(repeatingId);
                }
                await cancelAllNotifications();

                addLog({
                    label: "Cleanup",
                    status: "ok",
                    detail: "Cancelled repeating notification and cleared all",
                });
            } catch (e: any) {
                addLog({
                    label: "Cleanup",
                    status: "fail",
                    detail: e?.message ?? String(e),
                });
            }
        }, 70000); // 70 seconds to ensure all notifications have fired before cleanup

        setRunning(false); // Re-enable the button after all tests have been initiated
    };
 
    // Function to cancel all scheduled notifications immediately
    const handleClearAll = async () => {
        await cancelAllNotifications();
        addLog({ label: "Cancel all notifications", status: "ok", detail: "cleared" });
    };
 
    // Render the component UI
    return (
        <View style={styles.container}>
            {/* Heading and instructions for the tester */}
            <Text style={styles.heading}>🧪 Notification Tester</Text>
            <Text style={styles.hint}>
                After tapping Run, background the app immediately so banners appear.
                Notifications fire at 5s / 10s / 15s / 20s.
            </Text>
 
            {/* Buttons to run all tests or clear all notifications, with appropriate styling and disabled state while tests are running */}
            <View style={styles.row}>
                <TouchableOpacity
                    style={[styles.btn, styles.btnPrimary, running && styles.btnDisabled]}
                    onPress={handleRunAll}
                    disabled={running}
                >
                    <Text style={styles.btnText}>{running ? "Running…" : "▶ Run All Tests"}</Text>
                </TouchableOpacity>
 
                <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={handleClearAll}>
                    <Text style={styles.btnText}>✕ Cancel All</Text>
                </TouchableOpacity>
            </View>
 
            {/* ScrollView to display logs of test results, showing the status and details of each test for debugging purposes */}
            <ScrollView style={styles.logBox} contentContainerStyle={{ gap: 6 }}>
                {log.length === 0 && (
                    <Text style={styles.empty}>Results will appear here…</Text>
                )}
                {log.map((entry, i) => (
                    <View key={i} style={[styles.logEntry, styles[`log_${entry.status}`]]}>
                        <Text style={styles.logIcon}>
                            {entry.status === "pending" ? "⏳" : entry.status === "ok" ? "✅" : "❌"}
                        </Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.logLabel}>{entry.label}</Text>
                            {entry.detail && <Text style={styles.logDetail}>{entry.detail}</Text>}
                        </View>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}
 
// Styles
const styles = StyleSheet.create({

    // Style for the main container of the tester 
    container: {
        margin: 16,
        padding: 16,
        backgroundColor: "#1a1a2e",
        borderRadius: 16,
        gap: 12,
    },

    // Style for the heading text of the tester
    heading: {
        fontSize: 16,
        fontWeight: "800",
        color: "#fff",
    },
        
    // Style for the hint text providing instructions to the user
    hint: {
        fontSize: 12,
        color: "#aaa",
        lineHeight: 17,
    },

    // Style for rows of buttons, arranging them horizontally 
    row: {
        flexDirection: "row",
        gap: 10,
    },

    // Base style for buttons
    btn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
    },

    // Style for primary action buttons
    btnPrimary: { 
        backgroundColor: "#7c3aed" 
    },
    
    // Style for danger action buttons
    btnDanger:  { 
        backgroundColor: "#be123c" 
    },

    // Style for disabled buttons
    btnDisabled: { 
        opacity: 0.5 
    },

    // Style for the text inside buttons
    btnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 13,
    },

    // Style for the log box that displays test results
    logBox: {
        maxHeight: 300,
        marginTop: 4,
    },

    // Style for the empty state of the log box when there are no logs to display
    empty: {
        color: "#666",
        fontSize: 12,
        textAlign: "center",
        marginTop: 12,
    },

    // Style for individual log entries, with different background colors based on the status of the log (pending, ok, fail) 
    logEntry: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        padding: 10,
        borderRadius: 8,
    },

    // Style for pending log entries
    log_pending: { 
        backgroundColor: "#2d2d44" 
    },
    
    // Style for successful log entries
    log_ok: { 
        backgroundColor: "#14532d55" 
    },
    
    // Style for failed log entries
    log_fail: { 
        backgroundColor: "#7f1d1d55" 
    },
    
    // Style for the icon displayed in log entries, showing different emojis based on the status of the log
    logIcon: { 
        fontSize: 14, 
        marginTop: 1 
    },
    
    // Style for the label of each log entry, showing the test name and status 
    logLabel: { 
        fontSize: 13, 
        color: "#fff", 
        fontWeight: "600" 
    },
    
    // Style for the detail text of each log entry
    logDetail: { 
        fontSize: 11, 
        color: "#aaa", 
        marginTop: 2 
    }
});
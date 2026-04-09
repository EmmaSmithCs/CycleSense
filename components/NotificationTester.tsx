// components/NotificationTester.tsx

 
import * as Notifications from "expo-notifications";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { cancelAllNotifications, notifyUpcomingSymptomsForUser, requestNotificationPermission, scheduleDailyNotification, scheduleNotification, } from "../app/utils/notifications";
 
type LogEntry = { label: string; status: "pending" | "ok" | "fail"; detail?: string };
 
export default function NotificationTester() {
    const [log, setLog] = useState<LogEntry[]>([]);
    const [running, setRunning] = useState(false);
 
    const addLog = (entry: LogEntry) => setLog(prev => [entry, ...prev]);
 
    const run = async (label: string, fn: () => Promise<string | undefined | void>) => {
        addLog({ label, status: "pending" });
        try {
            const result = await fn();
            addLog({ label, status: "ok", detail: result ? `ID: ${result}` : "done" });
        } catch (e: any) {
            addLog({ label, status: "fail", detail: e?.message ?? String(e) });
        }
    };
 
    const handleRunAll = async () => {
        setRunning(true);
        setLog([]);
 
        // 1. Permission
        await run("Request permission", async () => {
            const granted = await requestNotificationPermission();
            if (!granted) throw new Error("Permission denied");
            return "granted";
        
        });
 
        // 2. One-shot general notification (fires in 5s)
        await run("scheduleNotification (5s)", () =>
            scheduleNotification("🔔 General Test", "Notifications are working!", new Date(Date.now() + 5000))
            
        );
 
        // 3. Period reminder one-shot (fires in 10s) — mimics the real daily
        await run("Period Reminder (10s)", () =>
            scheduleNotification("🩸 Period Reminder", "Your period may be approaching — stay prepared!", new Date(Date.now() + 10000))
        );
 
        // 4. Daily tracking one-shot (fires in 15s)
        await run("Daily Tracking Reminder (15s)", () =>
            scheduleNotification("📋 Daily Tracking", "Don't forget to log your symptoms and mood!", new Date(Date.now() + 15000))
        );
 
        // 5. scheduleDailyNotification — schedules a repeating one, verify it's registered
        let repeatingId: string | undefined;

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

 
        // 6. Insights notification (fires in 20s — needs real Firestore data)
        await run("Insights notification (20s)", () =>
            notifyUpcomingSymptomsForUser(new Date(Date.now() + 20000))
        );
 
        // 7. List all currently scheduled notifications
        await run("List scheduled notifications", async () => {
            const all = await Notifications.getAllScheduledNotificationsAsync();
            return `${all.length} scheduled: ${all.map(n => n.content.title).join(", ") || "none"}`;
        });
 
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
        }, 70000);

        setRunning(false);
    };
 
    const handleClearAll = async () => {
        await cancelAllNotifications();
        addLog({ label: "Cancel all notifications", status: "ok", detail: "cleared" });
    };
 
    return (
        <View style={styles.container}>
            <Text style={styles.heading}>🧪 Notification Tester</Text>
            <Text style={styles.hint}>
                After tapping Run, background the app immediately so banners appear.
                Notifications fire at 5s / 10s / 15s / 20s.
            </Text>
 
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
 
const styles = StyleSheet.create({
    container: {
        margin: 16,
        padding: 16,
        backgroundColor: "#1a1a2e",
        borderRadius: 16,
        gap: 12,
    },
    heading: {
        fontSize: 16,
        fontWeight: "800",
        color: "#fff",
    },
    hint: {
        fontSize: 12,
        color: "#aaa",
        lineHeight: 17,
    },
    row: {
        flexDirection: "row",
        gap: 10,
    },
    btn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    btnPrimary: { backgroundColor: "#7c3aed" },
    btnDanger:  { backgroundColor: "#be123c" },
    btnDisabled: { opacity: 0.5 },
    btnText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 13,
    },
    logBox: {
        maxHeight: 300,
        marginTop: 4,
    },
    empty: {
        color: "#666",
        fontSize: 12,
        textAlign: "center",
        marginTop: 12,
    },
    logEntry: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
        padding: 10,
        borderRadius: 8,
    },
    log_pending: { backgroundColor: "#2d2d44" },
    log_ok:      { backgroundColor: "#14532d55" },
    log_fail:    { backgroundColor: "#7f1d1d55" },
    logIcon: { fontSize: 14, marginTop: 1 },
    logLabel: { fontSize: 13, color: "#fff", fontWeight: "600" },
    logDetail: { fontSize: 11, color: "#aaa", marginTop: 2 },
});
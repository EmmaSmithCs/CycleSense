// app/(tabs)/profile.tsx

import { useTheme } from '@/context/ThemeContext';
import { logout } from '@/firebase/auth';
import { auth, db, storage } from '@/firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { format, subDays, subMonths } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Types
type Section = "none" | "name" | "password" | "download";

export default function ProfileScreen() {
    const router = useRouter();
    const user = auth.currentUser;

    const { theme } = useTheme();
    const c = theme.colors;

    // Profile data
    const [userName, setUserName] = useState('');
    const [photoURL,  setPhotoURL] = useState<string | null>(null);
    const [joinedDate, setJoinedDate] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeSection, setActiveSection] = useState<Section>('none');
    const [newName, setNewName] = useState('');
    const [savingName, setSavingName] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [savingPassword, setSavingPassword] = useState(false);
    const [downloadRange, setDownloadRange] = useState<'week' | 'month' | '3months'>('month');
    const [generatingPDF, setGeneratingPDF] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            if (!user) return;
            const snap = await getDoc(doc(db, 'users', user.uid));
            if (snap.exists()) {
                const data = snap.data();
                setUserName(data.name || '');
                setPhotoURL(data.photoURL || null);
                if (data.createdAt?.toDate) {
                    setJoinedDate(format(data.createdAt.toDate(), 'MMMM yyyy'));
                }
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    // Profile image
    const handlePickImage = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Permission needed", "Please allow access to your photos.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (result.canceled || !user) return;

        try {
            const uri = result.assets[0].uri;
            console.log("1. Got URI:", uri);
            
            const response = await fetch(uri);
            console.log("2. Fetched URI, status:", response.status);
            
            const blob = await response.blob();
            console.log("3. Got blob, size:", blob.size);
            
            const storageRef = ref(storage, `profileImages/${user.uid}.jpg`);
            console.log("4. Storage ref:", storageRef.fullPath, "bucket:", storageRef.bucket);
            
            await uploadBytes(storageRef, blob);
            console.log("5. Upload complete");
            
            const url = await getDownloadURL(storageRef);
            console.log("6. Got URL:", url);

            setPhotoURL(url);
            await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
            console.log("7. Firestore updated with new photoURL");
            
        } catch (e: any) {
            console.log("Failed at step - code:", e.code, "message:", e.message, "status:", e.status_);
        }
    };

    // Name
    const handleSaveName = async () => {
        if (!user || !newName.trim()) return;
        setSavingName(true);
        try {
            await updateDoc(doc(db, 'users', user.uid), { name: newName.trim()});
            setUserName(newName.trim());
            setActiveSection('none');
            Alert.alert("Saved", "Your name has been updated.");
        } catch {
            Alert.alert("Error!", "Failed to save name.");
        }
        setSavingName(false);
    };

    // Password
    const handleChangePassword = async () => {
        if (!user || !user.email) return;
        if (newPassword !==  confirmPassword) {
            Alert.alert("Error!", "New passwords do NOT match.");
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert("Error!", "Password must be at least 6 characters.");
            return;
        }
        setSavingPassword(true);

        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setActiveSection('none');
            Alert.alert("Success!", "Password updated successfully.");
        } catch (e: any) {
            Alert.alert("Error!", e.message || "Failed to update password.");
        }

        setSavingPassword(false);
    };

    // PDF download

    const handleDownloadPDF = async () => {
        if (!user) return;
        
        setGeneratingPDF(true);
        try {
            const now = new Date();
            const cutoff = 
                downloadRange === 'week'
                    ? subDays(now, 7)
                    : downloadRange === 'month'
                    ? subMonths(now, 1)
                    : subMonths(now, 3);

            const logsRef = collection(db, 'users', user.uid, 'dailyLogs');
            const snapshot = await getDocs(logsRef);

            const logs = snapshot.docs  
                .map(d => ({ date: d.id, ...d.data()}))
                .filter(l => new Date(l.date) >= cutoff)
                .sort((a, b) => a.date.localeCompare(b.date));
            
                const rows = logs.map((l: any) => {
                    const symptoms = (l.symptoms || [])
                        .map ((s: any) => (typeof s === 'string' ? s : s.name))
                        .join (', ') || '-';
                    return `
                        <tr>
                            <td>${l.date}</td>
                            <td>${l.bleeding || 'None'}</td>
                            <td>${symptoms}</td>
                            <td>${l.notes}</td>
                        </tr>
                    `;
                    
                }).join('');

                const html =   `
                    <html><head><style>
                        body { font-family: Arial, sans-serif; padding: 24px; color: #333; }
                        h1 { color: #f06292; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { background: #f06292; color: white; padding: 10px; text-align: left; }
                        td { padding: 8px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
                        tr:nth-child(even) { background: #fce4ec; }
                        .meta { color: #888; font-size: 13px; margin-bottom: 8px; }
                    </style></head><body>
                        <h1>CycleSense — Cycle Log</h1>
                        <p class="meta">Generated: ${format(now, 'dd MMMM yyyy')}</p>
                        <p class="meta">Period: ${format(cutoff, 'dd MMM yyyy')} – ${format(now, 'dd MMM yyyy')}</p>
                        <p class="meta">Email: ${user.email}</p>
                        <table>
                            <thead><tr>
                                <th>Date</th><th>Bleeding</th><th>Symptoms</th><th>Notes</th>
                            </tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </body></html>
                `;

                const { uri } = await Print.printToFileAsync({ html });
                await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
        } catch (e) {
            Alert.alert("Error!", "Failed to generate PDF.");
        }
        setGeneratingPDF(false);
            
        
    };

    // Delete data

    const handleDeleteAllData = () => {
        Alert.alert(
            "Delete all data",
            "This will permanently delete all your cycle logs and symptoms. Your account will remain active. This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete all data",
                    style: "destructive",
                    onPress: async () => {
                        if (!user) return;
                        try {
                            const logsRef = collection(db, 'users', user.uid, 'dailyLogs');
                            const snap = await getDocs(logsRef);
                            await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
                            Alert.alert("Done", "All your cycle data has been deleted");
                        } catch (e: any) {
                            Alert.alert("Error!", e.message || "Failed to delete data");
                        }
                    },
                },
            ]
        );
    };

    // Delete account
    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete account",
            "This will permanently delete all your cycle logs and symptoms. This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        Alert.prompt(
                            "Confirm password",
                            "Enter your password to confirm deletion.",
                            async (password) => {
                                if (!user || !user.email || !password) return;
                                try {
                                    const credential = EmailAuthProvider.credential(user.email, password);
                                    await reauthenticateWithCredential(user, credential);
                                    // delete Firestore data
                                    const logsRef = collection(db, 'users', user.uid, 'dailyLogs');
                                    const snap = await getDocs(logsRef);
                                    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
                                    await deleteDoc(doc(db, 'users', user.uid));
                                    await deleteUser(user);
                                    router.replace('/(auth)/login');
                                } catch (e: any) {
                                    Alert.alert("Error",  "Failed to delete account. Please make sure your password is correct or try again later.");
                                }
                            },
                            'secure-text'
                        );
                    }
                }
            ]
        )
    }


    const handleSignOut = async () => {
        Alert.alert("Sign Out", "Are you sure you want to sign out?", [
            {text: "Cancel", style: "cancel"},
            {
                text: "Sign out",
                style: "destructive",
                onPress: async () => {
                    await logout();
                    router.replace("/(auth)/login");
                },
            },
        ]);
    };

    const toggle = (section: Section) =>
        setActiveSection(prev => (prev === section ? "none" : section));
    
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background }}>
                <ActivityIndicator size="large" color={c.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Title */}
                <Text style={[styles.pageTitle, { color: c.text }]}>Profile</Text>

                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrapper}>
                        {photoURL ? (
                            <Image source={{ uri: photoURL + '&t=' + Date.now()}} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: c.primaryLight }]}>
                                <Text style={[styles.avatarInitial, { color: c.primary }]}>
                                    {userName ? userName[0].toUpperCase() : '?'}
                                </Text>
                            </View>
                        )}
                        <View style={[styles.avatarEditBadge, { backgroundColor: c.primary }]}>
                            <Ionicons name="camera" size={14} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={[styles.userName, { color: c.text }]}>{userName || "Your Name"} </Text>
                    <Text style={[styles.userEmail, { color: c.textSecondary }]}>{user?.email}</Text>
                    {joinedDate && (
                        <Text style={[styles.joinedDate, { color: c.textMuted }]}>Member since {joinedDate}</Text>
                    )}
                </View>

                {/* Edit name*/}
                <TouchableOpacity style={[styles.row, { borderBottomColor: c.border }]} onPress={() => toggle("name")}>
                    <Ionicons name="person-outline" size={20} color={c.primary} style={styles.rowIcon} />
                    <Text style={[styles.rowLabel, { color: c.text }]}>Edit name</Text>
                    <Ionicons name={activeSection === "name" ? "chevron-up" : "chevron-down"} size={18} color={c.textMuted} />
                </TouchableOpacity>
                {activeSection === "name" && (
                    <View style={[styles.expandedCard, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
                        <TextInput
                            style={styles.input}
                            placeholder='New name'
                            value={newName}
                            onChangeText={setNewName}
                            placeholderTextColor={c.textMuted}
                        />
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: c.primary }]}
                            onPress={handleSaveName}
                            disabled={savingName}
                        >
                            <Text style={styles.actionButtonText}>
                                {savingName ? "Saving..." : "Save name"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Password change*/}
                <TouchableOpacity style={[styles.row, { borderBottomColor: c.border }]} onPress={() => toggle("password")}>
                    <Ionicons name="lock-closed-outline" size={20} color={c.primary} style={styles.rowIcon} />
                    <Text style={[styles.rowLabel, { color: c.text }]}>Change password</Text>
                    <Ionicons 
                        name={activeSection === "password" ? "chevron-up" : "chevron-down"}
                        size = {18} color={c.textMuted}
                    />
                </TouchableOpacity>
                {activeSection === "password" && (
                    <View style={[styles.expandedCard, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
                        <TextInput
                            style={styles.input}
                            placeholder='Current password'
                            secureTextEntry
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                        />
                        <TextInput 
                            style={styles.input}
                            placeholder="New password"
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholderTextColor={c.textMuted}
                        />
                        <TextInput  
                            style={styles.input}
                            placeholder='Confirm new password'
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholderTextColor={c.textMuted}
                        />
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: c.primary }]}
                            onPress={handleChangePassword}
                            disabled={savingPassword}
                        >
                            <Text style={styles.actionButtonText}>
                                {savingPassword ? "Updating..." : "Update password"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Download data */}
                <TouchableOpacity style={[styles.row, { borderBottomColor: c.border }]} onPress={() => toggle('download')}>
                    <Ionicons name="download-outline" size={20} color={c.primary} style={styles.rowIcon} />
                    <Text style={[styles.rowLabel, { color: c.text }]}>Download my data</Text>
                    <Ionicons
                        name ={activeSection === "download" ? "chevron-up" : "chevron-down"}
                        size={18} color={c.textMuted}
                    />
                </TouchableOpacity>
                {activeSection === "download" && (
                    <View style={[styles.expandedCard, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
                        <Text style={[styles.expandedLabel, { color: c.textMuted }]}>Select time range:</Text>
                        <View style={styles.rangeRow}>
                            {(['week', 'month', '3months'] as const).map(r => (
                                <TouchableOpacity
                                    key={r}
                                    onPress={() => setDownloadRange(r)}
                                    style={[
                                        styles.rangeButton,
                                        { borderColor: c.border },
                                        downloadRange === r && { borderColor: c.primary, backgroundColor: c.primaryLight },
                                    ]}
                                >
                                    <Text style={[
                                        styles.rangeButtonText,
                                        { color: c.textMuted },
                                        downloadRange === r && { color: c.primary, fontWeight: "600" },
                                    ]}>
                                        {r === "week" ? "Last 7 days" : r === "month" ? "Last month" : "Last 3 months"}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: c.primary }]}
                            onPress={handleDownloadPDF}
                            disabled={generatingPDF}
                        >
                            <Text style={styles.actionButtonText}>
                                {generatingPDF ? "Generating PDF..." : "Export as PDF"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Gamification PLACEHOLDER */}
                <View style={[styles.row, styles.rowDisabled, { borderBottomColor: c.border }]}>
                    <Ionicons name="trophy-outline" size={20} color={c.textMuted} style={styles.rowIcon} />
                    <View style={{ flex: 1}}>
                        <Text style={[styles.comingSoon, { color: c.textMuted }]}>Coming Soon!</Text>
                    </View>
                    <View style={[styles.comingSoonBadge, { backgroundColor: c.surface }]}>
                        <Text style={styles.comingSoonBadgeText}>🔒</Text>
                    </View>
                </View>

                {/* DANGEROUS Things */}

                <Text style={[styles.sectionHeader, { color: c.textMuted }]}>Account</Text>

                {/* Sign out */}

                <TouchableOpacity style={[styles.row, { borderBottomColor: c.border }]} onPress={handleSignOut}>
                    <Ionicons name="log-out-outline" size={20} color={c.primary} style={styles.rowIcon}/>
                    <Text style={[styles.rowLabel, { color: c.text }]}>Sign out</Text>
                    <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
                </TouchableOpacity>

                {/* Delete data */}
                <TouchableOpacity style={[styles.row, { borderBottomColor: c.errorBackground }]} onPress={handleDeleteAllData}>
                    <Ionicons name="nuclear-outline" size={20} color={c.error} style={styles.rowIcon} />
                    <Text style={[styles.rowLabel, {color: c.error }]}>Delete all my data</Text>
                    <Ionicons name="chevron-forward" size={18} color={c.error} />
                </TouchableOpacity>

                {/* BIG BAD Delete Account */}
                <TouchableOpacity style={[styles.row, { borderBottomColor: c.errorBackground }]} onPress={handleDeleteAccount}>
                    <Ionicons name="trash-outline" size={20} color={c.error} style={styles.rowIcon}/>
                    <Text style={[styles.rowLabel, {color: c.error}]}>Delete account</Text>
                    <Ionicons name="chevron-forward" size={18} color={c.error}/>
                </TouchableOpacity>

                <View style={ { height: 40} } />
            </ScrollView>
            

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
    },

    pageTitle: {
        fontSize: 28,
        fontWeight: "bold",
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 20,
    },

    // Avatar related
    
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 24,
    },

    avatarWrapper: {
        position: "relative", 
        marginBottom: 12,
    },

    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
    },

    avatarPlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: "center",
        alignItems: "center",
    },

    avatarInitial: {
        fontSize: 36,
        color: "f06292",
        fontWeight: "bold",
    },

    avatarEditBadge: {
        position: "absolute",
        bottom: 0,
        right: 0,
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
    },

    userName: {
        fontSize: 20,
        fontWeight: "700",
    },

    userEmail: {
        fontSize: 14,
        marginTop: 2,
    },

    joinedDate: {
        fontSize: 12,
        marginTop: 4,
    },

    // Rows related

    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },

    rowDisabled: {
        opacity: 0.5,
    },

    rowIcon: {
        marginRight: 14,
    },

    rowLabel: {
        flex: 1,
        fontSize: 16,
    },

    // Expanded related

    expandedCard: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },

    expandedLabel: {
        fontSize: 13,
        marginBottom: 10,
    },

    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        fontSize: 15,
    },

    actionButton: {
        borderRadius: 10,
        padding: 13,
        alignItems: "center",
        marginTop: 4,
    },

    actionButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
    },

    // Range related

    rangeRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 14,
    },

    rangeButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: "center",
    },

    rangeButtonText: {
        fontSize: 12,
        color: "#888",
    },


    // Gamification related (placeholder)

    comingSoon: {
        fontSize: 11,
        marginTop: 2,
    },

    comingSoonBadge: {
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },

    comingSoonBadgeText: {
        fontSize: 16,
    },

    // Section header
    sectionHeader: {
        fontSize: 12,
        fontWeight: "600",
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 8,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
});
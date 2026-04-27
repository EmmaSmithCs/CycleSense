// app/(tabs)/profile.tsx

/*
    This file defines the Profile screen of the app.

    The Profile screen allows users to view and edit their profile information, including: 
    - Viewing and changing their profile picture
    - Viewing their name, email, and joined date
    - Editing their name
    - Changing their password
    - Downloading their cycle data as a PDF for a selected time range
    - Deleting all their cycle data
    - Deleting their account

    Key features:
    - Fetches user profile data from Firestore and displays it in the UI, including the profile picture, name, email, and joined date.
    - Allows users to update their profile picture by selecting an image from their device, which is then uploaded to Firebase Storage and the photoURL is updated in Firestore.
    - Provides an interface for users to edit their name and save the changes to Firestore.
    - Provides an interface for users to change their password, which requires reauthentication with the current password before updating to the new password in Firebase Authentication.
    - Allows users to download their cycle data as a PDF for a selected time range (week, month, or 3 months) by fetching the relevant data from Firestore, generating an HTML representation, converting it to PDF using Expo Print, and sharing it using Expo Sharing.
    - Provides options for users to delete all their cycle data or to delete their account entirely, with confirmation prompts to prevent accidental deletion.

*/

// Imports
import GamificationSection from '@/components/GamificationSection';
import { useDateFormat } from '@/context/DateFormatContext';
import { useGamification } from '@/context/GamificationContext';
import { useTheme } from '@/context/ThemeContext';
import { logout } from '@/firebase/auth';
import { auth, db, storage } from '@/firebase/config';
import { Ionicons } from '@expo/vector-icons';
import { format, subDays, subMonths } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Type for the different sections in the profile screen that can be expanded or collapsed
type Section = "none" | "name" | "password" | "download";

// Main profile screen component
export default function ProfileScreen() {
    
    // Router for navigation and user data from Firebase Auth
    const router = useRouter();
    const user = auth.currentUser;

    // Get theme colors from context
    const { theme } = useTheme();
    const c = theme.colors;

    // Get gamification data and refresh function from context
    const { refreshGamification } = useGamification();

    // Get date formatting function from context
    const { formatDate } = useDateFormat();

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

    // Fetch user profile data from Firestore on component mount
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

    // Refresh gamification data whenever the profile screen is focused
    useFocusEffect(
        useCallback(() => {
            refreshGamification();
        }, [refreshGamification])
    );

    // Handle profile image selection and upload to Firebase Storage, then update Firestore with the new photoURL
    const handlePickImage = async () => {

        // Request permission to access media library
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        // If permission is not granted, show an alert and exit the function
        if (!permission.granted) {
            Alert.alert("Permission needed", "Please allow access to your photos.");
            return;
        }

        // Launch the image picker to select an image from the library
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        // If the user cancels the image picker or if there is no user, exit the function
        if (result.canceled || !user) return;

        // Try to upload the selected image to Firebase Storage and update the user's profile with the new photoURL
        try {
            // Get the URI of the selected image
            const uri = result.assets[0].uri;
            
            // Fetch the image as a blob to prepare it for upload
            const response = await fetch(uri);
            
            // Convert the response to a blob that can be uploaded to Firebase Storage
            const blob = await response.blob();
            
            // Create a reference to the location in Firebase Storage where the profile image will be stored, using the user's UID
            const storageRef = ref(storage, `profileImages/${user.uid}.jpg`);
            
            // Upload the image blob to Firebase Storage at the specified reference
            await uploadBytes(storageRef, blob);
            
            // Get the download URL of the uploaded image from Firebase Storage
            const url = await getDownloadURL(storageRef);

            // Update the local state with the new photoURL to immediately reflect the change in the UI
            setPhotoURL(url);
            await updateDoc(doc(db, 'users', user.uid), { photoURL: url });
            
        } catch (e: any) {
            // If there is an error during the upload or update process, log the error details to the console for debugging
            console.log("Failed at step - code:", e.code, "message:", e.message, "status:", e.status_);
        }
    };

    // Handle saving the new name to Firestore and updating the local state, with error handling and user feedback through alerts
    const handleSaveName = async () => {
        // If there is no user or if the new name is empty after trimming whitespace, exit the function without making any changes
        if (!user || !newName.trim()) return;

        // Set the savingName state to true to indicate that the save operation is in progress
        setSavingName(true);

        // Try to update the user's name in Firestore and update the local state with the new name
        try {
            // Update the user's document in Firestore with the new name, using the user's UID to identify the correct document
            await updateDoc(doc(db, 'users', user.uid), { name: newName.trim()});
            setUserName(newName.trim());
            setActiveSection('none');

            // Show an alert to the user indicating that the name has been successfully updated
            Alert.alert("Saved", "Your name has been updated.");
        } catch {
            // If there is an error during the update process, show an alert to the user indicating that the name could not be saved
            Alert.alert("Error!", "Failed to save name.");
        }
        // Set the savingName state back to false to indicate that the save operation has completed
        setSavingName(false);
    };

    // Handle changing the user's password by reauthenticating with the current password and then updating to the new password, with error handling and user feedback through alerts
    const handleChangePassword = async () => {

        // If there is no user or if the user's email is not available, exit the function without making any changes
        if (!user || !user.email) return;

        // Validate that the new password and confirm password fields match
        if (newPassword !==  confirmPassword) {
            Alert.alert("Error!", "New passwords do NOT match.");
            return;
        }

        // Validate that the new password meets the minimum length requirement of 6 characters
        if (newPassword.length < 6) {
            Alert.alert("Error!", "Password must be at least 6 characters.");
            return;
        }

        // Set the savingPassword state to true to indicate that the password update operation is in progress
        setSavingPassword(true);

        // Try to reauthenticate the user with their current password and then update to the new password, with error handling to provide feedback on success or failure
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);

            // Clear the password fields
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setActiveSection('none');

            // Show an alert to the user indicating that the password has been successfully updated
            Alert.alert("Success!", "Password updated successfully.");
        } catch (e: any) {
            // If there is an error during reauthentication or password update, show an alert to the user with the error message or a generic failure message
            Alert.alert("Error!", e.message || "Failed to update password.");
        }

        // Set the savingPassword state back to false to indicate that the password update operation has completed
        setSavingPassword(false);
    };

    // Handle generating a PDF of the user's cycle logs for a selected time range and sharing it using the device's sharing options
    const handleDownloadPDF = async () => {
        if (!user) return;
        
        // Set the generatingPDF state to true to indicate that the PDF generation process is in progress
        setGeneratingPDF(true);

        // Try to fetch the user's cycle logs from Firestore for the selected time range, generate an HTML representation of the data, convert it to a PDF, and then share it using the device's sharing options
        try {
            const now = new Date();
            const cutoff = 
                downloadRange === 'week' // If the selected download range is 'week', set the cutoff date to 7 days ago from the current date
                    ? subDays(now, 7)
                    : downloadRange === 'month' // If the selected download range is 'month', set the cutoff date to 1 month ago from the current date, otherwise set it to 3 months ago
                    ? subMonths(now, 1)
                    : subMonths(now, 3); // If the selected download range is '3months', set the cutoff date to 3 months ago from the current date

            // Fetch the user's daily logs from Firestore for the specified time range by querying the 'dailyLogs' subcollection of the user's document and filtering the logs based on the cutoff date
            const logsRef = collection(db, 'users', user.uid, 'dailyLogs');
            const snapshot = await getDocs(logsRef);

            const logs = snapshot.docs  
                .map(d => ({ date: d.id, ...d.data()}))
                .filter(l => new Date(l.date) >= cutoff)
                .sort((a, b) => a.date.localeCompare(b.date));
            
                // For each log entry, create a table row in HTML format that includes the date, bleeding information, symptoms, and notes
                const rows = logs.map((l: any) => {
                    const symptoms = (l.symptoms || [])
                        .map((s: any) => {
                            if (typeof s === 'string') return s;
                            let label = s.name || '';
                            if (s.headacheType) label += ` (${s.headacheType})`;
                            if (s.intensity !== undefined) label += ` [intensity: ${s.intensity}]`;
                            return label;
                        })
                        .join(', ') || '-';
                    return `
                        <tr>
                            <td>${formatDate(new Date(l.date))}</td>
                            <td>${l.bleeding || 'None'}</td>
                            <td>${symptoms}</td>
                            <td>${l.notes || 'N/A '}</td>
                        </tr>
                    `;
                    
                }).join('');

                // Create an HTML document as a string that includes the user's cycle log data in a table format
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
                        <p class="meta">Generated: ${formatDate(now, 'long')}</p>
                        <p class="meta">Period: ${formatDate(cutoff, 'long')} - ${formatDate(now, 'long')}</p>
                        <p class="meta">Email: ${user.email}</p>
                        <table>
                            <thead><tr>
                                <th>Date</th><th>Bleeding</th><th>Symptoms</th><th>Notes</th>
                            </tr></thead>
                            <tbody>${rows}</tbody>
                        </table>
                    </body></html>
                `;

                // Use the Expo Print API to convert the HTML string into a PDF file and get the URI of the generated PDF
                const { uri } = await Print.printToFileAsync({ html });
                await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
        } catch (e) {
            // If there is an error during the PDF generation or sharing process, show an alert to the user indicating that the PDF could not be generated
            Alert.alert("Error!", "Failed to generate PDF.");
        }
        setGeneratingPDF(false);
    };

    // Handle deleting all of the user's cycle data from Firestore with a confirmation alert to prevent accidental deletion
    const handleDeleteAllData = () => {

        // Show a confirmation alert to the user to confirm that they want to delete all their cycle data, with options to cancel or proceed with deletion
        Alert.alert(
            "Delete all data",
            "This will permanently delete all your cycle logs and symptoms. Your account will remain active. This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete all data",
                    style: "destructive",
                    // If the user confirms deletion, execute the onPress function to delete all documents in the user's 'dailyLogs' subcollection in Firestore
                    onPress: async () => {
                        if (!user) return;
                        try {
                            const logsRef = collection(db, 'users', user.uid, 'dailyLogs');
                            const snap = await getDocs(logsRef);
                            await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));

                            // Show an alert to the user indicating that all their cycle data has been deleted
                            Alert.alert("Done", "All your cycle data has been deleted");
                        } catch (e: any) {
                            //  If there is an error during the deletion process, show an alert to the user with the error message or a generic failure message
                            Alert.alert("Error!", e.message || "Failed to delete data");
                        }
                    },
                },
            ]
        );
    };

    // Handle deleting the user's account by first confirming the user's password and then deleting all their cycle data from Firestore and finally deleting the user from Firebase Authentication
    const handleDeleteAccount = () => {
        // Show a confirmation alert to the user to confirm that they want to delete their account, with options to cancel or proceed with deletion
        Alert.alert(
            "Delete account",
            "This will permanently delete all your cycle logs and symptoms. This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => {
                        // If the user confirms account deletion, show another prompt to confirm the user's password before proceeding 
                        Alert.prompt(
                            "Confirm password",
                            "Enter your password to confirm deletion.",

                            // If the user enters their password and confirms, execute the onPress function to reauthenticate the user
                            async (password) => {
                                if (!user || !user.email || !password) return;

                                // Try to reauthenticate the user with their current password, then delete all documents in the user's 'dailyLogs' subcollection in Firestore, delete the user's document in Firestore, and finally delete the user from Firebase Authentication
                                try {
                                    const credential = EmailAuthProvider.credential(user.email, password);
                                    await reauthenticateWithCredential(user, credential);

                                    // Delete Firestore data and user account
                                    const logsRef = collection(db, 'users', user.uid, 'dailyLogs');
                                    const snap = await getDocs(logsRef);
                                    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
                                    await deleteDoc(doc(db, 'users', user.uid));
                                    await deleteUser(user);

                                    // Reroute to the login screen after successful account deletion
                                    router.replace('/(auth)/login');
                                } catch (e: any) {
                                    // If there is an error during reauthentication, data deletion, or account deletion, show an alert to the user with the error message or a generic failure message
                                    Alert.alert("Error",  "Failed to delete account. Please make sure your password is correct or try again later.");
                                }
                            },
                            // Set secureTextEntry to true to hide the password input in the prompt
                            'secure-text'
                        );
                    }
                }
            ]
        )
    }

    // Handle signing the user out by showing a confirmation alert and then calling the logout function from Firebase Authentication if the user confirms
    const handleSignOut = async () => {
        // Show a confirmation alert to the user to confirm that they want to sign out
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

    // Toggle to set the active section in the profile screen
    const toggle = (section: Section) =>
        setActiveSection(prev => (prev === section ? "none" : section));
    
    // If the profile data is still loading, show a loading indicator 
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: c.background }}>
                <ActivityIndicator size="large" color={c.primary} />
            </View>
        );
    }

    // Render the profile screen
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Title */}
                <Text style={[styles.pageTitle, { color: c.text }]}>Profile</Text>

                {/* Avatar */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={handlePickImage} style={styles.avatarWrapper}>
                        {/* If the user has a photoURL, display the profile image. Otherwise, display a placeholder with the user's initial */}
                        {photoURL ? (
                            <Image source={{ uri: photoURL + '&t=' + Date.now()}} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: c.primaryLight }]}>
                                <Text style={[styles.avatarInitial, { color: c.primary }]}>
                                    {userName ? userName[0].toUpperCase() : '?'}
                                </Text>
                            </View>
                        )}

                        {/* Camera icon badge on the avatar to indicate that it can be edited */}
                        <View style={[styles.avatarEditBadge, { backgroundColor: c.primary }]}>
                            <Ionicons name="camera" size={14} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    {/* Display the user's name, email, and joined date below the avatar */ }
                    <Text style={[styles.userName, { color: c.text }]}>{userName || "Your Name"} </Text>
                    <Text style={[styles.userEmail, { color: c.textSecondary }]}>{user?.email}</Text>
                    {joinedDate && (
                        <Text style={[styles.joinedDate, { color: c.textMuted }]}>Member since {joinedDate}</Text>
                    )}
                </View>

                {/* Edit the user's name */}
                <TouchableOpacity style={[styles.row, { borderBottomColor: c.border }]} onPress={() => toggle("name")}>
                    <Ionicons name="person-outline" size={20} color={c.primary} style={styles.rowIcon} />
                    <Text style={[styles.rowLabel, { color: c.text }]}>Edit name</Text>
                    <Ionicons name={activeSection === "name" ? "chevron-up" : "chevron-down"} size={18} color={c.textMuted} />
                </TouchableOpacity>

                {/* If the "Edit name" section is active, display a text input for the new name and a button to save the changes */ }
                {activeSection === "name" && (
                    <View style={[styles.expandedCard, { backgroundColor: c.surface, borderBottomColor: c.border }]}>

                        {/* Text input for the new name, with the current name as the value */ }
                        <TextInput
                            style={styles.input}
                            placeholder='New name'
                            value={newName}
                            onChangeText={setNewName}
                            placeholderTextColor={c.textMuted}
                        />

                        {/* Button to save the new name */ }
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: c.primary }]}
                            onPress={handleSaveName}
                            disabled={savingName}
                        >
                            {/* If the name is currently being saved, show a loading indicator on the button */ }
                            <Text style={styles.actionButtonText}>
                                {savingName ? "Saving..." : "Save name"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Change the user's password */}
                <TouchableOpacity style={[styles.row, { borderBottomColor: c.border }]} onPress={() => toggle("password")}>
                    <Ionicons name="lock-closed-outline" size={20} color={c.primary} style={styles.rowIcon} />
                    <Text style={[styles.rowLabel, { color: c.text }]}>Change password</Text>
                    <Ionicons 
                        name={activeSection === "password" ? "chevron-up" : "chevron-down"}
                        size = {18} color={c.textMuted}
                    />
                </TouchableOpacity>

                {/* If the "Change password" section is active, display text inputs for the current password, new password, and confirm new password, along with a button to save the changes */ }
                {activeSection === "password" && (
                    <View style={[styles.expandedCard, { backgroundColor: c.surface, borderBottomColor: c.border }]}>

                        {/* Text input for the current password, with secure text entry enabled to hide the input */ }
                        <TextInput
                            style={styles.input}
                            placeholder='Current password'
                            secureTextEntry
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                        />

                        {/* Text input for the new password, with secure text entry enabled to hide the input */ }
                        <TextInput 
                            style={styles.input}
                            placeholder="New password"
                            secureTextEntry
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholderTextColor={c.textMuted}
                        />

                        {/* Text input to confirm the new password, with secure text entry enabled to hide the input */ }
                        <TextInput  
                            style={styles.input}
                            placeholder='Confirm new password'
                            secureTextEntry
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholderTextColor={c.textMuted}
                        />

                        {/* Button to save the new password */ }
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: c.primary }]}
                            onPress={handleChangePassword}
                            disabled={savingPassword}
                        >
                            {/* If the password is currently being updated, show a loading indicator on the button */ }
                            <Text style={styles.actionButtonText}>
                                {savingPassword ? "Updating..." : "Update password"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Download the data as PDF */}
                <TouchableOpacity style={[styles.row, { borderBottomColor: c.border }]} onPress={() => toggle('download')}>
                    <Ionicons name="download-outline" size={20} color={c.primary} style={styles.rowIcon} />
                    <Text style={[styles.rowLabel, { color: c.text }]}>Download my data</Text>
                    <Ionicons
                        name ={activeSection === "download" ? "chevron-up" : "chevron-down"}
                        size={18} color={c.textMuted}
                    />
                </TouchableOpacity>

                {/* If the "Download my data" section is active, display options to select the time range for the data to be included in the PDF and a button to generate and share the PDF */ }
                {activeSection === "download" && (
                    <View style={[styles.expandedCard, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
                        
                        {/* Label for the time range selection options */ }
                        <Text style={[styles.expandedLabel, { color: c.textMuted }]}>Select time range:</Text>
                        <View style={styles.rangeRow}>
                            {/* Buttons to select the time range for the data to be included in the PDF */ }
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
                                        {r === "week" ? "Last 7 days" : r === "month" ? "Last month" : "Last 3 months"} {/* Display the label for the time range based on the value of r */ }
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Button to generate and share the PDF */ }
                        <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: c.primary }]}
                            onPress={handleDownloadPDF}
                            disabled={generatingPDF}
                        >
                            {/* If the PDF is currently being generated, show a loading indicator on the button */ }
                            <Text style={styles.actionButtonText}>
                                {generatingPDF ? "Generating PDF..." : "Export as PDF"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Gamification section */}
                <Text style={[styles.sectionHeader, { color: c.textMuted }]}>Achievements</Text>
                <GamificationSection />

                {/* DANGEROUS THINGS */}
                <Text style={[styles.sectionHeader, { color: c.textMuted }]}>Account</Text>

                {/* Sign out of the account */}
                <TouchableOpacity style={[styles.row, { borderBottomColor: c.border }]} onPress={handleSignOut}>
                    <Ionicons name="log-out-outline" size={20} color={c.primary} style={styles.rowIcon}/>
                    <Text style={[styles.rowLabel, { color: c.text }]}>Sign out</Text>
                    <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
                </TouchableOpacity>

                {/* Delete the data */}
                <TouchableOpacity style={[styles.row, { borderBottomColor: c.errorBackground }]} onPress={handleDeleteAllData}>
                    <Ionicons name="nuclear-outline" size={20} color={c.error} style={styles.rowIcon} />
                    <Text style={[styles.rowLabel, {color: c.error }]}>Delete all my data</Text>
                    <Ionicons name="chevron-forward" size={18} color={c.error} />
                </TouchableOpacity>

                {/* DANGEROUS!!!!!!!!!!!!!!! Delete Account */}
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

// Styles
const styles = StyleSheet.create({

    // Style for the main container of the profile screen
    container: {
        flex: 1,
    },

    // Style for the page title at the top of the profile screen
    pageTitle: {
        fontSize: 28,
        fontWeight: "bold",
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 20,
    },

    // Avatar related styles
    
    // Style for the section containing the user's avatar and profile information
    avatarSection: {
        alignItems: 'center',
        paddingVertical: 24,
    },

    // Style for the wrapper around the avatar image
    avatarWrapper: {
        position: "relative", 
        marginBottom: 12,
    },

    // Style for the avatar image itself, with a circular shape
    avatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
    },

    // Style for the placeholder that is shown when the user does not have a profile image
    avatarPlaceholder: {
        width: 90,
        height: 90,
        borderRadius: 45,
        justifyContent: "center",
        alignItems: "center",
    },

    // Style for the initial letter shown in the avatar placeholder
    avatarInitial: {
        fontSize: 36,
        color: "f06292",
        fontWeight: "bold",
    },

    // Style for the camera icon badge that appears on the avatar to indicate that it can be edited
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

    // Style for the user's name displayed below the avatar
    userName: {
        fontSize: 20,
        fontWeight: "700",
    },

    // Style for the user's email displayed below the name
    userEmail: {
        fontSize: 14,
        marginTop: 2,
    },

    // Style for the user's joined date displayed below the email
    joinedDate: {
        fontSize: 12,
        marginTop: 4,
    },

    // Rows related styles

    // Style for each row item in the profile screen (e.g., "Edit name", "Change password")
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },

    // Style for a disabled row item, which reduces the opacity to indicate that it is not interactive
    rowDisabled: {
        opacity: 0.5,
    },

    // Style for the icon displayed in each row item
    rowIcon: {
        marginRight: 14,
    },

    // Style for the label text displayed in each row item
    rowLabel: {
        flex: 1,
        fontSize: 16,
    },

    // Expanded related styles

    // Style for the expanded card that appears when a row item is tapped
    expandedCard: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },

    // Style for the label text displayed at the top of the expanded card
    expandedLabel: {
        fontSize: 13,
        marginBottom: 10,
    },

    // Style for the text input fields displayed in the expanded card for editing name or changing password
    input: {
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        fontSize: 15,
    },

    // Style for the action button displayed in the expanded card for saving changes to name or password, or for generating the PDF
    actionButton: {
        borderRadius: 10,
        padding: 13,
        alignItems: "center",
        marginTop: 4,
    },

    // Style for the text displayed inside the action button
    actionButtonText: {
        color: "#fff",
        fontSize: 15,
        fontWeight: "600",
    },

    // Range related styles

    // Style for the row containing the time range selection buttons in the "Download my data" expanded section
    rangeRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 14,
    },

    // Style for each button used to select the time range for the data to be included in the PDF
    rangeButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: "center",
    },

    // Style for the text displayed inside each time range selection button
    rangeButtonText: {
        fontSize: 12,
        color: "#888",
    },

    // Style for the section headers that separate different sections of the profile screen
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
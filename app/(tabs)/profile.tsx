// app/(tabs)/profile.tsx

import { logout } from '@/firebase/auth';
import { auth } from '@/firebase/config';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const router = useRouter();
    const user = auth.currentUser;

    const handleSignOut = async () => {
        Alert.alert("Sign Out", "Are you srue you want to sign out?", [
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

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Profile</Text>

            <View style={styles.card}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{user?.email ?? "Unknown"}</Text>
            </View>

            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#fff",
        padding: 20,
    },

    title: {
        fontSize: 28,
        fontWeight: "bold",
        marginBottom: 30,
        marginTop: 20,
    },

    card: {
        backgroundColor: "#f9f9f9",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },

    label: {
        fontSize: 12,
        color: "#999",
        marginBottom: 4,
    },
    
    value: {
        fontSize: 16,
        fontWeight: "500",
    },

    signOutButton: {
        marginTop: 30,
        backgroundColor: "#f06292",
        padding:16,
        borderRadius: 12,
        alignItems: "center",
    },

    signOutText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    }
})
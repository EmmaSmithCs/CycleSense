// app/(auth)/forgotPassword.tsx

/*

    This file... FILL IN LATER

*/

import { useRouter } from "expo-router";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ForgotPassword() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleReset = async () => {
        if (!email.trim()) {
            setError("Please enter your email address.")
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const auth = getAuth()
            await sendPasswordResetEmail(auth, email.trim());
            setSuccess(true);
        } catch (e: any) {
            setError(friendlyError(e.code))
        } finally {
            setLoading(false);
        }
    };



    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Text style={styles.appName}>CycleSense</Text>
                    <Text style={styles.tagline}>Track your cycle, know your body</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>
                        Enter your email and we'll send you a link to reset your password!
                    </Text>

                    {error && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {success ? (
                        <View style={styles.successBox}>
                            <Text style={styles.successText}>
                                Check your inbox! A reset link has been sent to your email address.
                            </Text>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.label}>Email</Text>
                            <TextInput 
                                style={styles.input}
                                placeholder="you@example.com"
                                placeholderTextColor="#ccc"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />

                            <TouchableOpacity
                                style={[styles.button, loading && styles.buttonDisabled]}
                                onPress={handleReset}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Send Reset Link</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Remember your password?</Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.footerLink}> Log In</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
};

function friendlyError(code: string): string {
    switch (code) {
        case "auth/user-not-found":
            return "No account found with that email."
        case "auth/invalid-email":
            return "Please enter a valid email address."
        case "auth/too-many-requests":
            return "Too many attempts. Please wait a moment and try again."
        default: 
            return "Something went wrong. Please try again."
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff0f5",
    },

    inner: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 24,
    },

    header: {
        alignItems: "center",
        marginBottom: 32,
    },

    appName: {
        fontSize: 32, 
        fontWeight: 800,
        color: "#ff06292",
        letterSpacing: 0.5
    },

    tagline: {
        fontSize: 14,
        color: "#aaa",
        marginTop: 4
    },

    card: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 24,
        shadowColor: "#f06292",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },

    title: {
        fontSize: 22,
        fontWeight: 700, 
        color: "#333",
        marginBottom: 8,
    },

    subtitle: {
        fontSize: 14,
        color: "#aaa",
        marginBottom: 20,
        lineHeight: 20,
    },

    label: {
        fontSize: 13,
        fontWeight: 600,
        color: "#888",
        marginBottom: 6,
        marginTop: 12,
    },

    input: {
        borderWidth: 1,
        borderColor: "#f0f0f0",
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: "#f06292",
        backgroundColor: "#fafafa",
    },

    button: {
        backgroundColor: "#f06292",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        marginTop: 24,
    },

    buttonDisabled: {
        opacity: 0.6,
    },

    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: 700,
    },

    errorBox: {
        backgroundColor: "#fce4ec",
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
    },

    errorText: {
        color: "#c62828",
        fontSize: 13,
    },

    successBox: {
        backgroundColor: "#e8f5e9",
        borderRadius: 10,
        padding: 16,
        marginTop: 8, 
    },

    successText: {
        color: "#2e7d32",
        fontSize: 14,
        lineHeight: 20,
    },

    footer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 24
    },

    footerText: {
        color: "#aaa",
        fontSize: 14,
    },

    footerLink: {
        color: "#f06292",
        fontSize: 14,
        fontWeight: 700,
    }
})
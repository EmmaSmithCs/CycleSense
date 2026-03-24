// app/(auth)/login.tsx

// Imports
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { login } from "../../firebase/auth";

// Login component
export default function Login() {
    // Declare state variables
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Handle login
    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setError("Please enter your email and password.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await login(email, password);
            router.replace("/(tabs)");
        } catch (e: any) {
            setError("Incorrect email or password. Please try again.");
        }
        setLoading(false);
    };

    // Render login form
    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
                {/* Title */ }
                <View style={styles.header}>
                    <Text style={styles.appName}>CycleSense</Text>
                    <Text style={styles.tagline}>Track your cycle, know your body</Text>
                </View>

                {/* Card */ }
                <View style={styles.card}>
                    <Text style={styles.title}>Welcome Back</Text>

                    {error && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

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

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#ccc"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity style={[styles.loginButton, loading && styles.loginButtonDisabled]} onPress={handleLogin} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>Log In</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>   
                    <Text style={styles.footerText}>Don't have an account?</Text>
                    <TouchableOpacity onPress={() => router.replace("/(auth)/signup")}>
                        <Text style={styles.footerLink}> Sign Up</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView> 
    );
};

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
        fontWeight: "800",
        color: "#f06292",
        letterSpacing: 0.5,
    },

    tagline: {
        fontSize: 14,
        color: "#aaa",
        marginTop: 4,
    },

    card: {
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 24,
        shadowColor: "#f06292",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
    },

    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#333",
        marginBottom: 20,
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

    label: {
        fontSize: 13,
        fontWeight: "600",
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
        color: "#333",
        backgroundColor: "#fafafa",
    },

    loginButton: {
        backgroundColor: "#f06292",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        marginTop: 24,
    },

    loginButtonDisabled: {
        opacity: 0.6,
    },

    loginButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },

    footer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 24,
    },

    footerText: {
        color: "#aaa",
        fontSize: 14,
    },

    footerLink: {
        color: "#f06292",
        fontSize: 14,
        fontWeight: "700",

    },
});
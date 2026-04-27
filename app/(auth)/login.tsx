// app/(auth)/login.tsx

/*
    This file defines the Login component, which renders the login screen for the app.

    The login input fields include:
    - Email: A text input for the user's email address, which is validated to ensure it is not empty before attempting to log in.
    - Password: A secure text input for the user's password, which is also validated to ensure it is not empty before attempting to log in.

    The login button triggers the handleLogin function, which attempts to authenticate the user using the login function from the Firebase auth module. 
    If the login is successful, the user is navigated to the main tab layout. 
    If there is an error during login (e.g., incorrect credentials), an error message is displayed on the screen.

    Key features:
    - Uses React state to manage the email, password, error message, and loading state during the login process.
    - Provides user feedback by showing an error message if the login fails, and a loading indicator while the login request is in progress.
    - Uses Expo Router's useRouter hook to navigate to the main tab layout upon successful login, and to navigate to the signup screen if the user does not have an account.
    
*/

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
            setError("Please enter your email and password."); // Validate that email and password fields are not empty before attempting to log in, and show an error message if they are.
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await login(email, password);
        } catch (e: any) {
            setError("Incorrect email or password. Please try again."); // Show an error message if the login fails due to incorrect credentials.
            setLoading(false);
        }
    };

    // Render login form
    return (
        // Use KeyboardAvoidingView to ensure the keyboard does not cover input fields on iOS, and ScrollView to allow scrolling when the keyboard is open
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

                    {/* Show an error message if there is an error during login */ }
                    {error && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* Email field */ }
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

                    {/* Password field with forgot password link*/ }
                    <View style={styles.passwordLabelRow}>
                        <Text style={styles.label}>Password</Text>
                        <TouchableOpacity onPress={() => router.push("/(auth)/forgotPassword")}>
                            <Text style={styles.forgotLink}>Forgot password?</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#ccc"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry // Hide the password input for security
                    />

                    {/* Login button, which shows a loading indicator when the login process is in progress */ }
                    <TouchableOpacity style={[styles.loginButton, loading && styles.loginButtonDisabled]} onPress={handleLogin} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.loginButtonText}>Log In</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer for sign up option */ }
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

// Styles
const styles = StyleSheet.create({

    // Container for the entire login screen
    container: {
        flex: 1,
        backgroundColor: "#fff0f5",
    },

    // Inner container for the scrollable content
    inner: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 24,
    },

    // Header section containing the app name and tagline
    header: {
        alignItems: "center",
        marginBottom: 32,
    },

    // Style for the app name in the header
    appName: {
        fontSize: 32,
        fontWeight: "800",
        color: "#f06292",
        letterSpacing: 0.5,
    },

    // Style for the tagline in the header
    tagline: {
        fontSize: 14,
        color: "#aaa",
        marginTop: 4,
    },

    // Card style for the login form
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

    // Style for the title text in the login card
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#333",
        marginBottom: 20,
    },

    // Style for the error message box that appears when there is a login error
    errorBox: {
        backgroundColor: "#fce4ec",
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
    },

    // Style for the error message text within the error box
    errorText: {
        color: "#c62828",
        fontSize: 13,
    },

    // Style for the label text above each input field (Email, Password)
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: "#888",
        marginBottom: 6,
        marginTop: 12,
    },

    // Style for the text input fields (Email and Password) in the login form
    input: {
        borderWidth: 1,
        borderColor: "#f0f0f0",
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: "#333",
        backgroundColor: "#fafafa",
    },

    // Style for the login button
    loginButton: {
        backgroundColor: "#f06292",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        marginTop: 24,
    },

    // Style for the login button when it is disabled (e.g., during loading) to indicate that it cannot be pressed
    loginButtonDisabled: {
        opacity: 0.6,
    },

    // Style for the text inside the login button
    loginButtonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },

    // Style for the footer section containing the sign-up prompt and link
    footer: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 24,
    },

    // Style for the text within the footer section
    footerText: {
        color: "#aaa",
        fontSize: 14,
    },

    // Style for the sign-up link in the footer section, which is colored and bold to indicate that it is clickable
    footerLink: {
        color: "#f06292",
        fontSize: 14,
        fontWeight: "700",

    },

    passwordLabelRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 12,
        marginBottom: 6,
    },

    forgotLink: {
        fontSize: 13,
        color: "#f06292",
        fontWeight: 600,

    }
});
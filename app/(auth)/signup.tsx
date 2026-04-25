// app/(auth)/signup.tsx

/*
    This file defines the Signup component, which renders the user interface for the sign-up screen of the app.
    The sign-up screen includes input fields for the user's email, password, and confirm password, as well as a button to create an account. 
    The component also handles form validation to ensure that the email and password fields are not empty, that the password and confirm password fields match, and that the password meets a minimum length requirement. 
    If there are any errors during the sign-up process (e.g., email already in use), an error message is displayed on the screen.

    Key features:
    - Uses React state to manage form input values, error messages, and loading state during the sign-up process.
    - Validates user input to ensure that the email and password fields are not empty, that the password and confirm password fields match, and that the password meets a minimum length requirement.
    - Uses the signup function from the Firebase auth module to create a new user account, and navigates the user to the onboarding screen upon successful sign-up.
    - Provides user feedback by showing an error message if the sign-up fails, and a loading indicator while the sign-up request is in progress.
    - Includes a back button to navigate back to the login screen, and a footer with a link to the login screen for users who already have an account.

*/

// Imports
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from "react-native";
import { signup } from "../../firebase/auth";

// Signup component
export default function Signup() {
    // Router for navigation
    const router = useRouter();

    // State for form fields
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // State for error messages and loading state during signup process
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Handle the signup process when the user presses the "Create account" button
    const handleSignup = async () => {
        if (!email.trim() || !password.trim()) {
            setError("Please enter your email and password."); // Validate that email and password fields are not empty
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match."); // Validate that the password and confirm password fields match
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters."); // Validate that the password meets a minimum length requirement 
            return;
        }

        // Set loading state to true and set error to null before attempting to sign up
        setLoading(true);
        setError(null);

        // Attempt to sign up the user with the provided email and password using the signup function from firebase/auth.ts
        try {
            await signup(email, password);
            // If the signup is successful, navigate the user to the onboarding screen
        } catch (e: any) {
            // If there is an error during signup (e.g., email already in use), set the error state to the error message to display it on the screen
            setError(e.message);
            setLoading(false);
        }
    };

    // Render the signup form
    return (
        // Use KeyboardAvoidingView to ensure the keyboard does not cover input fields on iOS, and ScrollView to allow scrolling when the keyboard is open
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">

                {/* Back button */}
                <TouchableOpacity style={styles.backButton} onPress={() => router.replace("/(auth)/login")}>
                    <Text style={styles.backButtonText}>← Back to login</Text>
                </TouchableOpacity>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.appName}>CycleSense</Text>
                    <Text style={styles.tagline}>Track your cycle, know your body</Text>
                </View>

                {/* Card */}
                <View style={styles.card}>
                    <Text style={styles.title}>Create an account</Text>

                    {/* Show an error message if there is an error during signup */ }
                    {error && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* Email input field */ }
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

                    {/* Password input field */ }
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#ccc"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    {/* Confirm password input field */ }
                    <Text style={styles.label}>Confirm password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#ccc"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry // Hide the confirm password input for security
                    />

                    {/* Signup button */ }
                    <TouchableOpacity
                        style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                        onPress={handleSignup}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.signupButtonText}>Create account</Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.replace("/(auth)/login")}>
                        <Text style={styles.footerLink}>Sign in</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

// Styles
const styles = StyleSheet.create({

    // Container for the entire signup screen
    container: {
        flex: 1,
        backgroundColor: "#fff0f5",
    },

    // Inner container for the content of the signup screen
    inner: {
        flexGrow: 1,
        justifyContent: "center",
        padding: 24,
    },

    // Style for the back button at the top of the screen,
    backButton: {
        marginBottom: 16,
        alignSelf: "flex-start",
    },

    // Style for the text inside the back button
    backButtonText: {
        color: "#f06292",
        fontSize: 14,
        fontWeight: "600",
    },

    // Style for the header containing the app name and tagline
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

    // Style for the card containing the signup form    
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

    // Style for the title text at the top of the signup card
    title: {
        fontSize: 22,
        fontWeight: "700",
        color: "#333",
        marginBottom: 20,
    },

    // Style for the error message box that appears when there is an error during signup
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

    // Style for the label text above each input field in the signup form
    label: {
        fontSize: 13,
        fontWeight: "600",
        color: "#888",
        marginBottom: 6,
        marginTop: 12,
    },

    // Style for the input fields (email, password, confirm password) in the signup form
    input: {
        borderWidth: 1.5,
        borderColor: "#f0f0f0",
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: "#333",
        backgroundColor: "#fafafa",
    },

    // Style for the signup button
    signupButton: {
        backgroundColor: "#f06292",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
        marginTop: 24,
    },

    // Style for the signup button when it is disabled (e.g., during loading state)
    signupButtonDisabled: {
        opacity: 0.6,
    },

    // Style for the text inside the signup button
    signupButtonText: {
        color: "#fff",
        fontWeight: "700",
        fontSize: 16,
    },

    // Style for the footer section at the bottom of the signup screen
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
});
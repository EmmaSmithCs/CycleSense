// app/(auth)/_layout.tsx

/*
    This file defines the layout for the authentication flow of the app, which includes the login, signup, and onboarding screens.
    It uses Expo Router's Stack component to manage the navigation between these screens, and sets the header to be hidden for a cleaner look during the authentication process.

    Key features:
    - Uses Expo Router's Stack component to create a stack navigator for the authentication screens.
    - Hides the header for all screens in this stack to provide a more immersive experience during login, signup, and onboarding.
    
*/

// Imports
import { Stack } from "expo-router";
import React from "react";

// Auth layout component
export default function AuthLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="onboarding" />
        </Stack>
    );
}
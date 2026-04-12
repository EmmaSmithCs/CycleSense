// app/(auth)/_layout.tsx

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
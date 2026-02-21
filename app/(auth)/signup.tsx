// app/(auth)/signup.tsx

// Imports
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { signup } from "../../firebase/auth";

// Signup component
export default function Signup() {
    // Declare state variables
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Handle signup
    const handleSignup = async () => {
        try {
            await signup(email, password);
            router.replace("/(auth)/onboarding");
        } catch (e: any) {
            setError(e.message);
        }
    };

    // Render signup form
    return (
        // Signup form
        <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
             
            <Text>Sign Up!</Text>
            {error ? <Text style={{ color: "red" }}>{error}</Text> : null}

            <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                style={{ borderWidth: 1, marginVertical: 10, padding: 8 }}
            />

            <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={{ borderWidth: 1, marginVertical: 10, padding: 8 }}
            />  

            <Button title="Sign Up" onPress={handleSignup} />
        </View>
    );
}
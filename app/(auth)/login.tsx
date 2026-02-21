// app/(auth)/login.tsx

// Imports
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Button, Text, TextInput, View } from "react-native";
import { login } from "../../firebase/auth";

// Login component
export default function Login() {
    // Declare state variables
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Handle login
    const handleLogin = async () => {
        try {
            await login(email, password);
            router.replace("/(tabs)");
        } catch (e: any) {
            setError(e.message);
        }    
    };

    // Render login form
    return (
        // Login form
        <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
             
            <Text>Login!</Text>
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

            <Button title="Login" onPress={handleLogin} />
            <Button title="No Account?" onPress={() => router.replace("/(auth)/signup")} />
        </View>

    );
}
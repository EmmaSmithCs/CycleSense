// app/_layout.tsx
import { ThemeProvider } from '@/context/ThemeContext';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { auth, db } from "../firebase/config";

export default function RootLayout() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("Auth state changed:", firebaseUser?.email ?? "no user");
      setUser(firebaseUser);
      if (!firebaseUser) {
        setOnboarded(null);
        setLoading(false);
      }
    });
    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubscribeDoc = onSnapshot(doc(db, "users", user.uid), (snap) => {
      setOnboarded(snap.data()?.onboarded ?? false);
      setLoading(false);
    });

    return unsubscribeDoc;
  }, [user]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && !onboarded && segments[1] !== "onboarding") {
      router.replace("/(auth)/onboarding");
    } else if (user && onboarded && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, loading, onboarded, segments]);

  if (loading) {
    return null;
  }

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
      </Stack>
    </ThemeProvider>
  );
}

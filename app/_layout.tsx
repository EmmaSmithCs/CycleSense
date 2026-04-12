// _layout.tsx
import { GamificationProvider } from '@/context/GamificationContext';
import { ThemeProvider } from '@/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import * as LocalAuthentication from 'expo-local-authentication';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { auth, db } from '../firebase/config';

export default function RootLayout() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [onboarded, setOnboarded] = useState<boolean | null>(null);
    const [showBlur, setShowBlur] = useState(true);
    const isAuthenticating = useRef(false);
    const hasLaunchChecked = useRef(false);
    const prevAppState = useRef<string>('active');
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
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
        const unsubscribeDoc = onSnapshot(doc(db, 'users', user.uid), (snap) => {
            setOnboarded(snap.data()?.onboarded ?? false);
            setLoading(false);
        });
        return unsubscribeDoc;
    }, [user]);

    useEffect(() => {
        if (loading) return;
        const inAuthGroup = segments[0] === '(auth)';
        if (!user && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (user && !onboarded && segments[1] !== 'onboarding') {
            router.replace('/(auth)/onboarding');
        } else if (user && onboarded && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [user, loading, onboarded, segments]);

    // Run lock check only after loading+routing is done
    useEffect(() => {
        if (loading) return;
        if (hasLaunchChecked.current) return;
        hasLaunchChecked.current = true;
        triggerAppLock();
    }, [loading]);

    const triggerAppLock = async () => {
        if (isAuthenticating.current) return;
        const lock = await AsyncStorage.getItem('privacyAppLock');
        if (lock && JSON.parse(lock) === true) {
            isAuthenticating.current = true;
            try {
                const authResult = await LocalAuthentication.authenticateAsync({
                    promptMessage: 'Unlock CycleSense',
                    fallbackLabel: 'Enter passcode',
                });
                if (authResult.success) {
                    setShowBlur(false);
                } else {
                    router.replace('/(auth)/login');
                }
            } finally {
                isAuthenticating.current = false;
            }
        } else {
            setShowBlur(false);
        }
    };

    useEffect(() => {
        const sub = AppState.addEventListener('change', async (nextState) => {
            const prevState = prevAppState.current;
            prevAppState.current = nextState;

            const hideRaw = await AsyncStorage.getItem('privacyHideInSwitcher');
            const hideEnabled = hideRaw && JSON.parse(hideRaw) === true;

            const lockRaw = await AsyncStorage.getItem('privacyAppLock');
            const lockEnabled = lockRaw && JSON.parse(lockRaw) === true;

            // 🟡 ALWAYS show blur when leaving active
            if (nextState !== 'active') {
                if (hideEnabled) setShowBlur(true);
            }

            // 🟢 CRITICAL FIX: ALWAYS clear blur on active
            if (nextState === 'active') {
                setShowBlur(false);

                // 🔒 ONLY trigger lock when coming back from background
                if (prevState === 'background' && lockEnabled) {
                    await triggerAppLock();
                }
            }
        });

        return () => sub.remove();
    }, []);

    // Stack is ALWAYS rendered — expo-router requires this
    return (
        <ThemeProvider>
            <GamificationProvider>
                <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="(auth)" />
                </Stack>
                {showBlur && (
                    <View
                        style={{
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            backgroundColor: '#000', // 👈 THIS is key
                            zIndex: 999,
                        }}
                    >
                        <BlurView
                            intensity={100}
                            style={{
                                position: 'absolute',
                                width: '100%',
                                height: '100%',
                            }}
                        />
                    </View>
                )}
            </GamificationProvider>
        </ThemeProvider>
    );
}
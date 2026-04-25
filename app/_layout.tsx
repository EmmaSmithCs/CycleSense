// app/_layout.tsx

/*
    This file defines the root layout for the CycleSense app.
    It sets up the main providers for theme, date formatting, and gamification context,
    and handles global authentication state and routing logic.

    Key features:
    - Listens for Firebase authentication state changes to determine if a user is logged in.
    - Fetches the user's onboarding status from Firestore to determine if they need to complete onboarding.
    - Implements routing logic to direct users to the appropriate screens based on their auth and onboarding status.
    - Implements an app lock feature that uses Expo's Local Authentication to secure the app when it goes to the background.
    - Uses a BlurView to obscure the app's content when it's in the background, based on user settings.
    - Wraps the app in ThemeProvider, DateFormatProvider, and GamificationProvider to provide global context for these features.
    - Ensures that the app lock and blur features are only triggered when appropriate, and prevents multiple simultaneous authentication prompts.

*/

// Imports
import { DateFormatProvider } from '@/context/DateFormatContext';
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


// Root layout component
export default function RootLayout() {
    // State variables
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [onboarded, setOnboarded] = useState<boolean | null>(null);
    const [showBlur, setShowBlur] = useState(true);
    const [authReady, setAuthReady] = useState(false);
    const isAuthenticating = useRef(false);
    const hasLaunchChecked = useRef(false);
    const prevAppState = useRef<string>('active');
    const router = useRouter();
    const segments = useSegments();

    // Listen for auth and onboarded state changes
    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);

            if (!firebaseUser) {
                setOnboarded(null);
                setAuthReady(true);
                return;
            }

            setAuthReady(false);
            const unsubOnboarded = onSnapshot(doc(db, 'users', firebaseUser.uid), (doc) => {
                setOnboarded(doc.data()?.onboarded ?? false);
                setAuthReady(true);
            });

        });
        return unsubscribeAuth;
    }, []);
        
    // Routing logic
    useEffect(() => {
        if (!authReady) return; // Wait for auth state to be determined
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

    // App lock function
    const triggerAppLock = async () => {
        // Prevent multiple simultaneous auth prompts
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
                    setShowBlur(false); // Unlock successful
                } else {
                    router.replace('/(auth)/login'); // Force logout on failure or cancellation
                }
            } finally {
                isAuthenticating.current = false; // Reset flag regardless of outcome
            }
        } else {
            // If lock not enabled, ensure blur is off
            setShowBlur(false); 
        }
    };

    // App state change listener for blur and lock
    useEffect(() => {
        const sub = AppState.addEventListener('change', async (nextState) => {
            // Store previous state to determine if we're coming back from background
            const prevState = prevAppState.current;
            prevAppState.current = nextState;

            // Check user settings for blur and lock
            const hideRaw = await AsyncStorage.getItem('privacyHideInSwitcher');
            const hideEnabled = hideRaw && JSON.parse(hideRaw) === true;

            const lockRaw = await AsyncStorage.getItem('privacyAppLock');
            const lockEnabled = lockRaw && JSON.parse(lockRaw) === true;

            // ALWAYS show blur when leaving active
            if (nextState !== 'active') {
                if (hideEnabled) setShowBlur(true);
            }

            // ALWAYS clear blur on active
            if (nextState === 'active') {
                setShowBlur(false);

                // ONLY trigger lock when coming back from background
                if (prevState === 'background' && lockEnabled) {
                    await triggerAppLock();
                }
            }
        });

        // Cleanup listener on unmount
        return () => sub.remove();
    }, []);

    // Render stack navigator with providers
    return (
        <ThemeProvider>
            <DateFormatProvider>
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
                                backgroundColor: '#000',
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
            </DateFormatProvider>
        </ThemeProvider>
    );
}
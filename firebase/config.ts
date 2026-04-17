// app/firebase/config.ts

/*
    This file is responsible for initializing and configuring the Firebase services used in the app.
    It sets up the Firebase app, authentication, Firestore database, and storage services. 
    The configuration object contains the necessary keys and identifiers for connecting to the Firebase project. 
    The authentication service is configured to use React Native's AsyncStorage for persistence, ensuring that the user's authentication state is maintained across app restarts.

    Key features:
    - Initializes the Firebase app only if it hasn't been initialized already, preventing re-initialization errors.
    - Sets up Firebase Authentication with persistence using AsyncStorage, allowing users to stay logged in across app sessions.
    - Initializes Firestore for database operations and Firebase Storage for file storage needs.
    
*/

// Imports
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// @ts-ignore - direct path needed for Firebase v11 RN persistence
import { getReactNativePersistence } from "@firebase/auth/dist/rn/index.js";
import { getStorage } from "firebase/storage";

// Firebase configuration object containing keys and identifiers for the Firebase project
const firebaseConfig = {
  apiKey: "AIzaSyA_7pe4-1q9Qk0W4F2hqpW0UzDopxwvKu0",
  authDomain: "cyclesense-e8265.firebaseapp.com",
  projectId: "cyclesense-e8265",
  storageBucket: "cyclesense-e8265.firebasestorage.app",
  messagingSenderId: "982767411517",
  appId: "1:982767411517:web:b0aecd801ebcf2dccf2554",
};

// Initialize Firebase app, authentication, Firestore database, and storage services. The app is only initialized if it hasn't been already (to prevent re-initialization errors), and authentication is set up to use React Native's AsyncStorage for persistence.
const isNew = getApps().length === 0;
export const app = isNew ? initializeApp(firebaseConfig) : getApp();
export const auth = isNew
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  : getAuth(app);

export const db = getFirestore(app);
export const storage = getStorage(app);
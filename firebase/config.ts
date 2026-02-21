// app/firebase/config.ts

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth, inMemoryPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA_7pe4-1q9Qk0W4F2hqpW0UzDopxwvKu0",
  authDomain: "cyclesense-e8265.firebaseapp.com",
  projectId: "cyclesense-e8265",
  storageBucket: "cyclesense-e8265.appspot.com",
  messagingSenderId: "982767411517",
  appId: "1:982767411517:web:b0aecd801ebcf2dccf2554",
};

// Initialize Firebase app (reuse if exists)
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth properly for React Native
export const auth =
  getApps().length > 0
    ? getAuth(app) // already initialized
    : initializeAuth(app, {
        persistence: inMemoryPersistence, // temporary until we wire AsyncStorage manually
      });

// Firestore instance
export const db = getFirestore(app);

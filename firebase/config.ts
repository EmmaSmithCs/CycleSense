// app/firebase/config.ts

import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// @ts-ignore - direct path needed for Firebase v11 RN persistence
import { getReactNativePersistence } from "@firebase/auth/dist/rn/index.js";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyA_7pe4-1q9Qk0W4F2hqpW0UzDopxwvKu0",
  authDomain: "cyclesense-e8265.firebaseapp.com",
  projectId: "cyclesense-e8265",
  storageBucket: "cyclesense-e8265.firebasestorage.app",
  messagingSenderId: "982767411517",
  appId: "1:982767411517:web:b0aecd801ebcf2dccf2554",
};

const isNew = getApps().length === 0;
export const app = isNew ? initializeApp(firebaseConfig) : getApp();
export const auth = isNew
  ? initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    })
  : getAuth(app);

export const db = getFirestore(app);
export const storage = getStorage(app);
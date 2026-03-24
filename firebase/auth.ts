// app/firebase/auth.ts

// Imports
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    User
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./config";

// Sign up a new user
export async function signup(email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create a user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: serverTimestamp()
    });
    
    return userCredential.user;
}

// Login existing user
export async function login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

// Logout
export async function logout(): Promise<void> {
    await signOut(auth);
}
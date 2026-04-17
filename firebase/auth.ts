// app/firebase/auth.ts

/*
    This file contains functions for handling user authentication using Firebase Authentication.
    It provides functions for signing up new users, logging in existing users, and logging out users. 
    The signup function creates a new user with an email and password, and also creates a corresponding user document in Firestore to store additional user information. 
    The login function authenticates a user with their email and password, while the logout function signs the user out of the app.

    Key features:
    - Uses Firebase Authentication to manage user sign-up, login, and logout processes.
    - Creates a user document in Firestore upon successful sign-up to store additional user information such as email, creation timestamp, and onboarding status.
    - All functions are asynchronous and return Promises, allowing for easy integration with the app's UI and error handling.
    
*/

// Imports
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./config";

// Sign up a new user
export async function signup(email: string, password: string): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create a user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        createdAt: serverTimestamp(),
        onboarded: false,
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
// app/context/ThemeContext.tsx

/* 
    This file defines the ThemeContext and ThemeProvider for managing the app's theme state.
    It allows components to access the current theme and update it, with the selected theme being persisted in AsyncStorage for consistency across app restarts.

    Key features:
    - Defines a ThemeContext with the current theme object, theme name, and a function to update the theme.
    - Implements a ThemeProvider component that initializes the theme from AsyncStorage on mount and provides the theme context to its children.
    - Provides a custom hook, useTheme, for easy access to the theme context in functional components.
    - Supports multiple predefined themes defined in constants/theme.ts, allowing users to customize the app's appearance.
    
*/

// Imports
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, User } from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";
import { defaultTheme, Theme, ThemeName, themes } from "../constants/theme";
import { auth } from "../firebase/config";

// Type for the ThemeContext
type ThemeContextType = {
    theme: Theme; // The current theme object containing colors and styles
    themeName: ThemeName; // The name of the current theme, used for easy reference and storage
    setTheme: (name: ThemeName) => void; // Function to update the current theme by name, which also saves the selection to AsyncStorage for persistence across app restarts
};

// Create the ThemeContext with default values, including the default theme and a no-op function for setTheme
const ThemeContext = createContext<ThemeContextType>({
    theme: themes[defaultTheme],
    themeName: defaultTheme,
    setTheme: () => {},
});

// Theme key used for storing the selected theme in AsyncStorage, allowing the app to remember the user's theme choice across sessions
const themeKey = (uid: string | null) => `app_theme_${uid ?? "guest"}`;

// ThemeProvider component that wraps the app and provides the current theme and a function to update it through context. It initializes the theme from AsyncStorage on mount and updates AsyncStorage whenever the theme is changed.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    
    // State variable to hold the current theme name, initialized to the default theme and set the user
    const [themeName, setThemeName] = useState<ThemeName>(defaultTheme);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // On component mount, load the stored theme from AsyncStorage and set it as the current theme if it exists and is valid
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            const stored = await AsyncStorage.getItem(themeKey(user?.uid ?? null));
            if ( stored && stored in themes ) {
                setThemeName(stored as ThemeName);
            } else {
                setThemeName(defaultTheme);
            }
        });
        return () => unsubscribe();
    }, []);

    // Function to update the current theme by name, which also saves the selection to AsyncStorage for persistence across app restarts
    const setTheme = async (name: ThemeName) => {
        setThemeName(name);
        await AsyncStorage.setItem(themeKey(currentUser?.uid ?? null), name);
    };

    // Provide the current theme object, theme name, and setTheme function to the rest of the app through context
    return (
        <ThemeContext.Provider value={{ theme: themes[themeName], themeName, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}   

// Custom hook to access the ThemeContext, allowing components to easily consume the current theme and update function without needing to import useContext and ThemeContext separately
export const useTheme = () => useContext(ThemeContext);
// context/ThemeContext.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Theme, ThemeName, defaultTheme, themes } from "../constants/theme";


type ThemeContextType = {
    theme: Theme;
    themeName: ThemeName;
    setTheme: (name: ThemeName) => void;
};

const ThemeContext = createContext<ThemeContextType>({
    theme: themes[defaultTheme],
    themeName: defaultTheme,
    setTheme: () => {},
});

const THEME_KEY = "app_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [themeName, setThemeName] = useState<ThemeName>(defaultTheme);

    useEffect(() => {
        AsyncStorage.getItem(THEME_KEY).then((stored) => {
            if (stored && stored in themes) {
                setThemeName(stored as ThemeName);
            }
        });
    }, []);

    const setTheme = async (name: ThemeName) => {
        setThemeName(name);
        await AsyncStorage.setItem(THEME_KEY, name);
    };

    return (
        <ThemeContext.Provider value={{ theme: themes[themeName], themeName, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}   

export const useTheme = () => useContext(ThemeContext);


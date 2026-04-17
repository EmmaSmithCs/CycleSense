// app/constants/theme.ts

/*
    This file defines the themes available in the app, including their color schemes and metadata.
    It exports the Theme and ThemeName types, a record of predefined themes, and the default theme to be used when the app is first launched.

    Themes:
    - Pastel: A soft and calming theme with pinks and light colors.
    - Dark: A sleek and modern theme with deep grays and vibrant accents, designed for low-light environments.
    - Rose: A bold and energetic theme with vibrant pinks, celebrating femininity and self-expression.
    - Lavender: A soothing and elegant theme with soft purples, evoking calm and tranquility.
    - Mint: A refreshing and revitalizing theme with fresh greens, evoking growth and renewal.
    - Sunset: A cozy and uplifting theme with warm oranges, evoking the beauty of a sunset.

    Each theme includes a set of colors for various UI elements such as primary color, background, surface, text, borders, error states, tab bar, and specific card types (insight, intensity, prediction, phase).

    Key features:
    - Defines a structured Theme type that includes all necessary colors for consistent theming across the app.
    - Provides a record of predefined themes with unique color schemes and metadata (name, label, emoji).
    - Exports a default theme to ensure the app has a consistent look when first launched or when no theme is selected by the user.
    
*/

//Type for the name of a theme, which can be one of the predefined theme names
export type ThemeName = "pastel" | "dark" | "rose" | "lavender" | "mint" | "sunset";

//Type for the structure of a theme, which includes a name, label, emoji, and a set of colors used throughout the app
export type Theme = {
  name: ThemeName; // The unique identifier for the theme, which is one of the values defined in ThemeName
  label: string; // A human-readable label for the theme, used in the UI when allowing users to select a theme
  emoji: string; // An emoji representing the theme, used for visual identification in the theme selection UI
  colors: {
    primary: string; // The primary color used for key UI elements such as buttons and highlights
    primaryLight: string; // A lighter variant of the primary color, used for backgrounds or less prominent elements
    background: string; // The background color for the app, used for the main app background and surfaces
    surface: string; // The color used for surfaces such as cards and modals, providing contrast against the background
    card: string; // The color used specifically for card components, which may differ from the general surface color for better visual hierarchy
    text: string; // The main text color used for primary content and labels
    textSecondary: string; // A secondary text color used for less prominent text, such as hints or secondary information
    textMuted: string; // A muted text color used for disabled text or very low emphasis content
    border: string; // The color used for borders and dividers, providing separation between UI elements
    error: string; // The color used for error states, such as error messages or error indicators on form fields
    errorBackground: string; // The background color used for error messages or error states, providing a visual cue for errors
    tabBar: string; // The background color for the tab bar, which may differ from the general surface color for better visual distinction
    tabBarActive: string; // The color used for active tab icons and labels in the tab bar, providing a visual indication of the currently selected tab
    tabBarInactive: string; // The color used for inactive tab icons and labels in the tab bar, providing a visual distinction from the active tab
    cardInsight: string; // The color used for insight cards, which may represent insights or summaries of the user's data, providing a distinct visual style for these important cards
    cardInsightBorder: string; // The border color for insight cards, providing visual separation and emphasis for these important cards
    cardIntensity: string; // The color used for intensity cards, which may represent the intensity of symptoms or other tracked metrics
    cardIntensityBorder: string; // The border color for intensity cards, providing visual separation and emphasis for these specific cards
    cardPrediction: string; // The color used for prediction cards, which may represent predictions about the user's cycle or symptoms based on their logged data
    cardPredictionBorder: string; // The border color for prediction cards, providing visual separation and emphasis for these specific cards
    cardPhase: string; // The color used for phase cards, which may represent different phases of the user's cycle
    cardPhaseBorder: string; // The border color for phase cards, providing visual separation and emphasis for these specific cards
  };
};

// A record of predefined themes available in the app, where each key is a ThemeName and the value is a Theme object containing the details and colors for that theme
export const themes: Record<ThemeName, Theme> = {
    
    // The "pastel" theme, which features soft pinks and light colors for a gentle and calming aesthetic
    pastel: {
        name: "pastel",
        label: "Pastel",
        emoji: "🌸",
        colors: {
        primary: "#f06292",
        primaryLight: "#fce4ec",
        background: "#fffdf5",
        surface: "#fff8f0",
        card: "#ffffff",
        text: "#333333",
        textSecondary: "#666666",
        textMuted: "#aaaaaa",
        border: "#f0ece0",
        error: "#c62828",
        errorBackground: "#fce4ec",
        tabBar: "#ffffff",
        tabBarActive: "#f06292",
        tabBarInactive: "#cccccc",
        cardInsight: "#fce4ec",
        cardInsightBorder: "#e91e8c",
        cardIntensity: "#fff3e0",
        cardIntensityBorder: "#ef6c00",
        cardPrediction: "#e8eaf6",
        cardPredictionBorder: "#5c6cc0",
        cardPhase: "#e8f5e9",
        cardPhaseBorder: "#2e7d32",

        },
    },

    // The "dark" theme, which features deep grays and vibrant accent colors for a sleek and modern look that is easy on the eyes in low-light environments
    dark: {
        name: "dark",
        label: "Dark",
        emoji: "🌙",
        colors: {
        primary: "#f48fb1",
        primaryLight: "#2d1f25",
        background: "#121212",
        surface: "#1e1e1e",
        card: "#2a2a2a",
        text: "#f5f5f5",
        textSecondary: "#bbbbbb",
        textMuted: "#777777",
        border: "#333333",
        error: "#ef9a9a",
        errorBackground: "#2d1f1f",
        tabBar: "#1e1e1e",
        tabBarActive: "#f48fb1",
        tabBarInactive: "#555555",
        cardInsight: "#2d1f25",
        cardInsightBorder: "#f48fb1",
        cardIntensity: "#2d1f25",
        cardIntensityBorder: "#ffb74d",
        cardPrediction: "#0d1f2d",
        cardPredictionBorder: "#90caf9",
        cardPhase: "#0d2010",
        cardPhaseBorder: "#a5d6a7",
        },
    },

    // The "rose" theme, which features vibrant pinks and complementary colors for a bold and energetic aesthetic that celebrates femininity and self-expression
    rose: {
        name: "rose",
        label: "Rose",
        emoji: "🌹",
        colors: {
        primary: "#e91e63",
        primaryLight: "#fce4ec",
        background: "#fff5f7",
        surface: "#ffeef7",
        card: "#ffffff",
        text: "#2d0a14",
        textSecondary: "#6d3040",
        textMuted: "#b07080",
        border: "#f8bbd0",
        error: "#b71c1c",
        errorBackground: "#fce4ec",
        tabBar: "#ffffff",
        tabBarActive: "#e91e63",
        tabBarInactive: "#cccccc",
        cardInsight: "#fce4ec",
        cardInsightBorder: "#f48fb1",
        cardIntensity: "#ffcdd2",
        cardIntensityBorder: "#e57373",
        cardPrediction: "#f8bbd0",
        cardPredictionBorder: "#f06292",
        cardPhase: "#fce4ec",
        cardPhaseBorder: "#e91e63",
        },
    },

    // The "lavender" theme, which features soft purples and complementary colors for a soothing and elegant aesthetic that evokes a sense of calm and tranquility
    lavender: {
        name: "lavender",
        label: "Lavender",
        emoji: "💜",
        colors: {
            primary: "#9c27b0",
            primaryLight: "#f3e5f5",
            background: "#fdf5ff",
            surface: "#f9f0ff",
            card: "#ffffff",
            text: "#1a0a2e",
            textSecondary: "#5e3570",
            textMuted: "#9e7aae",
            border: "#e1bee7",
            error: "#c62828",
            errorBackground: "#fce4ec",
            tabBar: "#ffffff",
            tabBarActive: "#9c27b0",
            tabBarInactive: "#cccccc",
            cardInsight: "#f3e5f5",
            cardInsightBorder: "#ce93d8",
            cardIntensity: "#ede7f6",
            cardIntensityBorder: "#b39ddb",
            cardPrediction: "#e8eaf6",
            cardPredictionBorder: "#9fa8da",
            cardPhase: "#f3e5f5",
            cardPhaseBorder: "#9c27b0",
            },
        },
    
        // The "mint" theme, which features fresh greens and complementary colors for a refreshing and revitalizing aesthetic that evokes a sense of growth and renewal
        mint: {
        name: "mint",
        label: "Mint",
        emoji: "🌿",
        colors: {
            primary: "#26a69a",
            primaryLight: "#e0f2f1",
            background: "#f5fffd",
            surface: "#edfaf8",
            card: "#ffffff",
            text: "#0a2420",
            textSecondary: "#2e6b65",
            textMuted: "#7aaeaa",
            border: "#b2dfdb",
            error: "#c62828",
            errorBackground: "#fce4ec",
            tabBar: "#ffffff",
            tabBarActive: "#26a69a",
            tabBarInactive: "#cccccc",
            cardInsight: "#e0f2f1",
            cardInsightBorder: "#80cbc4",
            cardIntensity: "#e8f5e9",
            cardIntensityBorder: "#a5d6a7",
            cardPrediction: "#b2dfdb",
            cardPredictionBorder: "#4db6ac",
            cardPhase: "#e0f2f1",
            cardPhaseBorder: "#26a69a",
            },
        },

        // The "sunset" theme, which features warm oranges and complementary colors for a cozy and uplifting aesthetic that evokes the beauty and warmth of a sunset
        sunset: {
        name: "sunset",
        label: "Sunset",
        emoji: "🌅",
        colors: {
            primary: "#ff7043",
            primaryLight: "#fbe9e7",
            background: "#fffaf5",
            surface: "#fff3e0",
            card: "#ffffff",
            text: "#2d1200",
            textSecondary: "#6b3d1a",
            textMuted: "#ae8060",
            border: "#ffe0b2",
            error: "#c62828",
            errorBackground: "#fce4ec",
            tabBar: "#ffffff",
            tabBarActive: "#ff7043",
            tabBarInactive: "#cccccc",
            cardInsight: "#fbe9e7",
            cardInsightBorder: "#ff8a65",
            cardIntensity: "#fff3e0",
            cardIntensityBorder: "#ff7043",
            cardPrediction: "#fbe9e7",
            cardPredictionBorder: "#ff5722",
            cardPhase: "#fff8e1",
            cardPhaseBorder: "#ffca28",
        },
    },
};

// The default theme to be used when the app is first launched or when the user has not selected a theme, set to "pastel" for a gentle and calming aesthetic
export const defaultTheme = "pastel";
export type ThemeName = "pastel" | "dark" | "rose" | "lavender" | "mint" | "sunset";

export type Theme = {
  name: ThemeName;
  label: string;
  emoji: string;
  colors: {
    primary: string;
    primaryLight: string;
    background: string;
    surface: string;
    card: string;
    text: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    error: string;
    errorBackground: string;
    tabBar: string;
    tabBarActive: string;
    tabBarInactive: string;
    cardInsight: string;
    cardInsightBorder: string;
    cardIntensity: string;
    cardIntensityBorder: string;
    cardPrediction: string;
    cardPredictionBorder: string;
    cardPhase: string;
    cardPhaseBorder: string;

  };
};

export const themes: Record<ThemeName, Theme> = {
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

export const defaultTheme = "pastel";


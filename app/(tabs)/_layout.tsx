// app/(tabs)/_layout.tsx

/*
    This file defines the main tab layout for the app, which includes the Log, History, Insights, Profile, and Settings tabs.
    It uses Expo Router's Tabs component to create a bottom tab navigator, and applies custom styles and icons for each tab.

    Tab Explanation:
    - Log (index): The main screen where users can log their period and symptoms.
    - History: A screen that shows the user's past logs in a calendar or list format.
    - Insights: A screen that provides visualizations and insights based on the user's logged data.
    - Profile: A screen where users can view and edit their profile information.
    - Settings: A screen where users can adjust app settings, preferences, and access support.

    Key features:
    - Uses Expo Router's Tabs component to create a tab navigator for the main sections of the app.
    - Customizes the appearance of the tab bar with colors from the theme context, and applies a background highlight to the active tab.
    - Hides the header for all tabs to provide a cleaner look.
    - Uses a custom HapticTab component for the tab buttons to provide haptic feedback on press.
    - Defines custom icons for each tab using the IconSymbol component, and changes the background of the icon when the tab is active for better visual feedback.

*/

// Imports
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/context/ThemeContext';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
 
// Main tab layout component
export default function TabLayout() {

    // Get theme colors from context
    const { theme } = useTheme();
    const c = theme.colors;

    // Render the tab navigator with custom styles and icons for each tab
    return (
        <Tabs
        // Custom screen options for the tab navigator, including styles and icons
        screenOptions={{
            tabBarActiveTintColor: c.tabBarActive,
            tabBarInactiveTintColor: c.tabBarInactive,
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarShowLabel: false,
            tabBarStyle: {
                backgroundColor: c.tabBar,
                borderTopWidth: 0.5,
                borderTopColor: c.tabBarActive + '22',
                height: Platform.OS === 'ios' ? 82 : 64,
                paddingBottom: Platform.OS === 'ios' ? 24 : 8,
                paddingTop: 8,
                elevation: 0,
                shadowOpacity: 0,
            },
            tabBarIconStyle: {
                marginTop: 4,
            },
        }}>

            {/* Define each tab screen with its respective icon and title */ }

            {/* Log tab */ }
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Log',
                    tabBarIcon: ({color, focused }) => (
                    <View style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 44,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: focused ? c.tabBarActive + '18' : 'transparent',
                    }}>
                        <IconSymbol size={24} name="drop.fill" color={color} /> 
                    </View>
                ),
                }}
            />

            {/* History tab */ }
            <Tabs.Screen
                name="history"
                options={{
                    title: 'History',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 44,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: focused ? c.tabBarActive + '18' : 'transparent',
                        }}>
                            <IconSymbol size={24} name="calendar" color={color} /> 
                        </View>
                    ),
                
                }}
            />

            {/* Insights tab */ }
            <Tabs.Screen
                name="insights"
                options={{
                title: 'Insights',
                tabBarIcon: ({ color, focused }) => (
                    <View style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 44,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: focused ? c.tabBarActive + '18' : 'transparent',
                    }}>
                        <IconSymbol size={28} name="chart.bar.fill" color={color} /> 
                    </View>
                ),
                }}
            />

            {/* Profile tab */ }
            <Tabs.Screen
                name="profile"
                options={{
                title: 'Profile',
                tabBarIcon: ({ color, focused }) => (
                    <View style={{
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 44,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: focused ? c.tabBarActive + '18' : 'transparent',
                    }}>
                        <IconSymbol size={28} name="person.fill" color={color} /> 
                    </View>
                ),
                }}
            />

            {/* Settings tab */ }
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 44,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: focused ? c.tabBarActive + '18' : 'transparent',
                        }}>
                            <IconSymbol size={28} name="gearshape.fill" color={color} /> 
                        </View>
                    ),
                }}
            />
        </Tabs>
    );
}

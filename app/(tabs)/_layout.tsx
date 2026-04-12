import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';

import { useTheme } from '@/context/ThemeContext';
 

export default function TabLayout() {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Tabs
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

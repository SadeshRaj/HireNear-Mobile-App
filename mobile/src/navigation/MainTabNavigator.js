import React, { useState, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; // Added
import AsyncStorage from '@react-native-async-storage/async-storage'; // Added

import DashboardScreen from '../screens/DashboardScreen';
import MyJobPostsScreen from '../screens/MyJobPostsScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import ViewWorkProofScreen from '../screens/ViewWorkProofScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

function BookingsStack({ route }) {
    const { user } = route.params || {};
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="SchedulesList"
                component={MyBookingsScreen}
                initialParams={{ user }}
            />
            <Stack.Screen
                name="ViewWorkProof"
                component={ViewWorkProofScreen}
                options={{
                    headerShown: true,
                    title: 'Work Completion Proof',
                    headerBackTitle: 'Back'
                }}
            />
        </Stack.Navigator>
    );
}

export default function MainTabNavigator({ route }) {
    const { user } = route?.params || {};
    // 1. New state to hold the notification count
    const [bookingNoticeCount, setBookingNoticeCount] = useState(0);

    // 2. Fetch bookings to see if any are 'completed' (waiting for client review)
    useFocusEffect(
        useCallback(() => {
            const checkCompletions = async () => {
                try {
                    const token = await AsyncStorage.getItem('token');
                    // Ensure this URL matches your client bookings endpoint
                    const res = await fetch(`${API_BASE_URL}/bookings/my-history`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();

                    if (Array.isArray(data)) {
                        // Count bookings where status is 'completed' (Proof sent by worker)
                        const count = data.filter(b => b.status === 'completed').length;
                        setBookingNoticeCount(count);
                    }
                } catch (err) {
                    console.log("Badge fetch error:", err);
                }
            };
            checkCompletions();
        }, [])
    );

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Home') iconName = 'home';
                    else if (route.name === 'My Posts') iconName = 'briefcase';
                    else if (route.name === 'Bookings') iconName = 'calendar';
                    if (!focused) iconName += '-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#0f172a',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: { height: 70, paddingBottom: 10, paddingTop: 10 },
            })}
        >
            <Tab.Screen
                name="Home"
                component={DashboardScreen}
                initialParams={{ user }}
            />
            <Tab.Screen
                name="My Posts"
                component={MyJobPostsScreen}
                initialParams={{ user, userId: user?._id || user?.id }}
            />

            <Tab.Screen
                name="Bookings"
                component={BookingsStack}
                initialParams={{ user }}
                // 3. Apply the notification badge here
                options={{
                    tabBarBadge: bookingNoticeCount > 0 ? bookingNoticeCount : null,
                    tabBarBadgeStyle: { backgroundColor: '#ef4444', color: 'white' }
                }}
                // 4. Optional: Clear badge when the user clicks the tab
                listeners={{
                    tabPress: () => setBookingNoticeCount(0),
                }}
            />
        </Tab.Navigator>
    );
}
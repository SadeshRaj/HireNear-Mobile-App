import React, { useState, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import WorkerDashboardScreen from '../screens/Worker/WorkerDashboardScreen';
import MyBidsScreen from '../screens/Worker/MyBidsScreen';
// NEW SCREENS
import WorkerActiveJobsScreen from '../screens/Worker/WorkerActiveJobsScreen';
import EarningsScreen from '../screens/Worker/EarningsScreen';

const Tab = createBottomTabNavigator();
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function WorkerTabNavigator({ route }) {
    const { user } = route?.params || {};
    const [activeJobsCount, setActiveJobsCount] = useState(0);

    // Fetch active bookings continuously to keep the badge updated
    useFocusEffect(
        useCallback(() => {
            const fetchActiveBookings = async () => {
                try {
                    const token = await AsyncStorage.getItem('token');
                    const res = await fetch(`${API_BASE_URL}/bookings/worker`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();

                    if (data.success && Array.isArray(data.bookings)) {
                        // Count jobs that the worker needs to act on (scheduled or in-progress)
                        const active = data.bookings.filter(b => b.status === 'scheduled' || b.status === 'in-progress');
                        setActiveJobsCount(active.length);
                    }
                } catch (err) {
                    console.log("Error fetching badge count", err);
                }
            };
            fetchActiveBookings();
        }, [])
    );

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    const icons = {
                        'Browse Jobs': focused ? 'search' : 'search-outline',
                        'My Bids': focused ? 'document-text' : 'document-text-outline',
                        'Active Jobs': focused ? 'hammer' : 'hammer-outline',
                        'Earnings': focused ? 'wallet' : 'wallet-outline',
                    };
                    return <Ionicons name={icons[route.name]} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#0f172a',
                tabBarInactiveTintColor: '#94a3b8',
                tabBarStyle: {
                    height: 70,
                    paddingBottom: 10,
                    paddingTop: 10,
                    borderTopColor: '#f1f5f9',
                },
                tabBarLabelStyle: {
                    // Slightly smaller font so 4 tabs fit nicely
                    fontSize: 10,
                    fontWeight: '600',
                },
            })}
        >
            <Tab.Screen
                name="Browse Jobs"
                component={WorkerDashboardScreen}
                initialParams={{ user }}
            />
            <Tab.Screen
                name="My Bids"
                component={MyBidsScreen}
            />
            <Tab.Screen
                name="Active Jobs"
                component={WorkerActiveJobsScreen}
                options={{
                    // Notification badge logic
                    tabBarBadge: activeJobsCount > 0 ? activeJobsCount : null,
                    tabBarBadgeStyle: { backgroundColor: '#ef4444', color: 'white' }
                }}
            />
            <Tab.Screen
                name="Earnings"
                component={EarningsScreen}
            />
        </Tab.Navigator>
    );
}
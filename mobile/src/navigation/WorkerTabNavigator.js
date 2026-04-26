import React, { useState, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import WorkerDashboardScreen from '../screens/WorkerDashboardScreen';
import MyBidsScreen from '../screens/MyBidsScreen';
import SchedulesScreen from '../screens/SchedulesScreen';
import WorkerActiveJobsScreen from '../screens/WorkerActiveJobsScreen';
import EarningsScreen from '../screens/EarningsScreen';

const Tab = createBottomTabNavigator();
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function WorkerTabNavigator({ route }) {
    const { user } = route?.params || {};
    const [activeJobsCount, setActiveJobsCount] = useState(0);
    // 1. ADDED: State for Schedules Badge
    const [scheduleCount, setScheduleCount] = useState(0);

    useFocusEffect(
        useCallback(() => {
            const fetchBadgeCounts = async () => {
                try {
                    const token = await AsyncStorage.getItem('token');
                    const res = await fetch(`${API_BASE_URL}/bookings/worker`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();

                    if (data.success && Array.isArray(data.bookings)) {
                        // 2. LOGIC: Count for Active Jobs (In-Progress)
                        const active = data.bookings.filter(b => b.status === 'in-progress');
                        setActiveJobsCount(active.length);

                        // 3. LOGIC: Count for Schedules (Newly accepted 'scheduled' jobs)
                        const scheduled = data.bookings.filter(b => b.status === 'scheduled');
                        setScheduleCount(scheduled.length);
                    }
                } catch (err) {
                    console.log("Error fetching badge counts", err);
                }
            };
            fetchBadgeCounts();
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
                        'Schedules': focused ? 'calendar' : 'calendar-outline',
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
                tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
            })}
        >
            <Tab.Screen name="Browse Jobs" component={WorkerDashboardScreen} initialParams={{ user }} />
            <Tab.Screen name="My Bids" component={MyBidsScreen} />

            <Tab.Screen
                name="Active Jobs"
                component={WorkerActiveJobsScreen}
                options={{
                    tabBarBadge: activeJobsCount > 0 ? activeJobsCount : null,
                    tabBarBadgeStyle: { backgroundColor: '#ef4444', color: 'white' }
                }}
            />

            {/* 4. UPDATED: Added badge to Schedules */}
            <Tab.Screen
                name="Schedules"
                component={SchedulesScreen}
                initialParams={{ user }}
                options={{
                    tabBarBadge: scheduleCount > 0 ? scheduleCount : null,
                    tabBarBadgeStyle: { backgroundColor: '#ef4444', color: 'white' }
                }}
            />

            <Tab.Screen name="Earnings" component={EarningsScreen} />
        </Tab.Navigator>
    );
}
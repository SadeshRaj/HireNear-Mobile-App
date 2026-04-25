import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack'; // Need this
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from '../screens/DashboardScreen';
import MyJobPostsScreen from '../screens/MyJobPostsScreen';
import MyBookingsScreen from '../screens/MyBookingsScreen';
import ViewWorkProofScreen from '../screens/ViewWorkProofScreen'; // Import your proof screen

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// 1. Create a Stack for the Bookings Tab
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
            {/* 2. Point the Bookings Tab to the Stack instead of the single Screen */}
            <Tab.Screen
                name="Bookings"
                component={BookingsStack}
                initialParams={{ user }}
            />
        </Tab.Navigator>
    );
}
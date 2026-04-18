import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import WorkerDashboardScreen from '../screens/WorkerDashboardScreen';
import MyBidsScreen from '../screens/MyBidsScreen';

const Tab = createBottomTabNavigator();

export default function WorkerTabNavigator({ route }) {
    const { user } = route?.params || {};

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    const icons = {
                        'Browse Jobs': focused ? 'search' : 'search-outline',
                        'My Bids': focused ? 'document-text' : 'document-text-outline',
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
                    fontSize: 12,
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
        </Tab.Navigator>
    );
}

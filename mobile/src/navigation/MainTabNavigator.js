import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import your screens (we use ../screens because this file is inside the navigation folder)
import DashboardScreen from '../screens/Client/DashboardScreen';
import MyJobPostsScreen from '../screens/Client/MyJobPostsScreen';
import ChatListScreen from '../screens/Client/ChatListScreen'; // Create this file next

const Tab = createBottomTabNavigator();

export default function MainTabNavigator({ route }) {
    // Safely extract the user passed from the Login screen
    const { user } = route?.params || {};

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName = route.name === 'Home' ? 'home' : 'briefcase';
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
                name="Messages"
                component={ChatListScreen}
                initialParams={{ user }} // Pass user so we have the userId
                options={{
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons
                            name={focused ? "chatbubbles" : "chatbubbles-outline"}
                            size={size}
                            color={color}
                        />
                    ),
                }}
            />

        </Tab.Navigator>
    );
}
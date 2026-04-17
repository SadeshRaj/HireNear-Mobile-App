import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Screens
import LoginScreen from '../screens/LoginScreen';
import ClientRegisterScreen from '../screens/ClientRegisterScreen';
import WorkerRegisterScreen from '../screens/WorkerRegisterScreen';
import VerifyOTPScreen from '../screens/VerifyOTPScreen';
import CreateJobScreen from '../screens/CreateJobScreen'; // <-- 1. Import new screen

// Tab Navigator
import MainTabNavigator from './MainTabNavigator'; // <-- 2. Import your Tab Navigator

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
            {/* Auth Flow */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={ClientRegisterScreen} />
            <Stack.Screen name="WorkerRegister" component={WorkerRegisterScreen} />
            <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />

            {/* Main App Flow */}
            {/* Note: We keep the name "Dashboard" so your Login screen doesn't break,
                but we pass it the Tab Navigator instead of just the single screen! */}
            <Stack.Screen name="Dashboard" component={MainTabNavigator} />

            {/* Add the Create Job screen so it pops up over the tabs */}
            <Stack.Screen name="CreateJob" component={CreateJobScreen} />
        </Stack.Navigator>
    );
}
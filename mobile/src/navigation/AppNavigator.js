import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import ClientRegisterScreen from '../screens/ClientRegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import WorkerRegisterScreen from '../screens/WorkerRegisterScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={ClientRegisterScreen} />
            <Stack.Screen name="WorkerRegister" component={WorkerRegisterScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
        </Stack.Navigator>
    );
}
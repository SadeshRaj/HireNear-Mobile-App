import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import JobBidsScreen from '../screens/JobBidsScreen';

// Auth screens
import LoginScreen from '../screens/LoginScreen';
import ClientRegisterScreen from '../screens/ClientRegisterScreen';
import WorkerRegisterScreen from '../screens/WorkerRegisterScreen';
import VerifyOTPScreen from '../screens/VerifyOTPScreen';

// Navigators
import MainTabNavigator from './MainTabNavigator';
import WorkerTabNavigator from './WorkerTabNavigator';

// Job & Bidding Screens
import CreateJobScreen from '../screens/CreateJobScreen';
import SubmitBidScreen from '../screens/SubmitBidScreen';
import BidListScreen from '../screens/BidListScreen';
import MyBidsScreen from '../screens/MyBidsScreen';
import EditBidScreen from '../screens/EditBidScreen';

// Portfolio Screen
import WorkerPortfolioScreen from '../screens/WorkerPortfolioScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const [isLoading, setIsLoading] = useState(true);
    const [initialRoute, setInitialRoute] = useState('Login');
    const [initialParams, setInitialParams] = useState(null);

    useEffect(() => {
        const checkLoginState = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const userJson = await AsyncStorage.getItem('user');
                const rememberMe = await AsyncStorage.getItem('rememberMe');

                if (token && userJson) {
                    if (rememberMe === 'true') {
                        const user = JSON.parse(userJson);
                        setInitialParams({ user });
                        if (user.role === 'Worker') {
                            setInitialRoute('WorkerDashboard');
                        } else {
                            setInitialRoute('Dashboard');
                        }
                    } else {
                        await AsyncStorage.multiRemove(['token', 'user', 'rememberMe']);
                    }
                }
            } catch (error) {
                console.error("Failed to check login state", error);
            } finally {
                setIsLoading(false);
            }
        };
        checkLoginState();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB' }}>
                <ActivityIndicator size="large" color="#0f172a" />
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={ClientRegisterScreen} />
            <Stack.Screen name="WorkerRegister" component={WorkerRegisterScreen} />
            <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />

            <Stack.Screen name="Dashboard" component={MainTabNavigator} initialParams={initialParams} />
            <Stack.Screen name="CreateJob" component={CreateJobScreen} />

            <Stack.Screen name="WorkerDashboard" component={WorkerTabNavigator} initialParams={initialParams} />

            <Stack.Screen name="SubmitBid" component={SubmitBidScreen} />
            <Stack.Screen name="BidList" component={BidListScreen} />
            <Stack.Screen name="MyBids" component={MyBidsScreen} />
            <Stack.Screen name="EditBid" component={EditBidScreen} />
            <Stack.Screen name="JobBids" component={JobBidsScreen} />

            {/* Portfolio Implementation */}
            <Stack.Screen name="WorkerPortfolio" component={WorkerPortfolioScreen} />
        </Stack.Navigator>
    );
}
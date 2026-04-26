import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import JobBidsScreen from '../screens/JobBidsScreen';
import BookingDetailsScreen from '../screens/BookingDetailsScreen';
import WorkerBookingDetailsScreen from '../screens/WorkerBookingDetailsScreen';

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

// --- MERGED SECTION: BOOKING  & INVOICE (TEAM) ---
import MyBookingsScreen from '../screens/MyBookingsScreen';
import CompleteJobScreen from '../screens/CompleteJobScreen';
import SchedulesScreen from '../screens/SchedulesScreen';
import ViewWorkProofScreen from '../screens/ViewWorkProofScreen';
import CreateInvoiceScreen from '../screens/CreateInvoiceScreen';
import InvoiceDetailsScreen from '../screens/InvoiceDetailsScreen';
// -------------------------------------------------------

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const [isLoading, setIsLoading] = useState(true);
    const [initialRoute, setInitialRoute] = useState('Login');
    const [user, setUser] = useState(null);

    useEffect(() => {
        const checkLoginState = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const userJson = await AsyncStorage.getItem('user');
                const rememberMe = await AsyncStorage.getItem('rememberMe');

                if (token && userJson && rememberMe === 'true') {
                    const userData = JSON.parse(userJson);
                    setUser(userData);
                    setInitialRoute(userData.role === 'Worker' ? 'WorkerDashboard' : 'Dashboard');
                } else if (rememberMe !== 'true') {
                    await AsyncStorage.multiRemove(['token', 'user', 'rememberMe']);
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
            {/* Auth Flow */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={ClientRegisterScreen} />
            <Stack.Screen name="WorkerRegister" component={WorkerRegisterScreen} />
            <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />

            {/* Tab Navigators */}
            <Stack.Screen name="Dashboard" component={MainTabNavigator} initialParams={{ user }} />
            <Stack.Screen name="WorkerDashboard" component={WorkerTabNavigator} initialParams={{ user }} />

            {/* Job Flow */}
            <Stack.Screen name="CreateJob" component={CreateJobScreen} />
            <Stack.Screen name="SubmitBid" component={SubmitBidScreen} />
            <Stack.Screen name="BidList" component={BidListScreen} />
            <Stack.Screen name="MyBids" component={MyBidsScreen} />
            <Stack.Screen name="EditBid" component={EditBidScreen} />
            <Stack.Screen name="JobBids" component={JobBidsScreen} />

            {/* Booking Flow */}
            <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
            <Stack.Screen name="WorkerBookingDetails" component={WorkerBookingDetailsScreen} />
            <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
            <Stack.Screen name="CompleteJob" component={CompleteJobScreen} />
            <Stack.Screen name="Schedules" component={SchedulesScreen} />

            {/* View Work Proof (The fix we did) */}
            <Stack.Screen
                name="ViewWorkProof"
                component={ViewWorkProofScreen}
                options={{ headerShown: false, presentation: 'modal' }}
            />

            {/* Portfolio & Invoices (Team Updates) */}
            <Stack.Screen name="WorkerPortfolio" component={WorkerPortfolioScreen} />
            <Stack.Screen name="CreateInvoice" component={CreateInvoiceScreen} />
            <Stack.Screen name="InvoiceDetails" component={InvoiceDetailsScreen} />
        </Stack.Navigator>
    );
}
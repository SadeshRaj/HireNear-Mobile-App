import React, { useState, useEffect, useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import JobBidsScreen from '../screens/Client/JobBidsScreen';
import BidDetailScreen from '../screens/Client/BidDetailScreen';
import BookingDetailsScreen from '../screens/Client/BookingDetailsScreen';
import WorkerBookingDetailsScreen from '../screens/Worker/WorkerBookingDetailsScreen';
import ChatScreen from '../screens/ChatScreen';
import SupportChatScreen from '../screens/SupportChatScreen';
import AddReviewScreen from "../screens/Client/AddReviewScreen";

// Auth screens
import LoginScreen from '../screens/LoginScreen';
import ClientRegisterScreen from '../screens/Client/ClientRegisterScreen';
import WorkerRegisterScreen from '../screens/Worker/WorkerRegisterScreen';
import VerifyOTPScreen from '../screens/VerifyOTPScreen';

// Navigators
import MainTabNavigator from './MainTabNavigator';
import WorkerTabNavigator from './WorkerTabNavigator';

// Job & Bidding Screens
import CreateJobScreen from '../screens/Client/CreateJobScreen';
import SubmitBidScreen from '../screens/Worker/SubmitBidScreen';
import BidListScreen from '../screens/Client/BidListScreen';
import MyBidsScreen from '../screens/Worker/MyBidsScreen';
import EditBidScreen from '../screens/Worker/EditBidScreen';

// Portfolio Screen
import WorkerPortfolioScreen from '../screens/Worker/WorkerPortfolioScreen';
//invoice
import CreateInvoiceScreen from '../screens/Worker/CreateInvoiceScreen';
import InvoiceDetailsScreen from '../screens/Client/InvoiceDetailsScreen';

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
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F9FB'}}>
                <ActivityIndicator size="large" color="#0f172a"/>
            </View>
        );
    }

    return (
        <Stack.Navigator screenOptions={{headerShown: false}} initialRouteName={initialRoute}>
            <Stack.Screen name="Login" component={LoginScreen}/>
            <Stack.Screen name="Register" component={ClientRegisterScreen}/>
            <Stack.Screen name="WorkerRegister" component={WorkerRegisterScreen}/>
            <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen}/>

            <Stack.Screen name="Dashboard" component={MainTabNavigator} initialParams={{user}}/>
            <Stack.Screen name="CreateJob" component={CreateJobScreen}/>

            <Stack.Screen name="WorkerDashboard" component={WorkerTabNavigator} initialParams={{user}}/>

            <Stack.Screen name="SubmitBid" component={SubmitBidScreen}/>
            <Stack.Screen name="BidList" component={BidListScreen}/>
            <Stack.Screen name="MyBids" component={MyBidsScreen}/>
            <Stack.Screen name="EditBid" component={EditBidScreen}/>
            <Stack.Screen name="JobBids" component={JobBidsScreen}/>

            <Stack.Screen name="BookingDetails" component={BookingDetailsScreen}/>
            <Stack.Screen name="WorkerBookingDetails" component={WorkerBookingDetailsScreen}/>

            <Stack.Screen name="WorkerPortfolio" component={WorkerPortfolioScreen}/>
            <Stack.Screen name="Chat" component={ChatScreen}/>
            <Stack.Screen name="SupportChat" component={SupportChatScreen}/>

            {/* Updated Invoice Screens */}
            <Stack.Screen name="CreateInvoice" component={CreateInvoiceScreen}/>
            <Stack.Screen name="InvoiceDetails" component={InvoiceDetailsScreen}/>

            <Stack.Screen name="BidDetail" component={BidDetailScreen}/>
            <Stack.Screen name="AddReview" component={AddReviewScreen}/>
        </Stack.Navigator>
    );
}
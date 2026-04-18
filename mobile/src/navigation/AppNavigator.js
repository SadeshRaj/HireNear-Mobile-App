import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth screens
import LoginScreen from '../screens/LoginScreen';
import ClientRegisterScreen from '../screens/ClientRegisterScreen';
import WorkerRegisterScreen from '../screens/WorkerRegisterScreen';
import VerifyOTPScreen from '../screens/VerifyOTPScreen';

// Client tab navigator (teammate's — Home + My Posts)
import MainTabNavigator from './MainTabNavigator';

// Worker tab navigator (yours — Browse Jobs + My Bids)
import WorkerTabNavigator from './WorkerTabNavigator';

// Job creation screen (teammate's, opens over client tabs)
import CreateJobScreen from '../screens/CreateJobScreen';

// ── Bidding & Proposal System (your part) ────────────────────────────────────
import SubmitBidScreen from '../screens/SubmitBidScreen';
import BidListScreen from '../screens/BidListScreen';
import MyBidsScreen from '../screens/MyBidsScreen';
import EditBidScreen from '../screens/EditBidScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">

            {/* ── Auth Flow ────────────────────────────────────────────────── */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={ClientRegisterScreen} />
            <Stack.Screen name="WorkerRegister" component={WorkerRegisterScreen} />
            <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />

            {/* ── Client app (teammate's tab navigator) ────────────────────── */}
            <Stack.Screen name="Dashboard" component={MainTabNavigator} />
            <Stack.Screen name="CreateJob" component={CreateJobScreen} />

            {/* ── Worker app (your tab navigator) ──────────────────────────── */}
            <Stack.Screen name="WorkerDashboard" component={WorkerTabNavigator} />

            {/* ── Bidding screens (navigate from both dashboards) ───────────── */}
            <Stack.Screen name="SubmitBid" component={SubmitBidScreen} />
            <Stack.Screen name="BidList" component={BidListScreen} />
            <Stack.Screen name="MyBids" component={MyBidsScreen} />
            <Stack.Screen name="EditBid" component={EditBidScreen} />

        </Stack.Navigator>
    );
}
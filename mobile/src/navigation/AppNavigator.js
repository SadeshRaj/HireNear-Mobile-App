import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Auth screens
import LoginScreen from '../screens/LoginScreen';
import ClientRegisterScreen from '../screens/ClientRegisterScreen';
import WorkerRegisterScreen from '../screens/WorkerRegisterScreen';
import VerifyOTPScreen from '../screens/VerifyOTPScreen';

// Main tab navigator (from teammate)
import MainTabNavigator from './MainTabNavigator';

// Client job posting screens (yours)
import ClientDashboardScreen from '../screens/ClientDashboardScreen';
import PostJobScreen from '../screens/PostJobScreen';

// Bidding & Proposal System screens (yours)
import SubmitBidScreen from '../screens/SubmitBidScreen';
import BidListScreen from '../screens/BidListScreen';
import MyBidsScreen from '../screens/MyBidsScreen';
import EditBidScreen from '../screens/EditBidScreen';

// Shared job screen (from teammate)
import CreateJobScreen from '../screens/CreateJobScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
            {/* ── Auth Flow ───────────────────────────────────────────────── */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={ClientRegisterScreen} />
            <Stack.Screen name="WorkerRegister" component={WorkerRegisterScreen} />
            <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />

            {/* ── Main App (Tab Navigator) ────────────────────────────────── */}
            <Stack.Screen name="Dashboard" component={MainTabNavigator} />

            {/* ── Client Dashboard & Job Posting (yours) ──────────────────── */}
            <Stack.Screen name="ClientDashboard" component={ClientDashboardScreen} />
            <Stack.Screen name="PostJob" component={PostJobScreen} />

            {/* ── Bidding & Proposal System (yours) ───────────────────────── */}
            <Stack.Screen name="SubmitBid" component={SubmitBidScreen} />
            <Stack.Screen name="BidList" component={BidListScreen} />
            <Stack.Screen name="MyBids" component={MyBidsScreen} />
            <Stack.Screen name="EditBid" component={EditBidScreen} />

            {/* ── Shared (teammate) ────────────────────────────────────────── */}
            <Stack.Screen name="CreateJob" component={CreateJobScreen} />
        </Stack.Navigator>
    );
}
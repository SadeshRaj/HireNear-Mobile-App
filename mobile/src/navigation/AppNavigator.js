import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import ClientRegisterScreen from '../screens/ClientRegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import WorkerRegisterScreen from '../screens/WorkerRegisterScreen';
import ClientDashboardScreen from '../screens/ClientDashboardScreen';
import PostJobScreen from '../screens/PostJobScreen';

// ── Bidding & Proposal System screens ───────────────────────────────────────
import SubmitBidScreen from '../screens/SubmitBidScreen';
import BidListScreen from '../screens/BidListScreen';
import MyBidsScreen from '../screens/MyBidsScreen';
import EditBidScreen from '../screens/EditBidScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
            {/* ── Auth screens ───────────────────────────────────────────── */}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={ClientRegisterScreen} />
            <Stack.Screen name="WorkerRegister" component={WorkerRegisterScreen} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} />

            {/* ── Bidding & Proposal System ──────────────────────────────── */}
            <Stack.Screen name="SubmitBid" component={SubmitBidScreen} />
            <Stack.Screen name="BidList" component={BidListScreen} />
            <Stack.Screen name="MyBids" component={MyBidsScreen} />
            <Stack.Screen name="EditBid" component={EditBidScreen} />

            {/* ── Client Dashboard (Bidding feature) ─────────────────────── */}
            <Stack.Screen name="ClientDashboard" component={ClientDashboardScreen} />
            <Stack.Screen name="PostJob" component={PostJobScreen} />
        </Stack.Navigator>
    );
}
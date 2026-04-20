import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { API_BASE_URL } from '../../config';

export default function MyJobPostsScreen({ route, navigation }) {
    // 1. Get the user object from route params (passed from MainTabNavigator)
    const { user } = route.params || {};

    // 2. Safely define the userId variable so the rest of the code can see it
    const userId = user?._id || user?.id;

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMyJobs = async () => {
        // Now userId is defined, so this check won't crash
        if (!userId) {
            console.log("Waiting for User ID...");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/jobs/my-jobs/${userId}`);
            const data = await response.json();

            if (data.success) {
                setJobs(data.jobs);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // This hook ensures the list refreshes every time you tap the "My Posts" tab
    useFocusEffect(
        useCallback(() => {
            fetchMyJobs();
        }, [userId])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchMyJobs();
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-gray-100"
            onPress={() => navigation.navigate('BidList', { job: item })}
        >
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                    <Text className="text-lg font-bold text-slate-900">{item.title}</Text>
                    <Text className="text-slate-500 font-medium text-xs mt-1">
                        {item.category} • {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${item.status === 'open' ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                    <Text className={`text-[10px] font-bold uppercase ${item.status === 'open' ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {item.status}
                    </Text>
                </View>
            </View>

            <View className="flex-row justify-between items-center border-t border-gray-50 pt-4">
                <View>
                    <Text className="text-gray-400 text-[10px] uppercase font-bold">Budget</Text>
                    <Text className="text-slate-900 font-extrabold">Rs. {item.budget?.toLocaleString()}</Text>
                </View>
                <TouchableOpacity
                    className="flex-row items-center bg-slate-900 px-4 py-2 rounded-xl gap-1"
                    onPress={() => navigation.navigate('BidList', { job: item })}
                >
                    <Ionicons name="people-outline" size={13} color="white" />
                    <Text className="text-white text-xs font-bold">View Bids</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB] px-5">
            {/* Header */}
            <View className="pt-6 pb-6">
                <Text className="text-3xl font-extrabold text-slate-900">My Job Posts</Text>
                <Text className="text-slate-500 font-medium">Track your service requests</Text>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#0f172a" />
                </View>
            ) : (
                <FlatList
                    data={jobs}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View className="items-center mt-20">
                            <Ionicons name="document-text-outline" size={80} color="#e2e8f0" />
                            <Text className="text-slate-400 font-bold mt-4">No jobs posted yet.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
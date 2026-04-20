import React, { useState, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity, ActivityIndicator,
    RefreshControl, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config';

export default function MyJobPostsScreen({ navigation, route }) {
    const { user } = route.params || {};
    const userId = user?._id || user?.id;

    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchMyJobs = async () => {
        if (!userId) {
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

    useFocusEffect(
        useCallback(() => {
            fetchMyJobs();
        }, [userId])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchMyJobs();
    };

    // --- Action Handlers ---

    const handleDelete = async (jobId) => {
        // Retrieve token for protected route
        const userToken = await AsyncStorage.getItem('token');

        Alert.alert(
            "Delete Job",
            "Are you sure you want to remove this job post? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${userToken}`,
                                    'Content-Type': 'application/json'
                                },
                            });

                            if (response.ok) {
                                setJobs(prev => prev.filter(j => j._id !== jobId));
                                Alert.alert("Success", "Job deleted.");
                            } else {
                                Alert.alert("Error", "Failed to delete job.");
                            }
                        } catch (error) {
                            Alert.alert("Error", "Something went wrong.");
                        }
                    }
                }
            ]
        );
    };

    const toggleStatus = async (jobId, currentStatus) => {
        const newStatus = currentStatus === 'open' ? 'closed' : 'open';
        const userToken = await AsyncStorage.getItem('token');

        try {
            const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                // Update local state to reflect change immediately
                setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: newStatus } : j));
            } else {
                Alert.alert("Failed", "Could not update status.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Check your internet connection.");
        }
    };

    const renderItem = ({ item }) => (
        <View className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                    <Text className="text-lg font-bold text-slate-900">{item.title}</Text>
                    <Text className="text-slate-500 font-medium text-xs mt-1">
                        {item.category} • {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                </View>

                {/* Status Badge Toggle */}
                <TouchableOpacity
                    onPress={() => toggleStatus(item._id, item.status)}
                    className={`px-3 py-1 rounded-full flex-row items-center ${item.status === 'open' ? 'bg-emerald-50' : 'bg-rose-50'}`}
                >
                    <View className={`w-1.5 h-1.5 rounded-full mr-2 ${item.status === 'open' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    <Text className={`text-[10px] font-bold uppercase ${item.status === 'open' ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {item.status}
                    </Text>
                </TouchableOpacity>
            </View>

            <View className="mb-4">
                <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Budget</Text>
                <Text className="text-slate-900 font-extrabold text-lg">Rs. {item.budget?.toLocaleString()}</Text>
            </View>

            <View className="flex-row gap-2 border-t border-gray-50 pt-4">
                <TouchableOpacity
                    className="flex-1 bg-slate-900 flex-row justify-center items-center py-2.5 rounded-xl"
                    onPress={() => navigation.navigate('JobDetails', { jobId: item._id })}
                >
                    <Text className="text-white text-xs font-bold">View</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="flex-1 bg-slate-100 flex-row justify-center items-center py-2.5 rounded-xl"
                    onPress={() => navigation.navigate('CreateJob', { editJob: item })}
                >
                    <Ionicons name="pencil" size={14} color="#475569" className="mr-1" />
                    <Text className="text-slate-600 text-xs font-bold">Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="w-12 bg-rose-50 justify-center items-center py-2.5 rounded-xl"
                    onPress={() => handleDelete(item._id)}
                >
                    <Ionicons name="trash-outline" size={18} color="#e11d48" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB] px-5">
            <View className="pt-6 pb-6 flex-row justify-between items-center">
                <View>
                    <Text className="text-3xl font-extrabold text-slate-900">My Posts</Text>
                    <Text className="text-slate-500 font-medium">Manage your service requests</Text>
                </View>
                <TouchableOpacity
                    onPress={() => navigation.navigate('CreateJob')}
                    className="bg-emerald-600 w-12 h-12 rounded-2xl items-center justify-center shadow-md shadow-emerald-200"
                >
                    <Ionicons name="add" size={30} color="white" />
                </TouchableOpacity>
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
                    contentContainerStyle={{ paddingBottom: 20 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View className="items-center mt-20">
                            <MaterialCommunityIcons name="clipboard-text-search-outline" size={80} color="#e2e8f0" />
                            <Text className="text-slate-400 font-bold mt-4">You haven't posted any jobs.</Text>
                            <TouchableOpacity
                                className="mt-4 bg-slate-200 px-6 py-2 rounded-full"
                                onPress={() => navigation.navigate('CreateJob')}
                            >
                                <Text className="text-slate-600 font-bold">Post a Job Now</Text>
                            </TouchableOpacity>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
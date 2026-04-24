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
    const [activeTab, setActiveTab] = useState('open');
    // New state for Sub-Tabs under the "Accepted" section
    const [subTab, setSubTab] = useState('active');

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

    const handleDelete = async (jobId) => {
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
                setJobs(prev => prev.map(j => j._id === jobId ? { ...j, status: newStatus } : j));
            } else {
                Alert.alert("Failed", "Could not update status.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Check your internet connection.");
        }
    };

    const renderItem = ({ item }) => {
        const isAccepted = item.status === 'accepted';
        const isCompleted = item.status === 'completed';
        const isCancelled = item.status === 'cancelled';
        const isActionable = isAccepted || isCompleted;

        return (
            <View className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                        <Text className="text-lg font-bold text-slate-900">{item.title}</Text>
                        <Text className="text-slate-500 font-medium text-xs mt-1">
                            {item.category} • {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                    </View>

                    {/* Status Badges */}
                    {!isAccepted && !isCompleted && !isCancelled && (
                        <TouchableOpacity
                            onPress={() => toggleStatus(item._id, item.status)}
                            className={`px-3 py-1 rounded-full flex-row items-center ${item.status === 'open' ? 'bg-emerald-50' : 'bg-rose-50'}`}
                        >
                            <View className={`w-1.5 h-1.5 rounded-full mr-2 ${item.status === 'open' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <Text className={`text-[10px] font-bold uppercase ${item.status === 'open' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {item.status}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {isAccepted && (
                        <View className="bg-indigo-50 px-3 py-1 rounded-full flex-row items-center border border-indigo-100">
                            <View className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2" />
                            <Text className="text-[10px] font-bold uppercase text-indigo-700">In Progress</Text>
                        </View>
                    )}

                    {isCompleted && (
                        <View className="bg-emerald-50 px-3 py-1 rounded-full flex-row items-center border border-emerald-100">
                            <Ionicons name="checkmark-done" size={12} color="#10b981" style={{marginRight: 4}} />
                            <Text className="text-[10px] font-bold uppercase text-emerald-700">Completed</Text>
                        </View>
                    )}

                    {isCancelled && (
                        <View className="bg-slate-100 px-3 py-1 rounded-full">
                            <Text className="text-[10px] font-bold uppercase text-slate-500">Cancelled</Text>
                        </View>
                    )}
                </View>

                <View className="flex-row gap-8 mb-4">
                    <View>
                        <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Budget</Text>
                        <Text className="text-slate-900 font-extrabold text-lg">Rs. {item.budget?.toLocaleString()}</Text>
                    </View>
                    <View>
                        <Text className="text-gray-400 text-[10px] uppercase font-bold tracking-wider">Bids</Text>
                        <Text className="text-slate-900 font-extrabold text-lg">{item.bidCount || 0}</Text>
                    </View>
                </View>

                <View className="flex-row gap-2 border-t border-gray-50 pt-4">
                    {/* Primary Action Button Logic */}
                    {(isActionable) ? (
                        <TouchableOpacity
                            className={`flex-1 flex-row justify-center items-center py-2.5 rounded-xl ${isCompleted ? 'bg-slate-800' : 'bg-emerald-600'}`}
                            onPress={() => navigation.navigate('BookingDetails', { jobId: item._id, jobTitle: item.title })}
                        >
                            <MaterialCommunityIcons
                                name={isCompleted ? "file-check-outline" : "progress-clock"}
                                size={16}
                                color="white"
                                style={{ marginRight: 6 }}
                            />
                            <Text className="text-white text-xs font-bold">
                                {isCompleted ? 'View Job Summary' : 'Track Progress'}
                            </Text>
                        </TouchableOpacity>
                    ) : !isCancelled && (
                        <TouchableOpacity
                            className="flex-1 flex-row justify-center items-center py-2.5 rounded-xl bg-slate-900"
                            onPress={() => navigation.navigate('JobBids', { jobId: item._id, jobTitle: item.title })}
                        >
                            <Text className="text-white text-xs font-bold">View Bids</Text>
                        </TouchableOpacity>
                    )}

                    {/* Edit/Delete only for non-accepted/completed jobs */}
                    {!isAccepted && !isCompleted && !isCancelled && (
                        <>
                            <TouchableOpacity
                                className="flex-1 bg-slate-100 flex-row justify-center items-center py-2.5 rounded-xl"
                                onPress={() => navigation.navigate('CreateJob', { editJob: item })}
                            >
                                <Ionicons name="pencil" size={14} color="#475569" />
                                <Text className="text-slate-600 text-xs font-bold ml-1">Edit</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                className="w-12 bg-rose-50 justify-center items-center py-2.5 rounded-xl"
                                onPress={() => handleDelete(item._id)}
                            >
                                <Ionicons name="trash-outline" size={18} color="#e11d48" />
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Cancelled placeholder */}
                    {isCancelled && (
                        <View className="flex-1 py-2.5 items-center justify-center bg-slate-50 rounded-xl">
                            <Text className="text-slate-400 text-xs font-bold italic">This job was cancelled</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    // Updated Filtering Logic for Sub-Tabs
    const filteredJobs = jobs.filter(job => {
        if (activeTab === 'open') {
            return job.status === 'open' || job.status === 'closed';
        } else {
            // Accepted Parent Tab
            if (subTab === 'active') return job.status === 'accepted';
            if (subTab === 'completed') return job.status === 'completed';
            if (subTab === 'history') return job.status === 'completed' || job.status === 'cancelled';
            return false;
        }
    });

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB] px-5">
            <View className="pt-6 pb-4 flex-row justify-between items-center">
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

            {/* Main Tabs */}
            <View className="flex-row bg-white p-1.5 rounded-2xl mb-4 border border-slate-100 shadow-sm">
                <TouchableOpacity
                    onPress={() => setActiveTab('open')}
                    className={`flex-1 py-3 items-center rounded-xl ${activeTab === 'open' ? 'bg-slate-900' : ''}`}
                >
                    <Text className={`font-bold ${activeTab === 'open' ? 'text-white' : 'text-slate-500'}`}>Open Jobs</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setActiveTab('accepted')}
                    className={`flex-1 py-3 items-center rounded-xl ${activeTab === 'accepted' ? 'bg-emerald-600' : ''}`}
                >
                    <Text className={`font-bold ${activeTab === 'accepted' ? 'text-white' : 'text-slate-500'}`}>Accepted</Text>
                </TouchableOpacity>
            </View>

            {/* NEW: Sub-Tabs for the Accepted section */}
            {activeTab === 'accepted' && (
                <View className="flex-row gap-2 mb-5">
                    {['active', 'completed', 'history'].map((tab) => (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setSubTab(tab)}
                            className={`px-4 py-2 rounded-full border ${
                                subTab === tab
                                    ? 'bg-emerald-100 border-emerald-200'
                                    : 'bg-white border-gray-200'
                            }`}
                        >
                            <Text className={`text-xs font-bold capitalize ${
                                subTab === tab ? 'text-emerald-700' : 'text-slate-500'
                            }`}>
                                {tab === 'active' ? 'Active Bookings' : tab === 'completed' ? 'Completed' : 'History'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#0f172a" />
                </View>
            ) : (
                <FlatList
                    data={filteredJobs}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View className="items-center mt-20">
                            <MaterialCommunityIcons name="clipboard-text-search-outline" size={80} color="#CBD5E1" />
                            <Text className="text-slate-400 font-bold mt-4 text-center">
                                No {subTab !== 'active' && activeTab === 'accepted' ? subTab : activeTab} jobs found.
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
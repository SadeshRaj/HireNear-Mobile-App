import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ClientBookingsScreen({ navigation }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const fetchJobs = async () => {
                try {
                    const token = await AsyncStorage.getItem('token');
                    const res = await fetch(`${API_BASE_URL}/jobs/my`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();

                    if (Array.isArray(data)) {
                        setJobs(data);
                    }
                } catch (err) {
                    console.log("Error fetching jobs for tab", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchJobs();
        }, [])
    );

    if (loading) return <SafeAreaView className="flex-1 justify-center items-center bg-[#F8F9FB]"><ActivityIndicator size="large" /></SafeAreaView>;

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <View className="px-5 py-4 bg-white border-b border-gray-100 shadow-sm">
                <Text className="text-xl font-extrabold text-slate-800">My Jobs & Bookings</Text>
            </View>

            <View className="flex-1 p-5">
                {jobs.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <Ionicons name="folder-open-outline" size={48} color="#cbd5e1" />
                        <Text className="text-slate-500 font-medium mt-3">You haven't posted any jobs yet.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={jobs}
                        keyExtractor={(item) => item._id}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('JobBids', { jobId: item._id })}
                                className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100"
                            >
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-lg font-bold text-slate-900 flex-1">{item.title}</Text>
                                    <View className={`px-3 py-1 rounded-full ${item.status === 'open' ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                                        <Text className={`text-xs font-bold uppercase ${item.status === 'open' ? 'text-indigo-700' : 'text-gray-500'}`}>
                                            {item.status}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row items-center justify-between mt-2">
                                    <Text className="text-emerald-600 font-extrabold">Budget: LKR {item.budget}</Text>
                                    <View className="flex-row items-center bg-slate-50 px-2 py-1 rounded-md">
                                        <Ionicons name="people" size={14} color="#64748b" />
                                        <Text className="text-slate-500 text-xs font-bold ml-1">{item.bidCount || 0} Bids</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
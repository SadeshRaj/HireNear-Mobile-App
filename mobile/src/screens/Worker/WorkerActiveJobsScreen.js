import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function WorkerActiveJobsScreen({ navigation }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const fetchBookings = async () => {
                try {
                    const token = await AsyncStorage.getItem('token');
                    const res = await fetch(`${API_BASE_URL}/bookings/worker`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();

                    if (data.success && Array.isArray(data.bookings)) {
                        setBookings(data.bookings);
                    }
                } catch (err) {
                    console.log("Error fetching worker bookings", err);
                } finally {
                    setLoading(false);
                }
            };
            fetchBookings();
        }, [])
    );

    if (loading) return <SafeAreaView className="flex-1 justify-center items-center bg-[#F8F9FB]"><ActivityIndicator size="large" /></SafeAreaView>;

    const getStatusColor = (status) => {
        switch(status) {
            case 'scheduled': return 'bg-blue-100 text-blue-700';
            case 'in-progress': return 'bg-purple-100 text-purple-700';
            case 'completed': return 'bg-emerald-100 text-emerald-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <View className="px-5 py-4 bg-white border-b border-gray-100 shadow-sm">
                <Text className="text-xl font-extrabold text-slate-800">My Active Jobs</Text>
            </View>

            <View className="flex-1 p-5">
                {bookings.length === 0 ? (
                    <View className="flex-1 items-center justify-center">
                        <Ionicons name="hammer-outline" size={48} color="#cbd5e1" />
                        <Text className="text-slate-500 font-medium mt-3">You don't have any active jobs yet.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={bookings}
                        keyExtractor={(item) => item._id}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('WorkerBookingDetails', { jobId: item.jobId?._id || item.jobId })}
                                className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100"
                            >
                                <View className="flex-row justify-between items-center mb-2">
                                    <Text className="text-lg font-bold text-slate-900 flex-1" numberOfLines={1}>
                                        {item.jobId?.title || 'Assigned Job'}
                                    </Text>
                                    <View className={`px-3 py-1 rounded-full ${getStatusColor(item.status).split(' ')[0]}`}>
                                        <Text className={`text-[10px] font-bold uppercase ${getStatusColor(item.status).split(' ')[1]}`}>
                                            {item.status}
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row items-center mt-2 pt-2 border-t border-gray-50">
                                    <Ionicons name="person" size={14} color="#64748b" />
                                    <Text className="text-slate-500 text-xs font-bold ml-1 flex-1">Client: {item.clientId?.name || 'Unknown'}</Text>

                                    <View className="flex-row items-center">
                                        <Ionicons name="cash" size={14} color="#059669" />
                                        <Text className="text-emerald-600 text-xs font-bold ml-1">LKR {item.price || item.jobId?.budget}</Text>
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
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { API_BASE_URL } from '../../../config';

export default function WorkerActiveJobsScreen({ navigation }) {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🔄 Fetch bookings on screen focus
    const fetchBookings = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');

            if (!token) {
                Alert.alert("Session Expired", "Please login again.");
                return;
            }

            const res = await fetch(`${API_BASE_URL}/bookings/worker`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();

            if (data?.success && Array.isArray(data.bookings)) {
                setBookings(data.bookings);
            } else {
                setBookings([]);
            }

        } catch (err) {
            console.error("Error fetching worker bookings:", err);
            Alert.alert("Error", "Failed to load bookings.");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchBookings();
        }, [])
    );

    // 💬 Navigate to chat
    const handleChat = async (item) => {
        try {
            const userData = JSON.parse(await AsyncStorage.getItem('user'));

            if (!userData?._id) {
                Alert.alert("Error", "User session expired. Please login again.");
                return;
            }

            navigation.navigate('Chat', {
                bookingId: item._id,
                receiverName: item.clientId?.name || 'Client',
                receiverId: item.clientId?._id,
                userId: userData._id,
            });

        } catch (error) {
            console.error("Chat navigation error:", error);
        }
    };

    // 🎨 Status styling
    const getStatusStyle = (status) => {
        const s = status?.toLowerCase();

        switch (s) {
            case 'scheduled':
                return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Scheduled' };
            case 'in-progress':
                return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'In Progress' };
            case 'completed':
                return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Unknown' };
        }
    };

    // 📦 Render each job card
    const renderItem = ({ item }) => {
        const statusStyle = getStatusStyle(item.status);
        const isCompleted = item.status?.toLowerCase() === 'completed';

        const reviewId = item.reviewId;

        const jobId = item.jobId?._id || item.jobId;

        return (
            <View className="bg-white p-4 rounded-2xl mb-4 shadow-sm border border-gray-100">

                {/* Job Info */}
                <TouchableOpacity
                    onPress={() => navigation.navigate('WorkerBookingDetails', { jobId })}
                >
                    <View className="flex-row justify-between items-center mb-2">
                        <Text
                            className="text-lg font-bold text-slate-900 flex-1"
                            numberOfLines={1}
                        >
                            {item.jobId?.title || 'Assigned Job'}
                        </Text>

                        <View className={`px-3 py-1 rounded-full ${statusStyle.bg}`}>
                            <Text className={`text-[10px] font-bold uppercase ${statusStyle.text}`}>
                                {statusStyle.label}
                            </Text>
                        </View>
                    </View>

                    <View className="flex-row items-center mt-2 pt-2 border-t border-gray-50">
                        <Ionicons name="person" size={14} color="#64748b" />
                        <Text className="text-slate-500 text-xs font-bold ml-1 flex-1">
                            Client: {item.clientId?.name || 'Unknown'}
                        </Text>

                        <View className="flex-row items-center">
                            <Ionicons name="cash" size={14} color="#059669" />
                            <Text className="text-emerald-600 text-xs font-bold ml-1">
                                LKR {item.price || item.jobId?.budget || 0}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Actions */}
                <View className="mt-4">

                    {/* Chat Button */}
                    <TouchableOpacity
                        onPress={() => handleChat(item)}
                        className="flex-row items-center justify-center bg-slate-900 py-3 rounded-xl"
                    >
                        <Ionicons name="chatbubble-ellipses-outline" size={18} color="white" />
                        <Text className="text-white font-bold ml-2">Message Client</Text>
                    </TouchableOpacity>

                    {/* Review Section */}
                    {isCompleted && (
                        reviewId ? (
                            <TouchableOpacity
                                onPress={() =>
                                    navigation.navigate('ViewReview', { reviewId })
                                }
                                className="mt-3 self-center bg-blue-600 px-4 py-1.5 rounded-full"
                            >
                                <Text className="text-white text-xs font-semibold">
                                    View Client Review
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <Text className="text-slate-400 text-[11px] italic text-center mt-3">
                                Review not yet submitted by client
                            </Text>
                        )
                    )}
                </View>
            </View>
        );
    };

    // ⏳ Loading state
    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center bg-[#F8F9FB]">
                <ActivityIndicator size="large" />
            </SafeAreaView>
        );
    }

    // 📭 Empty state
    const renderEmpty = () => (
        <View className="flex-1 items-center justify-center mt-20">
            <Ionicons name="hammer-outline" size={48} color="#cbd5e1" />
            <Text className="text-slate-500 font-medium mt-3 text-center">
                You don't have any active jobs yet.
            </Text>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">

            {/* Header */}
            <View className="px-5 py-4 bg-white border-b border-gray-100 shadow-sm">
                <Text className="text-xl font-extrabold text-slate-800">
                    My Active Jobs
                </Text>
            </View>


            <FlatList
                contentContainerStyle={{ padding: 20, flexGrow: 1 }}
                data={bookings}
                keyExtractor={(item) => item._id}
                showsVerticalScrollIndicator={false}
                renderItem={renderItem}
                ListEmptyComponent={renderEmpty}
            />
        </SafeAreaView>
    );
}
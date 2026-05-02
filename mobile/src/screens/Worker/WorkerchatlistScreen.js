import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api";
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || "http://localhost:4000";

const socket = io(SOCKET_URL);

export default function WorkerchatlistScreen({ navigation }) {
    const [currentUserId, setCurrentUserId] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Load worker ID from storage
    useEffect(() => {
        const loadUser = async () => {
            const userData = JSON.parse(await AsyncStorage.getItem('user'));
            if (userData?._id) setCurrentUserId(userData._id);
        };
        loadUser();
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (currentUserId) fetchConversations();
        }, [currentUserId])
    );

    const fetchConversations = async () => {
        try {
            if (!currentUserId) return;
            const response = await axios.get(`${API_URL}/messages/conversations/${currentUserId}`);
            if (response.data.success) {
                setConversations(response.data.conversations);
            }
        } catch (error) {
            console.error("Error fetching worker chats:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchConversations();
    };

    // Real-time updates
    useEffect(() => {
        if (!currentUserId) return;

        const handleRefresh = () => fetchConversations();

        socket.on('messages_marked_read', handleRefresh);
        socket.on('receive_message', handleRefresh);

        return () => {
            socket.off('messages_marked_read', handleRefresh);
            socket.off('receive_message', handleRefresh);
        };
    }, [currentUserId]);

    const handleChatPress = (item) => {
        if (!item._id || !currentUserId) {
            Alert.alert("Error", "Cannot open chat due to missing data.");
            return;
        }

        navigation.navigate('Chat', {
            bookingId: item._id,
            receiverName: item.otherUserName,
            receiverId: item.otherUserId,
            userId: currentUserId
        });
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            className="flex-row items-center p-4 bg-white mb-3 mx-4 rounded-2xl shadow-sm border border-gray-100"
            onPress={() => handleChatPress(item)}
        >
            {/* Avatar */}
            <View className="w-14 h-14 bg-slate-100 rounded-full items-center justify-center border border-slate-200">
                <Ionicons name="person" size={28} color="#94a3b8" />
                {item.unreadCount > 0 && (
                    <View className="absolute -top-1 -right-1 bg-red-500 h-5 w-5 rounded-full items-center justify-center border-2 border-white">
                        <Text className="text-white text-[10px] font-bold">
                            {item.unreadCount}
                        </Text>
                    </View>
                )}
            </View>

            <View className="flex-1 ml-4">
                {/* Row 1: Job title (highlighted) + time */}
                <View className="flex-row justify-between items-center mb-0.5">
                    <Text className="text-base font-bold text-slate-900" numberOfLines={1}>
                        {item.jobTitle || 'Job'}
                    </Text>
                    <Text className="text-[11px] text-slate-400">
                        {new Date(item.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </Text>
                </View>

                {/* Row 2: Client name */}
                <View className="flex-row items-center mb-1">
                    <Ionicons name="person-outline" size={11} color="#64748b" />
                    <Text className="text-xs text-slate-500 font-semibold ml-1" numberOfLines={1}>
                        {item.otherUserName}
                    </Text>
                </View>

                {/* Row 3: Last message */}
                <Text className="text-sm text-slate-500" numberOfLines={1}>
                    {item.lastMessage.text ||
                        (item.lastMessage.image ? "📷 Photo" : "📍 Location")}
                </Text>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <View className="px-6 py-5 flex-row justify-between items-center">
                <View>
                    <Text className="text-2xl font-bold text-slate-900">Messages</Text>
                    <Text className="text-slate-500 text-xs mt-1">
                        Client conversations & active jobs
                    </Text>
                </View>
                <TouchableOpacity onPress={onRefresh} className="p-2 bg-white rounded-full shadow-sm">
                    <Ionicons name="refresh" size={20} color="#0f172a" />
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#0f172a" />
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 20 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View className="items-center justify-center mt-20 px-10">
                            <View className="bg-slate-100 p-6 rounded-full mb-4">
                                <Ionicons name="chatbubble-ellipses-outline" size={40} color="#94a3b8" />
                            </View>
                            <Text className="text-slate-900 font-bold text-lg">
                                No messages yet
                            </Text>
                            <Text className="text-slate-500 text-center mt-2">
                                When a client messages you about a job,
                                the conversation will appear here.
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
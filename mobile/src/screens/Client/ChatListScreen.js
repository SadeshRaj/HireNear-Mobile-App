import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import io from 'socket.io-client';

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/api";
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || "http://localhost:4000";

const socket = io(SOCKET_URL);

export default function ChatListScreen({ navigation, route }) {
    // Safely extract the user ID
    const { user } = route.params || {};
    const currentUserId = user?._id || user?.id;

    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // 🔥 Fetch when screen is focused
    useFocusEffect(
        useCallback(() => {
            fetchConversations();
        }, [currentUserId])
    );

    const fetchConversations = async () => {
        try {
            if (!currentUserId) {
                console.warn("⚠️ ChatListScreen: currentUserId is undefined. Cannot fetch chats.");
                setLoading(false);
                return;
            }

            const response = await axios.get(`${API_URL}/messages/conversations/${currentUserId}`);
            if (response.data.success) {
                setConversations(response.data.conversations);
            }
        } catch (error) {
            console.error("Error fetching chats:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchConversations();
    };

    // ✅ REAL-TIME UPDATES
    useEffect(() => {
        if (!currentUserId) return;

        // When messages are marked as read or new message arrives
        const handleRefresh = () => fetchConversations();

        socket.on('messages_marked_read', handleRefresh);
        socket.on('receive_message', handleRefresh);

        return () => {
            socket.off('messages_marked_read', handleRefresh);
            socket.off('receive_message', handleRefresh);
        };
    }, [currentUserId]);

    // 🛡️ BULLETPROOF NAVIGATION LOGIC
    const handleChatPress = (item) => {
        // 1. Strict Validation Check
        if (!item._id || !currentUserId) {
            console.error("❌ Navigation Blocked: Missing IDs", {
                bookingId: item._id,
                userId: currentUserId
            });
            Alert.alert("Error", "Cannot open chat due to missing data.");
            return;
        }

        // 2. Log exactly what we are sending so you can verify it in terminal
        console.log("✅ Navigating to ChatScreen with:", {
            bookingId: item._id,
            receiverName: item.otherUserName,
            receiverId: item.otherUserId,
            userId: currentUserId
        });

        // 3. Navigate
        navigation.navigate('Chat', {
            bookingId: item._id,
            receiverName: item.otherUserName,
            receiverId: item.otherUserId,
            userId: currentUserId
        });
    };

    const renderItem = ({ item }) => {
        return (
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
                    <View className="flex-row justify-between items-center mb-1">
                        <Text className="text-base font-bold text-slate-900" numberOfLines={1}>
                            {item.jobTitle || item.otherUserName}
                        </Text>

                        <Text className="text-[11px] text-slate-400">
                            {new Date(item.lastMessage.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </Text>
                    </View>

                    <View className="flex-row items-center mb-1">
                        <Ionicons name="construct-outline" size={12} color="#2563eb" />
                        <Text className="text-xs text-blue-600 font-semibold ml-1" numberOfLines={1}>
                            {item.otherUserName} ({item.jobTitle || 'Job'})
                        </Text>
                    </View>

                    <Text className="text-sm text-slate-500" numberOfLines={1}>
                        {item.lastMessage.text ||
                            (item.lastMessage.image ? "📷 Photo" : "📍 Location")}
                    </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <View className="px-6 py-5 flex-row justify-between items-center">
                <View>
                    <Text className="text-2xl font-bold text-slate-900">Messages</Text>
                    <Text className="text-slate-500 text-xs mt-1">
                        Direct inquiries & active jobs
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
                                When you message a worker or client about a job,
                                the conversation will appear here.
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}
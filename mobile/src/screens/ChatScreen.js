import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Image, ActivityIndicator,
    Linking, Alert // Added Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { io } from "socket.io-client";
import axios from 'axios';

const SOCKET_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || "http://localhost:4000";

export default function ChatScreen({ route, navigation }) {
    const { bookingId, receiverName, receiverId, userId } = route.params;

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sendingLocation, setSendingLocation] = useState(false); // New state for location loading
    const socket = useRef(null);
    const flatListRef = useRef();

    useEffect(() => {
        socket.current = io(SOCKET_URL);
        fetchChatHistory();
        socket.current.emit("join_chat", bookingId);
        socket.current.on("receive_message", (newMessage) => {
            setMessages((prev) => [...prev, newMessage]);
        });
        return () => {
            socket.current.disconnect();
        };
    }, [bookingId]);

    const fetchChatHistory = async () => {
        try {
            if (!bookingId) return;
            const response = await axios.get(`${SOCKET_URL}/api/messages/${bookingId}`);
            if (response.data.success) {
                setMessages(response.data.messages);
            }
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenMap = (lat, lng) => {
        const scheme = Platform.select({ ios: 'maps://0,0?q=', android: 'geo:0,0?q=' });
        const latLng = `${lat},${lng}`;
        const label = 'Shared Location';
        const url = Platform.select({
            ios: `${scheme}${label}@${latLng}`,
            android: `${scheme}${latLng}(${label})`
        });

        Linking.openURL(url);
    };

    const handleSendMessage = () => {
        if (inputText.trim().length > 0) {
            const messageData = {
                bookingId,
                senderId: userId,
                receiverId,
                message: inputText,
            };
            socket.current.emit("send_message", messageData);
            setInputText('');
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
        });
        if (!result.canceled) {
            console.log("Image Selected:", result.assets[0].uri);
        }
    };

    const sendLocation = async () => {
        try {
            setSendingLocation(true);
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Denied", "Location access is required to share your position.");
                setSendingLocation(false);
                return;
            }

            // Get last known position first (nearly instant)
            let location = await Location.getLastKnownPositionAsync({});

            // If no last known or it's unavailable, get current with Balanced accuracy (faster)
            if (!location) {
                location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
            }

            const coords = { lat: location.coords.latitude, lng: location.coords.longitude };

            socket.current.emit("send_message", {
                bookingId,
                senderId: userId,
                receiverId,
                location: coords
            });
        } catch (error) {
            console.error("Location Error:", error);
            Alert.alert("Error", "Could not fetch location. Ensure GPS is enabled.");
        } finally {
            setSendingLocation(false);
        }
    };

    const renderMessage = ({ item }) => {
        const isMine = item.senderId === userId;

        return (
            <View className={`mb-4 flex-row ${isMine ? 'justify-end' : 'justify-start'}`}>
                <View className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isMine ? 'bg-slate-900 rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none'
                }`}>
                    {item.text && (
                        <Text className={`text-base ${isMine ? 'text-white' : 'text-slate-800'}`}>
                            {item.text}
                        </Text>
                    )}

                    {item.image && (
                        <Image source={{ uri: item.image }} className="w-48 h-48 rounded-lg mt-2" resizeMode="cover" />
                    )}

                    {item.location && (
                        <TouchableOpacity
                            className="flex-row items-center mt-2 bg-slate-100 p-2 rounded-lg"
                            onPress={() => handleOpenMap(item.location.lat, item.location.lng)}
                        >
                            <Ionicons name="location" size={20} color="#0f172a" />
                            <View className="ml-2">
                                <Text className="text-slate-900 font-bold">Shared Location</Text>
                                <Text className="text-slate-500 text-[10px]">Tap to view on Map</Text>
                            </View>
                        </TouchableOpacity>
                    )}

                    <Text className="text-[10px] mt-1 text-slate-400">
                        {new Date(item.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Header */}
                <View className="flex-row items-center px-6 py-4 bg-white border-b border-gray-100 shadow-sm">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
                        <Ionicons name="arrow-back" size={24} color="#0f172a" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-lg font-bold text-slate-900">{receiverName}</Text>
                        <Text className="text-xs text-green-500 font-medium">Online</Text>
                    </View>
                </View>

                {/* Chat List */}
                <View className="flex-1">
                    {loading ? (
                        <ActivityIndicator size="large" color="#0f172a" className="mt-10" />
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            keyExtractor={(item) => item._id || Math.random().toString()}
                            renderItem={renderMessage}
                            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                        />
                    )}
                </View>

                {/* Input Bar */}
                <View className="p-4 bg-white border-t border-gray-100 flex-row items-center" style={{ paddingBottom: Platform.OS === 'ios' ? 30 : 20 }}>
                    <TouchableOpacity onPress={pickImage} className="mr-2 p-2">
                        <Ionicons name="image-outline" size={26} color="#94a3b8" />
                    </TouchableOpacity>

                    {/* Updated Location Button with Loader */}
                    <TouchableOpacity onPress={sendLocation} className="mr-2 p-2" disabled={sendingLocation}>
                        {sendingLocation ? (
                            <ActivityIndicator size="small" color="#94a3b8" />
                        ) : (
                            <Ionicons name="location-outline" size={26} color="#94a3b8" />
                        )}
                    </TouchableOpacity>

                    <View className="flex-1 bg-slate-50 rounded-2xl px-4 py-2 flex-row items-center border border-gray-200">
                        <TextInput
                            className="flex-1 text-slate-800 py-1 text-base"
                            placeholder="Type a message..."
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                    </View>
                    <TouchableOpacity
                        className="ml-3 bg-slate-900 w-12 h-12 rounded-full items-center justify-center shadow-md"
                        onPress={handleSendMessage}
                    >
                        <Ionicons name="send" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
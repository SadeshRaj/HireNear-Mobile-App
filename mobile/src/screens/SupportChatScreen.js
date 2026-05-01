import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Image, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import io from 'socket.io-client';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config';

export default function SupportChatScreen({ navigation }) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [user, setUser] = useState(null);
    const [socket, setSocket] = useState(null);
    const [loading, setLoading] = useState(true);
    const flatListRef = useRef();

    useEffect(() => {
        // FIX 3: Declare locally so the cleanup function has access to the exact instance
        let newSocket = null;

        const initChat = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user');
                // FIX 4: Changed 'userToken' to 'token' to match your global auth config
                const token = await AsyncStorage.getItem('token');

                if (!storedUser || !token) {
                    setLoading(false);
                    return;
                }

                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);

                // Fetch History
                const res = await axios.get(`${API_BASE_URL}/support/history/${parsedUser._id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setMessages(res.data);

                // Mark as read
                await axios.post(`${API_BASE_URL}/support/read`, { userId: parsedUser._id, isAdmin: false }, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                // Init Socket
                const backendUrl = API_BASE_URL.replace('/api', '');
                newSocket = io(backendUrl);
                setSocket(newSocket);

                newSocket.emit('join', { userId: parsedUser._id });

                newSocket.on('receiveMessage', (msg) => {
                    setMessages(prev => [...prev, msg]);
                });

                setLoading(false);
            } catch (err) {
                console.error('Failed to init support chat:', err);
                setLoading(false);
            }
        };

        initChat();

        return () => {
            // FIX 5: Safely disconnects the local instance when unmounting
            if (newSocket) newSocket.disconnect();
        };
    }, []);

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
            base64: true
        });

        if (!result.canceled && socket) {
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            socket.emit('sendMessage', {
                senderId: user._id,
                receiverId: null, // to Admin
                message: '',
                image: base64Img,
                isAdmin: false
            });
        }
    };

    const sendMessage = () => {
        if (inputText.trim().length === 0 || !socket) return;

        socket.emit('sendMessage', {
            senderId: user._id,
            receiverId: null,
            message: inputText.trim(),
            image: null,
            isAdmin: false
        });
        setInputText('');
    };

    const renderMessage = ({ item }) => {
        const isMine = !item.isAdmin;

        return (
            <View className={`mb-4 flex-row ${isMine ? 'justify-end' : 'justify-start'}`}>
                <View className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isMine ? 'bg-slate-900 rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none shadow-sm'
                }`}>
                    {item.message ? (
                        <Text className={`text-base ${isMine ? 'text-white' : 'text-slate-800'}`}>
                            {item.message}
                        </Text>
                    ) : null}

                    {item.image && (
                        <Image
                            source={{ uri: item.image }}
                            className="w-48 h-48 rounded-lg mt-2"
                            resizeMode="cover"
                        />
                    )}

                    <Text className={`text-[10px] mt-1 ${isMine ? 'text-slate-400' : 'text-slate-400'}`}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                <View className="flex-row items-center px-6 py-4 bg-white border-b border-gray-100 shadow-sm z-10">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 p-2 bg-slate-50 rounded-full">
                        <Ionicons name="arrow-back" size={24} color="#0f172a" />
                    </TouchableOpacity>

                    <View className="flex-1">
                        <Text className="text-xl font-extrabold text-slate-900">Admin Support</Text>
                        <Text className="text-xs text-slate-500 font-medium">We usually reply instantly</Text>
                    </View>

                    <View className="w-10 h-10 bg-emerald-50 rounded-full items-center justify-center">
                        <Ionicons name="headset" size={20} color="#10b981" />
                    </View>
                </View>

                {/* Chat List */}
                <View className="flex-1">
                    {loading ? (
                        <View className="flex-1 justify-center items-center">
                            <ActivityIndicator size="large" color="#0f172a" />
                        </View>
                    ) : (
                        <FlatList
                            ref={flatListRef}
                            data={messages}
                            keyExtractor={(item) => item._id}
                            renderItem={renderMessage}
                            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                            keyboardShouldPersistTaps="handled"
                            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>

                {/* Input Bar */}
                <View
                    className="p-4 bg-white border-t border-gray-100 flex-row items-center shadow-lg"
                    style={{ paddingBottom: Platform.OS === 'ios' ? 30 : 20 }}
                >
                    <TouchableOpacity onPress={pickImage} className="mr-3 w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
                        <Ionicons name="image" size={20} color="#64748b" />
                    </TouchableOpacity>

                    <View className="flex-1 bg-slate-50 rounded-2xl px-4 py-2 flex-row items-center border border-slate-200">
                        <TextInput
                            className="flex-1 text-slate-800 py-2 text-base"
                            placeholder="Type a message..."
                            placeholderTextColor="#94a3b8"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                    </View>

                    <TouchableOpacity
                        className={`ml-3 w-12 h-12 rounded-full items-center justify-center shadow-sm ${inputText.trim() ? 'bg-emerald-500' : 'bg-slate-800'}`}
                        onPress={sendMessage}
                    >
                        <Ionicons name="send" size={20} color="white" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
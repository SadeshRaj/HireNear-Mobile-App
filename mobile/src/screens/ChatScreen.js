import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, FlatList, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function ChatScreen({ route, navigation }) {
    const { bookingId, receiverName, receiverId } = route.params;

    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef();

    useEffect(() => {
        // Future: fetch messages + socket connection
    }, []);

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
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        let location = await Location.getCurrentPositionAsync({});
        const coords = {
            lat: location.coords.latitude,
            lng: location.coords.longitude
        };
        console.log("Sending Location:", coords);
    };

    const renderMessage = ({ item }) => {
        const isMine = item.senderId === 'YOUR_USER_ID';

        return (
            <View className={`mb-4 flex-row ${isMine ? 'justify-end' : 'justify-start'}`}>
                <View className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    isMine ? 'bg-slate-900 rounded-tr-none' : 'bg-white border border-gray-100 rounded-tl-none'
                }`}>
                    {item.message && (
                        <Text className={`text-base ${isMine ? 'text-white' : 'text-slate-800'}`}>
                            {item.message}
                        </Text>
                    )}

                    {item.image && (
                        <Image
                            source={{ uri: item.image }}
                            className="w-48 h-48 rounded-lg mt-2"
                            resizeMode="cover"
                        />
                    )}

                    {item.location && (
                        <TouchableOpacity className="flex-row items-center mt-2 bg-slate-100 p-2 rounded-lg">
                            <Ionicons name="location" size={20} color="#0f172a" />
                            <Text className="text-slate-900 font-bold ml-2">Shared Location</Text>
                        </TouchableOpacity>
                    )}

                    <Text className="text-[10px] mt-1 text-slate-400">
                        Just now
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

                    <TouchableOpacity className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
                        <Ionicons name="call-outline" size={20} color="#0f172a" />
                    </TouchableOpacity>
                </View>

                {/* Chat List */}
                <View className="flex-1">
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={renderMessage}
                        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
                        keyboardShouldPersistTaps="handled"
                        onContentSizeChange={() =>
                            flatListRef.current?.scrollToEnd({ animated: true })
                        }
                        onLayout={() =>
                            flatListRef.current?.scrollToEnd({ animated: true })
                        }
                        showsVerticalScrollIndicator={false}
                    />
                </View>

                {/* Input Bar */}
                <View
                    className="p-4 bg-white border-t border-gray-100 flex-row items-center"
                    style={{ paddingBottom: Platform.OS === 'ios' ? 30 : 20 }}
                >
                    <TouchableOpacity onPress={pickImage} className="mr-2 p-2">
                        <Ionicons name="image-outline" size={26} color="#94a3b8" />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={sendLocation} className="mr-2 p-2">
                        <Ionicons name="location-outline" size={26} color="#94a3b8" />
                    </TouchableOpacity>

                    <View className="flex-1 bg-slate-50 rounded-2xl px-4 py-2 flex-row items-center border border-gray-200">
                        <TextInput
                            className="flex-1 text-slate-800 py-1 text-base"
                            placeholder="Type a message..."
                            placeholderTextColor="#94a3b8"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            blurOnSubmit={false}
                        />
                    </View>

                    <TouchableOpacity
                        className="ml-3 bg-slate-900 w-12 h-12 rounded-full items-center justify-center shadow-md"
                        onPress={() => {
                            if (inputText.trim().length > 0) {
                                console.log("Sending:", inputText);
                                setInputText('');
                            }
                        }}
                    >
                        <Ionicons name="send" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
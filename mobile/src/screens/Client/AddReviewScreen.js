import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    KeyboardAvoidingView, Platform, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function AddReviewScreen({ route, navigation }) {
    // In production, these will be passed via route.params from the job completion screen
    const { bookingId, workerId, clientId } = route.params || {
        bookingId: '60d21b4667d0d8992e610c85', // Fallback dummies for testing
        clientId: '60d21b4667d0d8992e610c86',
        workerId: '60d21b4667d0d8992e610c87'
    };

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const API_URL = process.env.EXPO_PUBLIC_API_URL;

    const handleSubmit = async () => {
        if (rating === 0) {
            return Alert.alert("Almost there!", "Please select a star rating for the worker.");
        }
        if (!comment.trim()) {
            return Alert.alert("Wait a second", "Please write a brief review of the service.");
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId,
                    clientId,
                    workerId,
                    rating,
                    comment,
                    images: []
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert("Success! ✅", "Your review has been published.");
                navigation.goBack();
            } else {
                Alert.alert("Error", data.msg || "Failed to submit review.");
            }
        } catch (error) {
            console.error("Submit Review Error:", error);
            Alert.alert("Network Error", "Could not connect to the server. Check your connection.");
        } finally {
            setLoading(false);
        }
    };

    const renderStars = () => {
        return (
            <View className="flex-row justify-center space-x-3 my-8">
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                        className="p-1"
                    >
                        <Ionicons
                            name={star <= rating ? "star" : "star-outline"}
                            size={44}
                            color={star <= rating ? "#fbbf24" : "#cbd5e1"}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1 px-6 pt-4 pb-4" showsVerticalScrollIndicator={false}>

                    {/* Header to match BidListScreen exactly */}
                    <View className="flex-row items-center mb-6">
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            className="w-11 h-11 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100 mr-4"
                        >
                            <Ionicons name="arrow-back" size={22} color="#0f172a" />
                        </TouchableOpacity>
                        <View className="flex-1">
                            <Text className="text-2xl font-extrabold text-slate-900 tracking-tight" numberOfLines={1}>
                                Rate Worker
                            </Text>
                            <Text className="text-slate-500 text-sm font-medium" numberOfLines={1}>
                                Share your service experience
                            </Text>
                        </View>
                    </View>

                    {/* Interactive Star Rating */}
                    {renderStars()}

                    {/* Review Text Input */}
                    <View className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 mb-8 min-h-[160px]">
                        <TextInput
                            className="flex-1 text-base text-slate-800"
                            placeholder="Write your review here... Did they arrive on time? Was the job well done?"
                            placeholderTextColor="#94a3b8"
                            multiline={true}
                            textAlignVertical="top"
                            value={comment}
                            onChangeText={setComment}
                        />
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        className={`bg-slate-900 rounded-2xl py-4 items-center shadow-md mb-8 ${loading ? 'opacity-70' : ''}`}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg tracking-wide">Publish Review</Text>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
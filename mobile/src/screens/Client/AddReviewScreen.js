import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView, Image,
    KeyboardAvoidingView, Platform, Alert, ActivityIndicator, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../config'; // Using fixed config with hardcoded IP

export default function AddReviewScreen({ route, navigation }) {
    const { editMode, reviewId, bookingId, clientId, workerId } = route.params || {};

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState(''); // Serves both "work description" and "review for worker"
    const [images, setImages] = useState([]); // Array of photo evidence [uri strings]

    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);

    // 3. EDIT MODE (U & D): Fetch existing review data if updating
    useEffect(() => {
        if (editMode && reviewId) {
            fetchExistingReview();
        }
    }, [editMode, reviewId]);

    const fetchExistingReview = async () => {
        setFetchingData(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (response.ok) {
                // Safeguard: Check if backend wrapped it in a "review" object or sent it flat
                const reviewData = data.review || data;

                setRating(reviewData.rating || 0);
                setComment(reviewData.comment || '');

                // Safeguard: Ensure images exist before trying to map them, preventing crashes
                setImages((reviewData.images || []).map(img => ({ uri: img, existing: true })));
            } else {
                Alert.alert("Error", "Could not fetch your existing review.");
                navigation.goBack();
            }
        } catch (error) {
            console.error("Fetch Review Error:", error);
            Alert.alert("Error", "Failed to load review data.");
            navigation.goBack();
        } finally {
            setFetchingData(false);
        }
    };

    // 4. Input Handlers

    // Star Rating (Mandatory Requirement)
    const handleRate = (rate) => setRating(rate);

    // Photo Evidence (Requirement) using expo-image-picker
    const pickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            return Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            // Append new images to existing ones (important for Update mode)
            setImages(prev => [...prev, ...result.assets]);
        }
    };

    // 5. Submit Handler (CREATE & UPDATE - Requires FormData for images)
    const handleSubmit = async () => {
        // MANDATORY Requirement Checks
        if (rating === 0) {
            return Alert.alert("Almost done!", "The star rating is mandatory.");
        }
        if (!comment.trim()) {
            return Alert.alert("Hold on!", "A brief review description is mandatory.");
        }

        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const formData = new FormData();

            // Common fields
            formData.append('rating', rating);
            formData.append('comment', comment);

            // Add mode prerequisites
            if (!editMode) {
                formData.append('bookingId', bookingId);
                formData.append('clientId', clientId);
                formData.append('workerId', workerId);
            }

            // Handle images (add only NEW images to FormData)
            images.forEach((img, index) => {
                if (!img.existing) {
                    formData.append('images', {
                        uri: Platform.OS === 'ios' ? img.uri.replace('file://', '') : img.uri,
                        name: `evidence_${Date.now()}_${index}.jpg`,
                        type: 'image/jpeg'
                    });
                }
            });

            // Unified Dynamic URL/Method selection based on mode
            const url = editMode ? `${API_BASE_URL}/reviews/${reviewId}` : `${API_BASE_URL}/reviews`;
            const method = editMode ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` }, // DON'T set Content-Type header with FormData
                body: formData,
            });

            const rawText = await response.text();
            let result;
            try {
                result = JSON.parse(rawText);
            } catch (parseError) {
                console.error("🚨 SERVER CRASH LOG:", rawText);
                Alert.alert("Server Error", "Check your Expo terminal to see the crash log.");
                setLoading(false);
                return;
            }

            if (response.ok) {
                Alert.alert("Success! ✅", editMode ? "Your review has been updated." : "Your review has been published.");
                navigation.goBack();
            } else {
                Alert.alert("Error", result.msg || "Server submission failed.");
            }
        } catch (error) {
            console.error("Submit Error:", error);
            Alert.alert("Network Error", "Could not connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    // 6. DELETE Handler (Edit Mode Requirement)
    const handleDeleteReview = () => {
        Alert.alert(
            "Delete Review?",
            "Are you sure you want to permanently remove this review? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: performDelete
                }
            ]
        );
    };

    const performDelete = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                Alert.alert("Deleted 🗑️", "Review removed successfully.");
                navigation.goBack();
            } else {
                Alert.alert("Error", "Failed to delete review.");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (fetchingData) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#0f172a" />
                <Text className="mt-4 text-slate-500 font-bold">Loading your review...</Text>
            </View>
        );
    }

    // 7. Render UI
    const renderStars = () => {
        return (
            <View style={styles.starContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => handleRate(star)}>
                        <Ionicons
                            name={star <= rating ? "star" : "star-outline"}
                            size={42}
                            color={star <= rating ? "#f59e0b" : "#cbd5e1"} // Orange vs Grey
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Dynamic Header */}
            <View className="flex-row items-center px-6 pt-2 pb-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-slate-50 rounded-full">
                    <Ionicons name="arrow-back" size={22} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-slate-900 ml-4">
                    {editMode ? "Edit Work Review" : "Rate & Review Work"}
                </Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>

                    {/* Section 1: Rating */}
                    <Text className="text-lg font-bold text-slate-800 mb-2">How was the quality of service?</Text>
                    {renderStars()}

                    {/* Section 2: Comment */}
                    <Text className="text-lg font-bold text-slate-800 mt-6 mb-2">Review of service</Text>
                    <View className="bg-slate-50 rounded-2xl p-4 min-h-[160px] border border-gray-100">
                        <TextInput
                            className="text-base text-slate-900"
                            placeholder="Provide a small description about the work done and a review for the worker..."
                            multiline={true}
                            textAlignVertical="top"
                            value={comment}
                            onChangeText={setComment}
                            placeholderTextColor="#94a3b8"
                        />
                    </View>

                    {/* Section 3: Photo Evidence */}
                    <Text className="text-lg font-bold text-slate-800 mt-8 mb-2">Photo Evidence (Optional)</Text>
                    <TouchableOpacity onPress={pickImages} className="border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 items-center justify-center h-32 mb-8">
                        {images.length > 0 ? (
                            <View style={styles.imagePreviewContainer}>
                                {images.slice(0, 3).map((img, i) => (
                                    <Image key={i} source={{ uri: img.uri }} style={styles.evidenceImage} />
                                ))}
                                {images.length > 3 && <Text className="text-slate-500 ml-2">+{images.length-3}</Text>}
                            </View>
                        ) : (
                            <View className="items-center">
                                <Ionicons name="camera-outline" size={32} color="#64748b" />
                                <Text className="text-slate-500 mt-1">Tap to upload photos of completed work</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    {/* Dynamic Action Buttons */}
                    <View className="mb-10 mt-2">

                        {/* Primary Submit Button */}
                        <TouchableOpacity
                            className={`${loading ? 'opacity-70' : ''} bg-slate-900 rounded-2xl py-4 items-center justify-center shadow-md`}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? <ActivityIndicator color="white" /> : (
                                <Text className="text-white font-bold text-lg">
                                    {editMode ? "Update Review" : "Submit Review"}
                                </Text>
                            )}
                        </TouchableOpacity>

                        {/* DELETE Button */}
                        {editMode && (
                            <TouchableOpacity
                                className="border border-red-200 bg-red-50 rounded-2xl py-3 items-center mt-6"
                                onPress={handleDeleteReview}
                                disabled={loading}
                            >
                                <Text className="text-red-700 font-bold">Delete Review</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    starContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 10, gap: 10 },
    imagePreviewContainer: { flexDirection: 'row', alignItems: 'center' },
    evidenceImage: { width: 60, height: 60, borderRadius: 10, marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0' }
});
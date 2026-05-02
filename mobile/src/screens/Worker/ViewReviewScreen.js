import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ViewReviewScreen({ route, navigation }) {
    const { reviewId } = route.params;
    const [loading, setLoading] = useState(true);
    const [review, setReview] = useState(null);

    useEffect(() => {
        const fetchReview = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setReview(data.review || data);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchReview();
    }, [reviewId]);

    if (loading) return <ActivityIndicator size="large" style={{flex:1}} />;

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center px-6 py-4 border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text className="text-xl font-bold ml-4">Client Feedback</Text>
            </View>

            <ScrollView className="p-6">
                {/* Stars Display */}
                <View className="flex-row mb-4">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons
                            key={s}
                            name={s <= review?.rating ? "star" : "star-outline"}
                            size={30}
                            color="#f59e0b"
                        />
                    ))}
                </View>

                <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Comment</Text>
                <Text className="text-lg text-slate-800 leading-6 mb-8 italic">
                    "{review?.comment}"
                </Text>

                {review?.images?.length > 0 && (
                    <View>
                        <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">Evidence Photos</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {review.images.map((img, i) => (
                                <Image
                                    key={i}
                                    source={{ uri: img }}
                                    className="w-24 h-24 rounded-2xl bg-slate-100"
                                />
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
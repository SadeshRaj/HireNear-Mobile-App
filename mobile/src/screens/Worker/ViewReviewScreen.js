import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, ActivityIndicator, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ViewReviewScreen({ route, navigation }) {
    const { reviewId } = route.params;
    const [loading, setLoading] = useState(true);
    const [review, setReview] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

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

    if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: 'bold', marginLeft: 16 }}>Client Feedback</Text>
            </View>

            {/* Main Content */}
            <ScrollView contentContainerStyle={{ padding: 24 }}>
                {/* Stars */}
                <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons
                            key={s}
                            name={s <= review?.rating ? "star" : "star-outline"}
                            size={30}
                            color="#f59e0b"
                        />
                    ))}
                </View>

                {/* Comment */}
                <Text style={{ color: '#64748b', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 }}>Comment</Text>
                <Text style={{ fontSize: 18, color: '#1e293b', marginBottom: 32, fontStyle: 'italic' }}>
                    "{review?.comment}"
                </Text>

                {/* Evidence Photos */}
                {review?.images?.length > 0 && (
                    <View style={{ marginBottom: 40 }}>
                        <Text style={{ color: '#64748b', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12 }}>Evidence Photos</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                            {review.images.map((img, i) => {
                                if (!img) return null;

                                // Format URL safely
                                const safeImgPath = img.replace(/\\/g, '/');
                                const finalPath = safeImgPath.startsWith('/') ? safeImgPath : `/${safeImgPath}`;
                                const fullUrl = `${API_BASE_URL.replace('/api', '')}${finalPath}`;

                                return (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => setSelectedImage(fullUrl)}
                                        style={{ marginRight: 8, marginBottom: 8 }}
                                    >
                                        <Image
                                            source={{ uri: fullUrl }}
                                            // FORCING strict dimensions here so they don't disappear
                                            style={styles.thumbnail}
                                        />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Pop-up Image Viewer */}
            <Modal visible={!!selectedImage} transparent={true} animationType="fade">
                <View style={styles.modalBackground}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setSelectedImage(null)}
                    >
                        <Ionicons name="close" size={32} color="white" />
                    </TouchableOpacity>

                    {selectedImage && (
                        <Image
                            source={{ uri: selectedImage }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// Hardcoded styles to bypass NativeWind bugs
const styles = StyleSheet.create({
    thumbnail: {
        width: 100,
        height: 100,
        borderRadius: 12,
        backgroundColor: '#e2e8f0',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    fullImage: {
        width: '100%',
        height: '80%',
    }
});
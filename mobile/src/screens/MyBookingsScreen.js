import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, View, ActivityIndicator, Text, RefreshControl, Alert } from 'react-native';
import { getMyBookings } from '../services/bookingService';
import BookingCard from '../components/BookingCard';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MyBookingsScreen = ({ navigation }) => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const loadData = async (silent = false) => {
        try {
            if (!silent) setLoading(true);

            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setCurrentUser(parsedUser);
            }

            const data = await getMyBookings();

            // Ensure data is an array before sorting
            const sortedData = Array.isArray(data) ? [...data].sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            ) : [];

            setBookings(sortedData);
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    useEffect(() => {
        const interval = setInterval(() => loadData(true), 10000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !refreshing) return <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />;

    return (
        <View className="flex-1 bg-gray-50 p-2">
            <FlatList
                data={bookings}
                keyExtractor={(item) => item._id}
                extraData={{ bookings, currentUser }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
                }
                renderItem={({ item }) => (
                    <BookingCard
                        booking={item}
                        currentUser={currentUser}
                        onRefresh={() => loadData(true)}
                        // Action for worker to go to completion screen
                        onAction={(id) => navigation.navigate('CompleteJob', { bookingId: id })}

                        // FIX: Pull the first image from the attachments array
                        onViewProof={() => {
                            // Check if attachments exist and have at least one URL
                            const proofUrl = item.attachments && item.attachments.length > 0
                                ? item.attachments[0]
                                : null;

                            if (proofUrl) {
                                navigation.navigate('ViewWorkProof', {
                                    imageUrl: proofUrl,
                                    // Make sure case matches your schema (jobId vs jobID)
                                    title: item.jobId?.title || item.jobID?.title || "Work Proof"
                                });
                            } else {
                                Alert.alert(
                                    "Notice",
                                    "The image is still being processed or was not uploaded. Please refresh in a moment."
                                );
                            }
                        }}
                    />
                )}
                ListEmptyComponent={<Text className="text-center mt-10 text-gray-500">No bookings found.</Text>}
            />
        </View>
    );
};

export default MyBookingsScreen;
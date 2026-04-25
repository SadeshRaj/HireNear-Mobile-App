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
            // Sort by newest first so the most recent completion is at the top
            const sortedData = data ? [...data].sort((a, b) =>
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
                // IMPORTANT: Tells FlatList to re-render when user or bookings change
                extraData={{ bookings, currentUser }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} />
                }
                renderItem={({ item }) => (
                    <BookingCard
                        booking={item}
                        currentUser={currentUser}
                        onRefresh={() => loadData(true)}
                        // Action for worker
                        onAction={(id) => navigation.navigate('CompleteJob', { bookingId: id })}
                        // Action for client (THE LINK)
                        onViewProof={(imageUrl) => {
                            if (imageUrl) {
                                navigation.navigate('ViewWorkProof', {
                                    imageUrl,
                                    title: item.jobID?.title
                                });
                            } else {
                                Alert.alert("Notice", "The image is still being processed. Please refresh in a moment.");
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
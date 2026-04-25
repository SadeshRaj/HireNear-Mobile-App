import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    ActivityIndicator,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMyBookings, cancelBooking } from '../services/bookingService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const SchedulesScreen = () => {
    const navigation = useNavigation();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    const loadData = async (showLoader = true) => {
        try {
            if (showLoader && !refreshing) setLoading(true);

            // Get user from storage to differentiate Worker vs Client
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                // Handle both MongoDB 'id' and '_id' formats
                setCurrentUserId(String(parsedUser.id || parsedUser._id));
            }

            const data = await getMyBookings();

            // Sort by latest created
            const finalData = Array.isArray(data) ? data.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            ) : [];

            setBookings(finalData);
        } catch (error) {
            console.error("Fetch Error:", error);
            if (showLoader) Alert.alert("Error", "Failed to load schedule.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Auto-refresh when user navigates back to this screen
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    // Background sync every 20 seconds
    useEffect(() => {
        const interval = setInterval(() => loadData(false), 20000);
        return () => clearInterval(interval);
    }, [currentUserId]);

    const handleCancel = (bookingId) => {
        Alert.alert(
            "Cancel Booking",
            "Are you sure you want to cancel this booking?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await cancelBooking(bookingId);
                            Alert.alert("Success", "Booking cancelled.");
                            loadData(false);
                        } catch (error) {
                            Alert.alert("Error", "Could not cancel booking.");
                        }
                    }
                }
            ]
        );
    };

    const getStatusTheme = (status) => {
        const s = status?.toLowerCase();
        switch (s) {
            case 'completed': return { color: '#059669', bg: '#d1fae5' };
            case 'pending': return { color: '#d97706', bg: '#fef3c7' };
            case 'cancelled': return { color: '#dc2626', bg: '#fee2e2' };
            default: return { color: '#2563eb', bg: '#dbeafe' };
        }
    };

    const renderItem = ({ item }) => {
        // Robust ID check: ensures strings match regardless of object nesting
        const workerId = item.workerId?._id || item.workerId;
        const isWorker = String(currentUserId) === String(workerId);

        const theme = getStatusTheme(item.status);
        const isCompleted = item.status?.toLowerCase() === 'completed';
        const isCancelled = item.status?.toLowerCase() === 'cancelled';

        return (
            <View style={styles.card}>
                <View style={styles.infoRow}>
                    <Text style={styles.jobTitle} numberOfLines={1}>
                        {item.jobID?.title || "Work Project"}
                    </Text>
                    <View style={[styles.statusPill, { backgroundColor: theme.bg }]}>
                        <Text style={[styles.statusText, { color: theme.color }]}>
                            {item.status || "Pending"}
                        </Text>
                    </View>
                </View>

                <Text style={styles.subText}>
                    {isWorker ? `👤 Client: ${item.clientId?.name || 'User'}` : `🛠️ Worker: ${item.workerId?.name || 'Pro'}`}
                </Text>

                <View style={styles.divider} />

                {isCompleted ? (
                    <View>
                        <View style={styles.verifiedBox}>
                            <Text style={styles.doneLabel}>✅ Work Finished & Verified</Text>
                        </View>

                        {/* THE KEY FIX: Logic to show proof button to Client */}
                        {!isWorker && (
                            <TouchableOpacity
                                style={styles.viewProofBtn}
                                onPress={() => {
                                    const images = item.completionImages || [];
                                    if (images.length === 0) return Alert.alert("No Image", "The worker didn't upload a proof photo.");

                                    navigation.navigate('ViewWorkProof', {
                                        imageUrl: images[0],
                                        title: item.jobID?.title
                                    });
                                }}
                            >
                                <Text style={styles.viewProofBtnText}>🔍 View Work Proof</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : isCancelled ? (
                    <Text style={styles.cancelLabel}>This booking was cancelled</Text>
                ) : (
                    <View>
                        {isWorker ? (
                            <TouchableOpacity
                                style={styles.primaryBtn}
                                onPress={() => navigation.navigate('CompleteJob', { bookingId: item._id })}
                            >
                                <Text style={styles.primaryBtnText}>Complete Job</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.waitingBox}>
                                <ActivityIndicator size="small" color="#64748b" />
                                <Text style={styles.waitingText}>Waiting for worker to finish...</Text>
                            </View>
                        )}
                        <TouchableOpacity onPress={() => handleCancel(item._id)} style={styles.secondaryBtn}>
                            <Text style={styles.secondaryBtnText}>Cancel Booking</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Text style={styles.header}>My Schedule</Text>
            <FlatList
                data={bookings}
                keyExtractor={(item) => item._id}
                contentContainerStyle={{ paddingBottom: 30 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); loadData(); }}
                        colors={['#2563eb']}
                    />
                }
                renderItem={renderItem}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No bookings yet</Text>
                        <Text style={styles.emptySubText}>Bookings you make or accept will appear here.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc', paddingHorizontal: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { fontSize: 28, fontWeight: '800', color: '#1e293b', marginVertical: 20 },
    card: {
        backgroundColor: '#fff',
        padding: 18,
        borderRadius: 20,
        marginBottom: 16,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6
    },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    jobTitle: { fontSize: 19, fontWeight: '700', color: '#0f172a', flex: 1 },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontWeight: '800', fontSize: 10, textTransform: 'uppercase' },
    subText: { color: '#64748b', fontSize: 14, marginBottom: 12, fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 15 },
    verifiedBox: { backgroundColor: '#f0fdf4', padding: 10, borderRadius: 12, marginBottom: 10 },
    doneLabel: { textAlign: 'center', color: '#166534', fontWeight: '700', fontSize: 14 },
    cancelLabel: { textAlign: 'center', color: '#ef4444', fontStyle: 'italic', paddingVertical: 10 },
    primaryBtn: { backgroundColor: '#2563eb', padding: 15, borderRadius: 14, alignItems: 'center' },
    primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    secondaryBtn: { marginTop: 15, paddingVertical: 8, alignItems: 'center' },
    secondaryBtnText: { color: '#94a3b8', fontSize: 13, textDecorationLine: 'underline' },
    waitingBox: { flexDirection: 'row', backgroundColor: '#f8fafc', padding: 14, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    waitingText: { color: '#64748b', marginLeft: 10, fontSize: 14, fontWeight: '500' },
    viewProofBtn: {
        backgroundColor: '#fff',
        padding: 14,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        alignItems: 'center',
        marginTop: 5
    },
    viewProofBtnText: { color: '#1e293b', fontWeight: '800', fontSize: 15 },
    emptyContainer: { alignItems: 'center', marginTop: 100 },
    emptyText: { fontSize: 18, fontWeight: 'bold', color: '#64748b' },
    emptySubText: { color: '#94a3b8', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }
});

export default SchedulesScreen;
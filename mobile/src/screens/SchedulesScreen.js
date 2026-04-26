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

            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsedUser = JSON.parse(userData);
                setCurrentUserId(String(parsedUser.id || parsedUser._id));
            }

            const data = await getMyBookings();
            const finalData = Array.isArray(data) ? data.sort((a, b) =>
                new Date(b.createdAt) - new Date(a.createdAt)
            ) : [];

            setBookings(finalData);
        } catch (error) {
            console.error("Fetch Error:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

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
                            Alert.alert("Success", "Booking has been cancelled.");
                            loadData(false); // Refresh list
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
        const workerId = item.workerId?._id || item.workerId;
        const isWorker = String(currentUserId) === String(workerId);
        const theme = getStatusTheme(item.status);

        const status = item.status?.toLowerCase() || 'pending';
        const isCompleted = status === 'completed';
        const isCancelled = status === 'cancelled';
        const actualJobTitle = item.jobId?.title || item.jobID?.title || "Work Project";

        return (
            <View style={styles.card}>
                <View style={styles.infoRow}>
                    <Text style={styles.jobTitle} numberOfLines={1}>{actualJobTitle}</Text>
                    <View style={[styles.statusPill, { backgroundColor: theme.bg }]}>
                        <Text style={[styles.statusText, { color: theme.color }]}>{item.status || "Pending"}</Text>
                    </View>
                </View>

                <Text style={styles.subText}>
                    {isWorker ? `👤 Client: ${item.clientId?.name || 'User'}` : `🛠️ Worker: ${item.workerId?.name || 'Pro'}`}
                </Text>

                <View style={styles.divider} />

                {/* --- COMPLETED STATE --- */}
                {isCompleted ? (
                    <View>
                        <View style={styles.verifiedBox}>
                            <Text style={styles.doneLabel}>✅ Work Finished & Verified</Text>
                        </View>
                        {!isWorker && (
                            <TouchableOpacity
                                style={styles.viewProofBtn}
                                onPress={() => {
                                    const proofUrl = item.attachments?.[0] || item.completionImages?.[0];
                                    if (!proofUrl) return Alert.alert("Processing", "Proof image is being generated.");
                                    navigation.navigate('ViewWorkProof', { imageUrl: proofUrl, title: actualJobTitle });
                                }}
                            >
                                <Text style={styles.viewProofBtnText}>🔍 View Work Proof</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : isCancelled ? (
                    /* --- CANCELLED STATE --- */
                    <View style={styles.waitingBox}>
                        <Text style={styles.cancelLabel}>🚫 This booking was cancelled</Text>
                    </View>
                ) : (
                    /* --- ACTIVE STATE (PENDING/SCHEDULED) --- */
                    <View>
                        {isWorker ? (
                            <TouchableOpacity
                                style={styles.primaryBtn}
                                onPress={() => navigation.navigate('CompleteJob', { bookingId: item._id })}
                            >
                                <Text style={styles.primaryBtnText}>Upload Proof & Complete</Text>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.waitingBox}>
                                <Text style={styles.waitingText}>⏳ Waiting for worker completion...</Text>
                            </View>
                        )}

                        {/* Cancel Button appears for both Worker and Client while job is active */}
                        <TouchableOpacity
                            onPress={() => handleCancel(item._id)}
                            style={styles.secondaryBtn}
                        >
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
                renderItem={renderItem}
                keyExtractor={item => item._id}
                contentContainerStyle={{ paddingBottom: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(false)} />}
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
        shadowOpacity: 0.05,
        shadowRadius: 10
    },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    jobTitle: { fontSize: 19, fontWeight: '700', color: '#0f172a', flex: 1 },
    statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { fontWeight: '800', fontSize: 10, textTransform: 'uppercase' },
    subText: { color: '#64748b', fontSize: 14, marginBottom: 12, fontWeight: '500' },
    divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 15 },
    verifiedBox: { backgroundColor: '#f0fdf4', padding: 10, borderRadius: 12, marginBottom: 10 },
    doneLabel: { textAlign: 'center', color: '#166534', fontWeight: '700' },
    cancelLabel: { textAlign: 'center', color: '#ef4444', fontWeight: '600', fontStyle: 'italic' },
    primaryBtn: { backgroundColor: '#2563eb', padding: 15, borderRadius: 14, alignItems: 'center' },
    primaryBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    secondaryBtn: { marginTop: 15, paddingVertical: 8, alignItems: 'center' },
    secondaryBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
    waitingBox: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 12 },
    waitingText: { color: '#64748b', textAlign: 'center', fontWeight: '500' },
    viewProofBtn: { backgroundColor: '#fff', padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: '#e2e8f0', alignItems: 'center', marginTop: 10 },
    viewProofBtnText: { color: '#1e293b', fontWeight: '800' }
});

export default SchedulesScreen;
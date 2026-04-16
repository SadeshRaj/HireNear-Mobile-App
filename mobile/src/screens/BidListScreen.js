import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import BidCard from '../components/BidCard';
import { getBidsForJob, acceptBid, rejectBid } from '../services/bidService';

/**
 * BidListScreen — Client view of all bids on their job
 * Route params: { job: { _id, title } }
 */
export default function BidListScreen({ navigation, route }) {
    const { job } = route.params || {};
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchBids = useCallback(async () => {
        try {
            const data = await getBidsForJob(job._id);
            if (Array.isArray(data)) {
                setBids(data);
            } else {
                setError(data.msg || 'Failed to load bids.');
            }
        } catch {
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [job._id]);

    useEffect(() => { fetchBids(); }, [fetchBids]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBids();
    };

    const handleAccept = (bidId) => {
        Alert.alert(
            'Accept Bid',
            'Are you sure? All other bids for this job will be rejected.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Accept',
                    onPress: async () => {
                        const result = await acceptBid(bidId);
                        if (result.bid) {
                            Alert.alert('Done! ✅', 'Bid accepted. All other bids have been rejected.');
                            fetchBids();
                        } else {
                            Alert.alert('Error', result.msg || 'Something went wrong.');
                        }
                    }
                }
            ]
        );
    };

    const handleReject = (bidId) => {
        Alert.alert(
            'Reject Bid',
            'Are you sure you want to reject this bid?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await rejectBid(bidId);
                        if (result.bid) fetchBids();
                        else Alert.alert('Error', result.msg || 'Something went wrong.');
                    }
                }
            ]
        );
    };

    const nearbyCount = bids.filter(b => b.isNearby && b.status === 'pending').length;

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">

            {/* Header */}
            <View className="px-6 pt-4 pb-4">
                <View className="flex-row items-center mb-4">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="w-11 h-11 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100 mr-4"
                    >
                        <Ionicons name="arrow-back" size={22} color="#0f172a" />
                    </TouchableOpacity>
                    <View className="flex-1">
                        <Text className="text-2xl font-extrabold text-slate-900 tracking-tight" numberOfLines={1}>
                            Bids
                        </Text>
                        <Text className="text-slate-500 text-sm font-medium" numberOfLines={1}>
                            {job?.title || 'Job'}
                        </Text>
                    </View>
                </View>

                {/* Stats strip */}
                <View className="flex-row gap-3">
                    <View className="bg-white rounded-2xl px-4 py-2.5 shadow-sm border border-gray-100 flex-row items-center">
                        <Ionicons name="people-outline" size={16} color="#475569" />
                        <Text className="text-slate-700 font-bold ml-1.5 text-sm">{bids.length} bids</Text>
                    </View>
                    {nearbyCount > 0 && (
                        <View className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-2.5 flex-row items-center">
                            <Text>🔥</Text>
                            <Text className="text-orange-600 font-bold ml-1.5 text-sm">{nearbyCount} nearby</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Sort note */}
            {bids.length > 0 && (
                <View className="px-6 mb-3">
                    <Text className="text-xs text-slate-400 font-medium">
                        Sorted by distance · price
                    </Text>
                </View>
            )}

            {/* Content */}
            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#0f172a" />
                </View>
            ) : error ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Ionicons name="wifi-outline" size={48} color="#cbd5e1" />
                    <Text className="text-slate-400 font-semibold mt-3 text-center">{error}</Text>
                    <TouchableOpacity
                        className="mt-5 bg-slate-900 rounded-2xl px-6 py-3"
                        onPress={fetchBids}
                    >
                        <Text className="text-white font-bold">Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : bids.length === 0 ? (
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-5xl mb-4">📭</Text>
                    <Text className="text-slate-700 text-xl font-bold mb-2">No Bids Yet</Text>
                    <Text className="text-slate-400 text-center font-medium">
                        Workers haven't submitted proposals yet. Check back soon!
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={bids}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    renderItem={({ item }) => (
                        <BidCard
                            bid={item}
                            mode="client"
                            onAccept={handleAccept}
                            onReject={handleReject}
                        />
                    )}
                />
            )}
        </SafeAreaView>
    );
}

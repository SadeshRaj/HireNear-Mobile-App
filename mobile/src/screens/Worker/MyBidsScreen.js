import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    Alert, ActivityIndicator, RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import BidCard from '../../components/BidCard';
import { getMyBids, withdrawBid } from '../../services/bidService';

const FILTERS = ['All', 'pending', 'accepted', 'rejected', 'withdrawn'];

/**
 * MyBidsScreen — Worker view of their own bid history
 */
export default function MyBidsScreen({ navigation }) {
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All');
    const [error, setError] = useState('');

    const fetchBids = useCallback(async () => {
        try {
            const status = activeFilter === 'All' ? null : activeFilter;
            const data = await getMyBids(status);
            if (Array.isArray(data)) {
                setBids(data);
                setError('');
            } else {
                setError(data.msg || 'Failed to load bids.');
            }
        } catch {
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeFilter]);

    useFocusEffect(
        useCallback(() => {
            fetchBids();
        }, [fetchBids])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchBids();
    };

    const handleWithdraw = (bidId) => {
        Alert.alert(
            'Withdraw Bid',
            'Are you sure you want to withdraw this bid?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Withdraw',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await withdrawBid(bidId);
                        if (result.bid || result.msg === 'Bid withdrawn successfully') {
                            fetchBids();
                        } else {
                            Alert.alert('Error', result.msg || 'Failed to withdraw.');
                        }
                    }
                }
            ]
        );
    };

    const handleEdit = (bid) => {
        navigation.navigate('EditBid', { bid });
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">

            {/* Header */}
            <View className="px-6 pt-4 pb-2">
                <View className="flex-row items-center mb-5">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="w-11 h-11 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100 mr-4"
                    >
                        <Ionicons name="arrow-back" size={22} color="#0f172a" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-2xl font-extrabold text-slate-900 tracking-tight">My Bids</Text>
                        <Text className="text-slate-500 text-sm font-medium">Your proposal history</Text>
                    </View>
                </View>

                {/* Filter Tabs */}
                <FlatList
                    data={FILTERS}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => setActiveFilter(item)}
                            className={`mr-2 px-4 py-2 rounded-full border ${
                                activeFilter === item
                                    ? 'bg-slate-900 border-slate-900'
                                    : 'bg-white border-gray-200'
                            }`}
                        >
                            <Text className={`text-sm font-bold capitalize ${
                                activeFilter === item ? 'text-white' : 'text-slate-500'
                            }`}>
                                {item}
                            </Text>
                        </TouchableOpacity>
                    )}
                    style={{ marginBottom: 16 }}
                />
            </View>

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
                    <Text className="text-5xl mb-4">📝</Text>
                    <Text className="text-slate-700 text-xl font-bold mb-2">No Bids Found</Text>
                    <Text className="text-slate-400 text-center font-medium">
                        {activeFilter === 'All'
                            ? "You haven't placed any bids yet."
                            : `No ${activeFilter} bids.`}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={bids}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    renderItem={({ item }) => {
                        const isAccepted = item.status === 'accepted';
                        return (
                            <TouchableOpacity
                                activeOpacity={0.8}
                                disabled={!isAccepted}
                                onPress={() => {
                                    navigation.navigate('WorkerBookingDetails', {
                                        jobId: item.jobId._id,
                                        jobTitle: item.jobId.title
                                    });
                                }}
                            >
                                <BidCard
                                    bid={item}
                                    mode="worker"
                                    onEdit={handleEdit}
                                    onWithdraw={handleWithdraw}
                                />
                            </TouchableOpacity>
                        );
                    }}
                />
            )}
        </SafeAreaView>
    );
}
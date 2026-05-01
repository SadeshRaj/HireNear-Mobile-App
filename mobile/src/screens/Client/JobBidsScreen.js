import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, ActivityIndicator,
    Image, Alert, Linking, RefreshControl, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../config';

const BidItem = ({ item, onAction, onNavigatePortfolio, onNavigateDetail }) => (
    <View className="bg-white rounded-[32px] p-5 mb-4 shadow-sm border border-gray-100">
        {item.status !== 'pending' ? (
            <View className={`self-start px-3 py-1 rounded-full mb-3 ${
                item.status === 'accepted' ? 'bg-emerald-100' : 'bg-rose-100'
            }`}>
                <Text className={`text-[10px] font-bold uppercase ${
                    item.status === 'accepted' ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                    {item.status}
                </Text>
            </View>
        ) : null}

        <TouchableOpacity 
            onPress={() => onNavigateDetail(item)}
            activeOpacity={0.7}
        >
            <View className="flex-row items-center mb-4">
                <View
                    className="w-14 h-14 bg-slate-100 rounded-2xl items-center justify-center overflow-hidden border border-gray-50"
                >
                    {item.workerId?.profileImage ? (
                        <Image source={{ uri: item.workerId.profileImage }} className="w-full h-full" />
                    ) : (
                        <FontAwesome5 name="user-alt" size={20} color="#94a3b8" />
                    )}
                </View>

                <View className="ml-3 flex-1">
                    <Text className="text-lg font-bold text-slate-900">{item.workerId?.name}</Text>

                    <View className="flex-row items-center mt-0.5">
                        <Text className="text-emerald-600 text-[10px] font-bold uppercase">View Details</Text>
                        <Ionicons name="chevron-forward" size={10} color="#059669" />
                    </View>

                    <View className="flex-row items-center mt-1">
                        <Ionicons name="location" size={12} color="#64748b" />
                        <Text className="text-slate-500 text-xs ml-1">
                            {item.distance !== null && item.distance !== undefined ? `${item.distance} km away` : 'Location N/A'}
                        </Text>
                    </View>
                </View>

                <View className="items-end">
                    <Text className="text-emerald-700 font-black text-lg">Rs.{(item.price || 0).toLocaleString()}</Text>
                    <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Quote</Text>
                </View>
            </View>

            <View className="bg-slate-50 rounded-2xl p-4 mb-4">
                <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1">Proposal</Text>
                <Text className="text-slate-700 text-sm leading-5" numberOfLines={2}>"{item.message}"</Text>
                {item.attachments?.length > 0 && (
                    <View className="flex-row items-center mt-2">
                        <Feather name="paperclip" size={12} color="#94a3b8" />
                        <Text className="text-slate-400 text-[10px] ml-1">{item.attachments.length} attachment(s)</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>

        {item.status === 'pending' ? (
            <View className="flex-row gap-2">
                <TouchableOpacity
                    className="flex-1 bg-slate-900 h-12 rounded-2xl items-center justify-center shadow-sm"
                    onPress={() => onAction(item._id, 'accept')}
                >
                    <Text className="text-white font-bold">Accept</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="w-12 h-12 bg-rose-50 rounded-2xl items-center justify-center"
                    onPress={() => onAction(item._id, 'reject')}
                >
                    <Ionicons name="close-outline" size={24} color="#e11d48" />
                </TouchableOpacity>

                <TouchableOpacity
                    className="w-12 h-12 bg-emerald-50 rounded-2xl items-center justify-center"
                    onPress={() => Linking.openURL(`tel:${item.workerId?.phone}`)}
                >
                    <Ionicons name="call" size={20} color="#059669" />
                </TouchableOpacity>
            </View>
        ) : (
            <View className="pt-2 border-t border-gray-100">
                <Text className="text-slate-400 text-xs text-center font-medium italic">
                    This bid has been {item.status}.
                </Text>
            </View>
        )}
    </View>
);

export default function JobBidsScreen({ route, navigation }) {
    const { jobId, jobTitle } = route.params;
    const [bids, setBids] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchBids = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/bids/job/${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            setBids(Array.isArray(data) ? data : data.bids || []);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not load bids.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBids();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBids();
    };

    const handleAction = async (bidId, action) => {
        const confirmMsg = action === 'accept'
            ? "Accepting this bid will automatically reject all other bids. Continue?"
            : "Are you sure you want to reject this bid?";

        Alert.alert(
            `${action.charAt(0).toUpperCase() + action.slice(1)} Bid`,
            confirmMsg,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            const token = await AsyncStorage.getItem('token');
                            const response = await fetch(`${API_BASE_URL}/bids/${bidId}/${action}`, {
                                method: 'PATCH',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });

                            if (response.ok) {
                                await fetchBids();
                            } else {
                                setLoading(false);
                                Alert.alert("Error", "Failed to update bid.");
                            }
                        } catch (error) {
                            setLoading(false);
                            Alert.alert("Error", "Network error.");
                        }
                    }
                }
            ]
        );
    };

    const sortedBids = React.useMemo(() => {
        return (bids || []).slice().sort((a, b) => {
            const distA = (a.distance !== null && a.distance !== undefined && !isNaN(a.distance)) ? Number(a.distance) : Infinity;
            const distB = (b.distance !== null && b.distance !== undefined && !isNaN(b.distance)) ? Number(b.distance) : Infinity;
            if (distA === distB) return 0;
            return distA - distB;
        });
    }, [bids]);

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <View className="px-5 pt-4 pb-4 flex-row items-center">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100"
                >
                    <Ionicons name="arrow-back" size={20} color="#0f172a" />
                </TouchableOpacity>
                <View className="ml-4 flex-1">
                    <Text className="text-2xl font-black text-slate-900">Bids received</Text>
                    <Text className="text-slate-500 text-xs font-medium" numberOfLines={1}>{jobTitle}</Text>
                </View>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#0f172a" />
                </View>
            ) : (
                <View className="flex-1">
                    <ScrollView 
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                    >
                        {sortedBids.length > 0 ? (
                            sortedBids.map((item, index) => (
                                <BidItem 
                                    key={item._id || index.toString()} 
                                    item={item} 
                                    onAction={handleAction}
                                    onNavigatePortfolio={(workerId) => navigation.navigate('WorkerPortfolio', { workerId })} 
                                    onNavigateDetail={(bid) => navigation.navigate('BidDetail', { bid, refreshBids: fetchBids })}
                                />
                            ))
                        ) : (
                            <View className="items-center mt-20">
                                <MaterialCommunityIcons name="comment-search-outline" size={80} color="#e2e8f0" />
                                <Text className="text-slate-400 font-bold mt-4">No bids found for this job yet.</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            )}
        </SafeAreaView>
    );
}
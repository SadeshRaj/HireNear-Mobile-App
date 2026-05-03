import React from 'react';
import {
    View, Text, TouchableOpacity, ScrollView, Image,
    Alert, Linking, Dimensions, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../config';

const { width } = Dimensions.get('window');

export default function BidDetailScreen({ route, navigation }) {
    const { bid, onAction } = route.params;
    const worker = bid.workerId || {};

    const handleAction = async (action) => {
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
                        try {
                            const token = await AsyncStorage.getItem('token');
                            const response = await fetch(`${API_BASE_URL}/bids/${bid._id}/${action}`, {
                                method: 'PATCH',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });

                            if (response.ok) {
                                Alert.alert("Success", `Bid ${action}ed successfully.`);
                                navigation.navigate({
                                    name: 'JobBids',
                                    params: { refresh: Date.now() },
                                    merge: true,
                                });
                            } else {
                                Alert.alert("Error", "Failed to update bid.");
                            }
                        } catch (error) {
                            Alert.alert("Error", "Network error.");
                        }
                    }
                }
            ]
        );
    };

    const renderAttachment = (url, index) => {
        const isImage = url.match(/\.(jpeg|jpg|gif|png)$/i);
        // Ensure we have a full URL (handle local paths from server)
        const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}/${url.replace(/\\/g, '/')}`;
        
        return (
            <TouchableOpacity 
                key={index} 
                onPress={() => Linking.openURL(fullUrl)}
                className="bg-white rounded-3xl p-2 mb-4 shadow-sm border border-gray-100"
            >
                {isImage ? (
                    <Image 
                        source={{ uri: fullUrl }} 
                        style={{ width: '100%', height: 200, borderRadius: 20 }}
                        resizeMode="cover"
                    />
                ) : (
                    <View className="flex-row items-center p-4">
                        <Feather name="file-text" size={24} color="#64748b" />
                        <Text className="ml-3 text-slate-600 font-medium flex-1" numberOfLines={1}>
                            {url.split('/').pop()}
                        </Text>
                        <Ionicons name="download-outline" size={20} color="#059669" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <View className="px-5 pt-4 pb-4 flex-row items-center justify-between">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100"
                >
                    <Ionicons name="arrow-back" size={20} color="#0f172a" />
                </TouchableOpacity>
                <Text className="text-xl font-black text-slate-900">Bid Details</Text>
                <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:${worker.phone}`)}
                    className="w-10 h-10 bg-emerald-50 rounded-full items-center justify-center border border-emerald-100"
                >
                    <Ionicons name="call" size={18} color="#059669" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
                {/* Worker Profile Section */}
                <View className="bg-white rounded-[32px] p-6 mb-6 shadow-sm border border-gray-100 mt-2">
                    <View className="flex-row items-center mb-4">
                        <View className="w-16 h-16 bg-slate-100 rounded-2xl items-center justify-center overflow-hidden border border-gray-50">
                            {worker.profileImage ? (
                                <Image source={{ uri: worker.profileImage }} className="w-full h-full" />
                            ) : (
                                <FontAwesome5 name="user-alt" size={24} color="#94a3b8" />
                            )}
                        </View>
                        <View className="ml-4 flex-1">
                            <Text className="text-xl font-bold text-slate-900">{worker.name}</Text>
                            <TouchableOpacity 
                                onPress={() => navigation.navigate('WorkerPortfolio', { workerId: worker._id })}
                                className="flex-row items-center mt-1"
                            >
                                <Text className="text-emerald-600 text-xs font-bold uppercase">View Portfolio</Text>
                                <Ionicons name="chevron-forward" size={12} color="#059669" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="flex-row flex-wrap gap-2 mb-4">
                        {worker.skills?.map((skill, i) => (
                            <View key={i} className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                <Text className="text-slate-500 text-[10px] font-bold">{skill}</Text>
                            </View>
                        ))}
                    </View>

                    <View className="flex-row items-center pt-4 border-t border-gray-50">
                        <View className="flex-1">
                            <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1">Quote</Text>
                            <Text className="text-emerald-700 font-black text-xl">Rs.{(bid.price || 0).toLocaleString()}</Text>
                        </View>
                        <View className="flex-1 items-end">
                            <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1">Estimated Time</Text>
                            <Text className="text-slate-700 font-bold text-base">{bid.estimatedTime || 'N/A'}</Text>
                        </View>
                    </View>
                </View>

                {/* Proposal Section */}
                <View className="mb-6">
                    <Text className="text-slate-900 font-black text-lg mb-3 ml-1">The Proposal</Text>
                    <View className="bg-white rounded-[32px] p-6 shadow-sm border border-gray-100">
                        <Text className="text-slate-600 text-base leading-6">
                            {bid.message || "No message included in this bid."}
                        </Text>
                    </View>
                </View>

                {/* Attachments Section */}
                {bid.attachments?.length > 0 && (
                    <View className="mb-8">
                        <Text className="text-slate-900 font-black text-lg mb-3 ml-1">Sketches & Files</Text>
                        {bid.attachments.map((url, index) => renderAttachment(url, index))}
                    </View>
                )}

                {/* Bottom Spacer */}
                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Fixed Action Buttons */}
            {bid.status === 'pending' && (
                <View className="absolute bottom-8 left-5 right-5 flex-row gap-3">
                    <TouchableOpacity
                        className="flex-1 bg-slate-900 h-16 rounded-3xl items-center justify-center shadow-lg"
                        onPress={() => handleAction('accept')}
                    >
                        <Text className="text-white font-black text-lg">Accept Bid</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="w-16 h-16 bg-rose-50 rounded-3xl items-center justify-center border border-rose-100 shadow-sm"
                        onPress={() => handleAction('reject')}
                    >
                        <Ionicons name="close-outline" size={32} color="#e11d48" />
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

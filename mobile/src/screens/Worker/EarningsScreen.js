import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function EarningsScreen({ navigation }) {
    const [invoices, setInvoices] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchEarnings = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/invoices/earnings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setInvoices(data.invoices);
                setTotalRevenue(data.totalRevenue);
            }
        } catch (err) {
            console.error("Fetch earnings error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchEarnings();
        }, [fetchEarnings])
    );

    if (loading) return <SafeAreaView className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#0f172a" /></SafeAreaView>;

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <View className="px-6 py-6 bg-slate-900 rounded-b-3xl shadow-md">
                <Text className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-1">Total Revenue</Text>
                <Text className="text-4xl font-black text-white">LKR {totalRevenue.toLocaleString()}</Text>
            </View>

            <View className="flex-1 px-5 pt-6">
                <Text className="text-lg font-extrabold text-slate-800 mb-4">Received Payments</Text>
                {invoices.length === 0 ? (
                    <View className="items-center justify-center mt-10">
                        <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
                        <Text className="text-slate-500 font-medium mt-3">No payments received yet.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={invoices}
                        keyExtractor={(item) => item._id}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('InvoiceDetails', { bookingId: item.bookingId, role: 'worker' })}
                                className="bg-white p-4 rounded-2xl mb-3 shadow-sm border border-gray-100 flex-row items-center justify-between"
                            >
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 bg-emerald-100 rounded-full items-center justify-center mr-3">
                                        <Ionicons name="cash" size={20} color="#059669" />
                                    </View>
                                    <View>
                                        <Text className="text-slate-900 font-bold">{item.clientId?.name || 'Client'}</Text>
                                        <Text className="text-slate-400 text-xs mt-0.5">{new Date(item.createdAt).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                                <Text className="text-emerald-600 font-extrabold">LKR {item.totalAmount}</Text>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
        </SafeAreaView>
    );
}
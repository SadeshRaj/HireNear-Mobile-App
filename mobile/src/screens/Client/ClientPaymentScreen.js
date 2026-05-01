import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Image, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function ClientPaymentScreen({ route, navigation }) {
    const { bookingId } = route.params;
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/invoices/booking/${bookingId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) setInvoice(data.invoice);
            } catch (err) {
                console.log(err);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [bookingId]);

    const handleUploadSlip = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
        });

        if (!result.canceled) {
            setUploading(true);
            const formData = new FormData();
            const uri = Platform.OS === 'ios' ? result.assets[0].uri.replace('file://', '') : result.assets[0].uri;

            formData.append('slip', {
                uri: uri,
                name: 'slip.jpg',
                type: 'image/jpeg',
            });

            try {
                const token = await AsyncStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/invoices/${invoice._id}/pay`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    setInvoice(data.invoice);
                    Alert.alert("Success", "Payment slip uploaded!");
                }
            } catch (err) {
                Alert.alert("Error", "Upload failed");
            } finally {
                setUploading(false);
            }
        }
    };

    if (loading) return <SafeAreaView className="flex-1 justify-center items-center"><ActivityIndicator size="large" /></SafeAreaView>;

    if (!invoice) return (
        <SafeAreaView className="flex-1 justify-center items-center bg-[#F8F9FB]">
            <Text className="text-slate-500 font-bold">Worker hasn't generated an invoice yet.</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 p-3 bg-slate-200 rounded-xl">
                <Text>Go Back</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <View className="px-5 py-4 flex-row items-center bg-white shadow-sm border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-slate-50 rounded-full">
                    <Ionicons name="arrow-back" size={22} color="#334155" />
                </TouchableOpacity>
                <Text className="ml-4 text-xl font-extrabold text-slate-800">Invoice Details</Text>
            </View>

            <ScrollView className="p-5 flex-1" showsVerticalScrollIndicator={false}>
                <View className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 mb-6">
                    <Text className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-3">Items Billed</Text>
                    {invoice.items.map((item, index) => (
                        <View key={index} className="flex-row justify-between mb-3 border-b border-gray-50 pb-2">
                            <Text className="text-slate-700">{item.description}</Text>
                            <Text className="font-bold text-slate-900">LKR {item.amount}</Text>
                        </View>
                    ))}
                    <View className="flex-row justify-between mt-2 pt-2">
                        <Text className="text-lg font-bold text-slate-500">Total Due</Text>
                        <Text className="text-2xl font-black text-emerald-600">LKR {invoice.totalAmount}</Text>
                    </View>
                </View>

                {invoice.status === 'pending' ? (
                    <TouchableOpacity
                        onPress={handleUploadSlip}
                        disabled={uploading}
                        className="bg-slate-900 p-4 rounded-2xl items-center flex-row justify-center"
                    >
                        {uploading ? <ActivityIndicator color="#fff" /> : (
                            <>
                                <Ionicons name="cloud-upload" size={24} color="#fff" />
                                <Text className="text-white text-lg font-bold ml-2">Upload Payment Slip</Text>
                            </>
                        )}
                    </TouchableOpacity>
                ) : (
                    <View className="items-center bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                        <Ionicons name="checkmark-circle" size={48} color="#059669" />
                        <Text className="text-emerald-700 font-bold text-lg mt-2">Payment Uploaded</Text>
                        <Image source={{ uri: invoice.paymentSlipUrl }} className="w-full h-48 rounded-xl mt-4 bg-gray-200" resizeMode="cover" />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
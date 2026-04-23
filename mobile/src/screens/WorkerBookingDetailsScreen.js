import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function WorkerBookingDetailsScreen({ route, navigation }) {
    const { jobId } = route.params;
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [invoiceExists, setInvoiceExists] = useState(false);

    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const fetchBookingDetails = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/bookings/job/${jobId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();

            if (isMounted.current && data.success) {
                setBooking(data.booking);

                // If job is completed, check if invoice is already generated
                if (data.booking.status === 'completed') {
                    try {
                        const invRes = await fetch(`${API_BASE_URL}/invoices/booking/${data.booking._id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (invRes.ok) {
                            const invData = await invRes.json();
                            if (invData.success && invData.invoice) {
                                setInvoiceExists(true);
                            }
                        }
                    } catch (e) {
                        console.log("Invoice check error (ignored):", e);
                    }
                }
            }
        } catch (error) {
            if (isMounted.current) Alert.alert("Error", "Failed to load details");
        } finally {
            if (isMounted.current) setLoading(false);
        }
    }, [jobId]);

    // This ensures data refreshes automatically when returning from CreateInvoiceScreen
    useFocusEffect(
        useCallback(() => {
            setLoading(true);
            fetchBookingDetails();
        }, [fetchBookingDetails])
    );

    const handleUploadProof = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.status !== 'granted') {
                Alert.alert("Permission Required", "We need access to your gallery.");
                return;
            }

            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsMultipleSelection: true,
                quality: 0.7,
            });

            if (!result.canceled) {
                setUploading(true);
                const formData = new FormData();

                result.assets.forEach((asset, index) => {
                    const uri = Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri;
                    formData.append('images', {
                        uri: uri,
                        name: `proof_${index}.jpg`,
                        type: 'image/jpeg',
                    });
                });

                const token = await AsyncStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/bookings/${booking._id}/upload-proof`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });

                const responseText = await res.text();
                let data;
                try {
                    data = JSON.parse(responseText);
                } catch (parseError) {
                    throw new Error("Server error processing image upload.");
                }

                if (isMounted.current) {
                    if (data.success) {
                        setBooking(data.booking);
                        Alert.alert("Success", "Work photos added successfully!");
                    } else {
                        throw new Error(data.msg || "Upload failed from server.");
                    }
                }
            }
        } catch (err) {
            if (isMounted.current) Alert.alert("Upload Error", err.message || "Something went wrong.");
        } finally {
            if (isMounted.current) setUploading(false);
        }
    };

    const updateStatus = async (status) => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/bookings/${booking._id}/status`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ status })
            });
            const data = await res.json();
            if (isMounted.current && data.success) setBooking(data.booking);
        } catch (err) {
            if (isMounted.current) Alert.alert("Error", "Status update failed");
        }
    };

    const getStatusUI = (status) => {
        switch (status) {
            case 'pending': return { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'time', label: 'Pending Approval' };
            case 'scheduled': return { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'calendar', label: 'Scheduled' };
            case 'in-progress': return { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'hammer', label: 'In Progress' };
            case 'completed': return { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'checkmark-circle', label: 'Completed' };
            default: return { bg: 'bg-gray-50', text: 'text-gray-600', icon: 'information-circle', label: status || 'Unknown' };
        }
    };

    if (loading) return (
        <View className="flex-1 justify-center items-center bg-[#F8F9FB]">
            <ActivityIndicator size="large" color="#0F172A" />
            <Text className="mt-4 text-slate-500 font-medium">Loading details...</Text>
        </View>
    );

    const statusUI = getStatusUI(booking?.status);

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <View className="px-5 py-4 flex-row items-center bg-white border-b border-gray-100 shadow-sm">
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    className="p-2 bg-slate-50 rounded-full border border-slate-100"
                >
                    <Ionicons name="arrow-back" size={22} color="#334155" />
                </TouchableOpacity>
                <Text className="ml-4 text-xl font-bold text-slate-800">Job Details</Text>
            </View>

            <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
                <View className="bg-white p-5 rounded-2xl mb-5 border border-gray-100 shadow-sm">
                    <Text className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-3">Current Status</Text>
                    <View className={`flex-row items-center self-start px-4 py-2 rounded-xl ${statusUI.bg}`}>
                        <Ionicons name={statusUI.icon} size={20} className={statusUI.text} />
                        <Text className={`ml-2 font-bold text-base ${statusUI.text}`}>
                            {statusUI.label}
                        </Text>
                    </View>
                </View>

                <View className="bg-white p-5 rounded-2xl mb-6 border border-gray-100 shadow-sm">
                    <View className="flex-row items-center mb-4">
                        <Ionicons name="camera-outline" size={22} color="#334155" />
                        <Text className="ml-2 font-bold text-lg text-slate-800">Work Evidence</Text>
                    </View>

                    {booking?.attachments?.length > 0 ? (
                        <View className="flex-row flex-wrap -mx-1">
                            {booking.attachments.map((img, i) => (
                                <View key={i} className="p-1 w-1/3">
                                    <Image source={{ uri: img }} className="w-full aspect-square rounded-xl bg-slate-100" />
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View className="py-6 items-center justify-center bg-slate-50 rounded-xl">
                            <Ionicons name="images-outline" size={32} color="#CBD5E1" />
                            <Text className="text-slate-400 text-sm font-medium mt-2">No photos uploaded yet</Text>
                        </View>
                    )}

                    {booking?.status === 'in-progress' && (
                        <TouchableOpacity
                            onPress={handleUploadProof}
                            disabled={uploading}
                            className={`mt-4 border-2 border-dashed rounded-xl p-4 flex-row justify-center items-center
                                ${uploading ? 'border-slate-300 bg-slate-100' : 'border-indigo-300 bg-indigo-50'}`}
                        >
                            {uploading ? (
                                <ActivityIndicator size="small" color="#6366F1" />
                            ) : (
                                <Ionicons name="cloud-upload-outline" size={24} color="#4F46E5" />
                            )}
                            <Text className={`ml-2 font-bold text-base ${uploading ? 'text-slate-500' : 'text-indigo-600'}`}>
                                {uploading ? "Uploading..." : "Add Work Photos"}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>

            <View className="p-5 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                {booking?.status === 'pending' && (
                    <TouchableOpacity onPress={() => updateStatus('scheduled')} className="bg-slate-900 p-4 rounded-xl flex-row justify-center items-center">
                        <Ionicons name="checkmark-circle" size={22} color="white" />
                        <Text className="text-white text-lg font-bold ml-2">Accept Job</Text>
                    </TouchableOpacity>
                )}

                {booking?.status === 'scheduled' && (
                    <TouchableOpacity onPress={() => updateStatus('in-progress')} className="bg-indigo-600 p-4 rounded-xl flex-row justify-center items-center">
                        <Ionicons name="play" size={22} color="white" />
                        <Text className="text-white text-lg font-bold ml-2">Start Job</Text>
                    </TouchableOpacity>
                )}

                {booking?.status === 'in-progress' && (
                    <TouchableOpacity onPress={() => updateStatus('completed')} className="bg-emerald-500 p-4 rounded-xl flex-row justify-center items-center">
                        <Ionicons name="flag" size={22} color="white" />
                        <Text className="text-white text-lg font-bold ml-2">Mark as Completed</Text>
                    </TouchableOpacity>
                )}

                {booking?.status === 'completed' && (
                    <View className="gap-3">
                        {!invoiceExists ? (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('CreateInvoice', { bookingId: booking._id, clientName: booking.clientId?.name || 'Client' })}
                                className="bg-indigo-600 p-4 rounded-xl flex-row justify-center items-center shadow-sm"
                            >
                                <Ionicons name="document-text" size={22} color="white" />
                                <Text className="text-white text-lg font-bold ml-2">Generate Invoice</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('InvoiceDetails', { bookingId: booking._id, role: 'worker' })}
                                className="bg-emerald-600 p-4 rounded-xl flex-row justify-center items-center shadow-sm"
                            >
                                <Ionicons name="receipt" size={22} color="white" />
                                <Text className="text-white text-lg font-bold ml-2">View Invoice</Text>
                            </TouchableOpacity>
                        )}

                        <View className="bg-slate-100 p-4 rounded-xl flex-row justify-center items-center border border-slate-200">
                            <Ionicons name="lock-closed" size={20} color="#64748b" />
                            <Text className="text-slate-500 text-lg font-bold ml-2">Job Finished</Text>
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}
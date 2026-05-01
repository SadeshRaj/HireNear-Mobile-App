import React, { useState, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ImageView from "react-native-image-viewing";
import { useFocusEffect } from '@react-navigation/native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const STATUS_STEPS = ['pending', 'scheduled', 'in-progress', 'completed'];

export default function BookingDetailsScreen({ route, navigation }) {
    const { jobId, jobTitle } = route.params;

    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    const [visible, setVisible] = useState(false);
    const [currentImages, setCurrentImages] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const openImageViewer = (images, index) => {
        setCurrentImages(images.map(uri => ({ uri })));
        setCurrentIndex(index);
        setVisible(true);
    };

    const fetchBookingDetails = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/bookings/job/${jobId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            if (data.success) {
                setBooking(data.booking);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to load booking details");
        } finally {
            setLoading(false);
        }
    }, [jobId]);

    // This ensures data refreshes automatically when returning back
    useFocusEffect(
        useCallback(() => {
            fetchBookingDetails();
        }, [fetchBookingDetails])
    );

    const updateBookingStatus = async (status) => {
        const alertMsg = status === 'cancelled' ? "Are you sure you want to cancel?" : "Mark this job as finished?";

        Alert.alert("Confirm Action", alertMsg, [
            { text: "No", style: "cancel" },
            {
                text: "Yes", onPress: async () => {
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
                        if (data.success) {
                            setBooking(data.booking);
                            if (status === 'cancelled') navigation.goBack();
                        }
                    } catch (err) {
                        Alert.alert("Error", "Action failed");
                    }
                }
            }
        ]);
    };

    const getStepStatus = (index, currentStatus) => {
        const currentIndex = STATUS_STEPS.indexOf(currentStatus);
        if (index < currentIndex) return 'completed';
        if (index === currentIndex) return 'active';
        return 'upcoming';
    };

    if (loading) return (
        <SafeAreaView className="flex-1 justify-center items-center bg-white">
            <ActivityIndicator size="large" color="#000" />
        </SafeAreaView>
    );

    if (!booking) return null;

    const ImageGrid = ({ images, title, placeholder }) => (
        <View className="mb-6">
            <Text className="font-bold text-slate-800 mb-3">{title}</Text>
            {images && images.length > 0 ? (
                <View className="flex-row flex-wrap">
                    {images.map((img, i) => (
                        <TouchableOpacity
                            key={i}
                            onPress={() => openImageViewer(images, i)}
                        >
                            <Image source={{ uri: img }} className="w-24 h-24 m-1 rounded-xl bg-gray-200" />
                        </TouchableOpacity>
                    ))}
                </View>
            ) : (
                <View className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Text className="text-gray-400 text-center text-xs">{placeholder}</Text>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <View className="px-5 pt-4 pb-4 flex-row items-center bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-gray-50 rounded-full">
                    <Ionicons name="arrow-back" size={20} color="#000" />
                </TouchableOpacity>
                <View className="ml-4">
                    <Text className="text-lg font-extrabold text-slate-900">{jobTitle}</Text>
                    <Text className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
                        Booking ID: {booking._id.slice(0, 8)}
                    </Text>
                </View>
            </View>

            <ScrollView className="p-5" showsVerticalScrollIndicator={false}>
                <View className="bg-white p-6 rounded-3xl mb-5 shadow-sm border border-gray-100">
                    <Text className="font-bold text-slate-800 mb-4">Job Progress</Text>
                    <View className="flex-row justify-between items-center">
                        {STATUS_STEPS.map((step, i) => {
                            const status = getStepStatus(i, booking.status);
                            const isLast = i === STATUS_STEPS.length - 1;
                            return (
                                <React.Fragment key={step}>
                                    <View className="items-center">
                                        <View className={`w-8 h-8 rounded-full items-center justify-center ${
                                            status === 'completed' ? 'bg-green-500' :
                                                status === 'active' ? 'bg-white border-4 border-green-500' : 'bg-gray-100'
                                        }`}>
                                            {status === 'completed' && <Ionicons name="checkmark" size={16} color="white" />}
                                        </View>
                                        <Text className={`text-[10px] mt-2 font-bold ${status === 'upcoming' ? 'text-gray-300' : 'text-slate-800'}`}>
                                            {step.toUpperCase()}
                                        </Text>
                                    </View>
                                    {!isLast && <View className={`flex-1 h-[2px] mx-1 ${status === 'completed' ? 'bg-green-500' : 'bg-gray-100'}`} />}
                                </React.Fragment>
                            );
                        })}
                    </View>
                </View>

                <View className="bg-white p-6 rounded-3xl mb-5 shadow-sm border border-gray-100">
                    <ImageGrid
                        title="Before Fix (Original Report)"
                        images={booking.jobId?.attachments || booking.jobId?.images}
                        placeholder="No original images provided"
                    />
                    <ImageGrid
                        title="After Fix (Worker's Proof)"
                        images={booking.attachments}
                        placeholder="Worker hasn't uploaded completion photos yet"
                    />
                </View>

                <View className="mb-10">
                    {booking.status === 'in-progress' && (
                        <TouchableOpacity
                            onPress={() => updateBookingStatus('completed')}
                            className="bg-green-600 p-4 rounded-2xl shadow-md shadow-green-200"
                        >
                            <Text className="text-white text-center font-bold text-base">Mark as Completed</Text>
                        </TouchableOpacity>
                    )}

                    {(booking.status === 'pending' || booking.status === 'scheduled') && (
                        <TouchableOpacity
                            onPress={() => updateBookingStatus('cancelled')}
                            className="bg-red-50 p-4 rounded-2xl border border-red-100"
                        >
                            <Text className="text-red-600 text-center font-bold">Cancel Booking</Text>
                        </TouchableOpacity>
                    )}

                    {booking.status === 'completed' && (
                        <View className="gap-3">
                            <View className="bg-green-50 p-4 rounded-2xl border border-green-100">
                                <Text className="text-green-700 text-center font-bold">Job Completed Successfully</Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => navigation.navigate('InvoiceDetails', { bookingId: booking._id, role: 'client' })}
                                className="bg-slate-900 p-4 rounded-2xl shadow-md"
                            >
                                <Text className="text-white text-center font-bold text-base">View Invoice & Pay</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>

            <ImageView
                images={currentImages}
                imageIndex={currentIndex}
                visible={visible}
                onRequestClose={() => setVisible(false)}
            />
        </SafeAreaView>
    );
}
import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import StatusBadge from './StatusBadge';
import { cancelBooking } from '../services/bookingService';

const BookingCard = ({ booking, onAction, currentUser, onRefresh, onViewProof }) => {
    // 1. User Role Detection
    const currentId = String(currentUser?.id || currentUser?._id || "");
    const workerId = String(booking.workerId?._id || booking.workerId || "");
    const isWorker = currentId === workerId;

    // 2. Status Normalization
    const status = (booking.status || 'pending').toLowerCase();
    const isCompleted = status === 'completed';
    const isCancelled = status === 'cancelled';

    const handleCancel = () => {
        Alert.alert(
            "Cancel Booking",
            "Are you sure you want to cancel this booking? This cannot be undone.",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await cancelBooking(booking._id);
                            Alert.alert("Success", "Booking has been cancelled.");
                            if (onRefresh) onRefresh();
                        } catch (error) {
                            Alert.alert("Error", "Failed to cancel booking.");
                        }
                    }
                }
            ]
        );
    };

    return (
        <View className="bg-white p-4 m-2 rounded-xl shadow-sm border border-gray-100">
            {/* --- TOP SECTION --- */}
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 mr-2">
                    {/* Fixed to check both jobId and jobID cases */}
                    <Text className="text-lg font-bold text-gray-900 leading-6">
                        {booking.jobId?.title || booking.jobID?.title || 'Job Details'}
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1">
                        {isWorker
                            ? `👤 Client: ${booking.clientId?.name || 'User'}`
                            : `🛠️ Worker: ${booking.workerId?.name || 'Worker'}`}
                    </Text>
                </View>
                <StatusBadge status={status} />
            </View>

            {/* --- MIDDLE SECTION --- */}
            {isCompleted ? (
                <View className="mt-2">
                    <View className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
                        <Text className="text-emerald-700 text-center font-bold">
                            ✅ Work Finished & Verified
                        </Text>
                    </View>

                    {/* --- ADDED: View Proof Button for Client --- */}
                    {!isWorker && (
                        <TouchableOpacity
                            onPress={() => {
                                // FIX: Match the backend 'attachments' field name
                                const imageUrl = booking.attachments?.[0];
                                if (onViewProof) {
                                    onViewProof(imageUrl);
                                }
                            }}
                            className="bg-blue-600 py-3 rounded-lg items-center mt-3 shadow-sm"
                        >
                            <Text className="text-white font-bold text-base">
                                🔍 View Worker's Proof
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : isCancelled ? (
                <View className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
                    <Text className="text-gray-500 text-center font-bold italic">
                        🚫 This booking was cancelled
                    </Text>
                </View>
            ) : (
                <View className="mt-2">
                    {isWorker ? (
                        <TouchableOpacity
                            onPress={() => onAction(booking._id)}
                            className="bg-green-600 py-3.5 rounded-lg items-center shadow-sm"
                        >
                            <Text className="text-white font-bold text-base">
                                Upload Proof & Complete
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <View className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                            <Text className="text-amber-700 text-center text-sm font-medium italic">
                                ⏳ Waiting for worker to provide proof...
                            </Text>
                        </View>
                    )}

                    <View className="h-[1px] bg-gray-200 w-full my-4" />

                    <TouchableOpacity onPress={handleCancel} className="py-2">
                        <Text className="text-red-500 text-center text-sm font-bold">
                            Cancel Booking
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

export default BookingCard;
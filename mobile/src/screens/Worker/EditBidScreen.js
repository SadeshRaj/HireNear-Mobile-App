import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { updateBid } from '../../services/bidService';

/**
 * EditBidScreen — Worker edits a pending bid
 * Route params: { bid: { _id, price, message, estimatedTime, jobId: { title } } }
 */
export default function EditBidScreen({ navigation, route }) {
    const { bid } = route.params || {};
    const job = bid?.jobId || {};

    const [price, setPrice] = useState(String(bid?.price || ''));
    const [message, setMessage] = useState(bid?.message || '');
    const [estimatedTime, setEstimatedTime] = useState(bid?.estimatedTime || '');
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const pickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['image/*', 'application/pdf', 'audio/*'],
                multiple: true,
            });
            if (!result.canceled && result.assets) {
                setFiles(prev => [...prev, ...result.assets]);
            }
        } catch {
            Alert.alert('Error', 'Could not pick file');
        }
    };

    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdate = async () => {
        if (!price || isNaN(Number(price)) || Number(price) <= 0) {
            setError('Please enter a valid price.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const result = await updateBid(bid._id, {
                price: Number(price),
                message,
                estimatedTime,
                files,
            });
            if (result._id) {
                Alert.alert('Updated! ✅', 'Your bid has been updated.', [
                    { text: 'OK', onPress: () => navigation.goBack() }
                ]);
            } else {
                setError(result.msg || 'Failed to update. Try again.');
            }
        } catch {
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>

                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="mb-6 w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100"
                    >
                        <Ionicons name="arrow-back" size={24} color="#0f172a" />
                    </TouchableOpacity>

                    {/* Header */}
                    <View className="mb-6">
                        <Text className="text-4xl font-extrabold text-slate-900 tracking-tight mb-1">Edit Bid.</Text>
                        <Text className="text-slate-500 font-medium">Update your proposal before it's accepted.</Text>
                    </View>

                    {/* Job Title */}
                    {job.title && (
                        <View className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 mb-6">
                            <Text className="text-xs text-slate-400 font-semibold uppercase tracking-widest mb-1">Job</Text>
                            <Text className="text-base font-bold text-slate-900">{job.title}</Text>
                        </View>
                    )}

                    {/* Error Alert */}
                    {!!error && (
                        <View className="bg-red-50 p-3 rounded-2xl border border-red-100 mb-5 flex-row items-center">
                            <Ionicons name="alert-circle" size={20} color="#ef4444" />
                            <Text className="text-red-600 font-medium ml-2 flex-1">{error}</Text>
                        </View>
                    )}

                    {/* Price */}
                    <View className="mb-5">
                        <Text className="text-xs text-slate-400 font-semibold uppercase tracking-widest ml-1 mb-2">
                            Your Price (LKR) *
                        </Text>
                        <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100">
                            <Ionicons name="cash-outline" size={22} color="#94a3b8" />
                            <TextInput
                                placeholder="e.g. 5000"
                                className="flex-1 ml-3 text-base text-slate-800"
                                placeholderTextColor="#94a3b8"
                                value={price}
                                onChangeText={setPrice}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    {/* Estimated Time */}
                    <View className="mb-5">
                        <Text className="text-xs text-slate-400 font-semibold uppercase tracking-widest ml-1 mb-2">
                            Estimated Completion Time
                        </Text>
                        <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100">
                            <Ionicons name="timer-outline" size={22} color="#94a3b8" />
                            <TextInput
                                placeholder="e.g. 2 days"
                                className="flex-1 ml-3 text-base text-slate-800"
                                placeholderTextColor="#94a3b8"
                                value={estimatedTime}
                                onChangeText={setEstimatedTime}
                            />
                        </View>
                    </View>

                    {/* Message */}
                    <View className="mb-5">
                        <Text className="text-xs text-slate-400 font-semibold uppercase tracking-widest ml-1 mb-2">
                            Proposal Message
                        </Text>
                        <View className="bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100">
                            <View className="flex-row items-start">
                                <Ionicons name="document-text-outline" size={22} color="#94a3b8" />
                                <TextInput
                                    placeholder="Update your proposal..."
                                    className="flex-1 ml-3 text-base text-slate-800 h-28"
                                    placeholderTextColor="#94a3b8"
                                    multiline
                                    textAlignVertical="top"
                                    value={message}
                                    onChangeText={setMessage}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Additional Attachments */}
                    <View className="mb-8">
                        <Text className="text-xs text-slate-400 font-semibold uppercase tracking-widest ml-1 mb-2">
                            Add More Attachments
                        </Text>

                        {files.map((file, index) => (
                            <View
                                key={index}
                                className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 mb-2"
                            >
                                <Feather name="paperclip" size={16} color="#64748b" />
                                <Text className="flex-1 ml-2 text-slate-600 text-sm font-medium" numberOfLines={1}>
                                    {file.name}
                                </Text>
                                <TouchableOpacity onPress={() => removeFile(index)} className="p-1">
                                    <Ionicons name="close-circle" size={20} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        <TouchableOpacity
                            onPress={pickFile}
                            className="flex-row items-center justify-center bg-slate-100 rounded-3xl py-4 border border-dashed border-slate-300"
                        >
                            <Ionicons name="cloud-upload-outline" size={20} color="#64748b" />
                            <Text className="text-slate-500 font-semibold ml-2">
                                Attach additional files
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Update Button */}
                    <TouchableOpacity
                        className={`bg-blue-600 rounded-3xl py-4 items-center shadow-md mb-12 ${loading ? 'opacity-60' : ''}`}
                        onPress={handleUpdate}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg tracking-wide">Update Bid</Text>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

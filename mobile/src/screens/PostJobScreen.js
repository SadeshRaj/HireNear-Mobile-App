import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { createJob } from '../services/jobService';

const CATEGORIES = [
    { label: 'Plumbing',    icon: 'water-drop',          bg: 'bg-sky-50',     color: '#0284c7' },
    { label: 'Electrical',  icon: 'electrical-services',  bg: 'bg-amber-50',   color: '#d97706' },
    { label: 'Cleaning',    icon: 'cleaning-services',    bg: 'bg-emerald-50', color: '#059669' },
    { label: 'Repairs',     icon: 'handyman',             bg: 'bg-indigo-50',  color: '#4f46e5' },
    { label: 'Carpentry',   icon: 'carpenter',            bg: 'bg-orange-50',  color: '#ea580c' },
    { label: 'Painting',    icon: 'format-paint',         bg: 'bg-pink-50',    color: '#db2777' },
    { label: 'Landscaping', icon: 'yard',                 bg: 'bg-lime-50',    color: '#65a30d' },
    { label: 'Other',       icon: 'more-horiz',           bg: 'bg-slate-100',  color: '#475569' },
];

export default function PostJobScreen({ navigation }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [budget, setBudget] = useState('');
    const [deadline, setDeadline] = useState('');
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Default Colombo location used silently during testing
    const defaultLocation = { type: 'Point', coordinates: [79.8612, 6.9271] };

    // ── Pick images ────────────────────────────────────────────────────────
    const pickImages = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'image/*',
                multiple: true,
            });
            if (!result.canceled && result.assets) {
                setImages(prev => [...prev, ...result.assets]);
            }
        } catch {
            Alert.alert('Error', 'Could not pick images.');
        }
    };

    const removeImage = (index) => setImages(prev => prev.filter((_, i) => i !== index));

    // ── Validate deadline format ───────────────────────────────────────────
    const isValidDate = (str) => {
        const regex = /^\d{4}-\d{2}-\d{2}$/;
        if (!regex.test(str)) return false;
        const d = new Date(str);
        return d instanceof Date && !isNaN(d) && d > new Date();
    };

    // ── Submit ─────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!title.trim()) return setError('Please enter a job title.');
        if (!description.trim()) return setError('Please add a description.');
        if (!selectedCategory) return setError('Please select a category.');
        if (!budget || isNaN(Number(budget)) || Number(budget) <= 0) return setError('Please enter a valid budget.');
        if (!deadline) return setError('Please enter a deadline (YYYY-MM-DD).');
        if (!isValidDate(deadline)) return setError('Deadline must be a future date in YYYY-MM-DD format.');

        // Always use default Colombo location during testing
        const jobLocation = defaultLocation;

        setError('');
        setLoading(true);
        try {
            const result = await createJob({
                title: title.trim(),
                description: description.trim(),
                category: selectedCategory,
                budget: Number(budget),
                deadline,
                location: jobLocation,
                images,
            });

            if (result._id) {
                // Use goBack() instead of replace() to avoid navigation context issues
                navigation.goBack();
            } else {
                setError(result.msg || result.error || 'Failed to post job. Try again.');
            }
        } catch {
            setError('Network error. Check your connection.');
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

                    {/* Back */}
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="mb-6 w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100"
                    >
                        <Ionicons name="arrow-back" size={24} color="#0f172a" />
                    </TouchableOpacity>

                    {/* Header */}
                    <View className="mb-7">
                        <Text className="text-4xl font-extrabold text-slate-900 tracking-tight mb-1">Post a Job.</Text>
                        <Text className="text-slate-500 font-medium">Describe what you need done nearby.</Text>
                    </View>

                    {/* Error */}
                    {!!error && (
                        <View className="bg-red-50 p-3 rounded-2xl border border-red-100 mb-5 flex-row items-center">
                            <Ionicons name="alert-circle" size={20} color="#ef4444" />
                            <Text className="text-red-600 font-medium ml-2 flex-1">{error}</Text>
                        </View>
                    )}

                    {/* Title */}
                    <View className="mb-5">
                        <Text className="text-xs text-slate-400 font-semibold uppercase tracking-widest ml-1 mb-2">Job Title *</Text>
                        <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100">
                            <Ionicons name="briefcase-outline" size={22} color="#94a3b8" />
                            <TextInput
                                placeholder="e.g. Fix leaking pipe in bathroom"
                                className="flex-1 ml-3 text-base text-slate-800"
                                placeholderTextColor="#94a3b8"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>
                    </View>

                    {/* Description */}
                    <View className="mb-5">
                        <Text className="text-xs text-slate-400 font-semibold uppercase tracking-widest ml-1 mb-2">Description *</Text>
                        <View className="bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100">
                            <View className="flex-row items-start">
                                <Ionicons name="document-text-outline" size={22} color="#94a3b8" />
                                <TextInput
                                    placeholder="Describe the problem, location in house, any urgency..."
                                    className="flex-1 ml-3 text-base text-slate-800 h-24"
                                    placeholderTextColor="#94a3b8"
                                    multiline
                                    textAlignVertical="top"
                                    value={description}
                                    onChangeText={setDescription}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Category */}
                    <View className="mb-5">
                        <Text className="text-xs text-slate-400 font-semibold uppercase tracking-widest ml-1 mb-3">Category *</Text>
                        <View className="flex-row flex-wrap gap-3">
                            {CATEGORIES.map((cat) => {
                                const isSelected = selectedCategory === cat.label;
                                return (
                                    <TouchableOpacity
                                        key={cat.label}
                                        onPress={() => setSelectedCategory(cat.label)}
                                        className={`flex-row items-center px-4 py-2.5 rounded-2xl border ${
                                            isSelected
                                                ? 'bg-slate-900 border-slate-900'
                                                : 'bg-white border-gray-200'
                                        }`}
                                    >
                                        <MaterialIcons
                                            name={cat.icon}
                                            size={16}
                                            color={isSelected ? 'white' : cat.color}
                                        />
                                        <Text className={`ml-2 text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-600'}`}>
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* Budget */}
                    <View className="mb-5">
                        <Text className="text-xs text-slate-400 font-semibold uppercase tracking-widest ml-1 mb-2">Budget (LKR) *</Text>
                        <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100">
                            <Ionicons name="cash-outline" size={22} color="#94a3b8" />
                            <TextInput
                                placeholder="e.g. 5000"
                                className="flex-1 ml-3 text-base text-slate-800"
                                placeholderTextColor="#94a3b8"
                                value={budget}
                                onChangeText={setBudget}
                                keyboardType="numeric"
                            />
                        </View>
                    </View>

                    {/* Deadline */}
                    <View className="mb-5">
                        <Text className="text-xs text-slate-400 font-semibold uppercase tracking-widest ml-1 mb-2">Deadline *</Text>
                        <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100">
                            <Ionicons name="calendar-outline" size={22} color="#94a3b8" />
                            <TextInput
                                placeholder="YYYY-MM-DD  (e.g. 2026-04-25)"
                                className="flex-1 ml-3 text-base text-slate-800"
                                placeholderTextColor="#94a3b8"
                                value={deadline}
                                onChangeText={setDeadline}
                                keyboardType="numbers-and-punctuation"
                                maxLength={10}
                            />
                        </View>
                    </View>

                    {/* Images */}
                    <View className="mb-8">
                        <Text className="text-xs text-slate-400 font-semibold uppercase tracking-widest ml-1 mb-2">
                            Photos of Issue (Optional)
                        </Text>

                        {/* Image thumbnails */}
                        {images.length > 0 && (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
                                {images.map((img, index) => (
                                    <View key={index} className="mr-3 relative">
                                        <Image
                                            source={{ uri: img.uri }}
                                            className="w-20 h-20 rounded-2xl"
                                            resizeMode="cover"
                                        />
                                        <TouchableOpacity
                                            onPress={() => removeImage(index)}
                                            className="absolute -top-2 -right-2 bg-red-500 rounded-full w-5 h-5 items-center justify-center"
                                        >
                                            <Ionicons name="close" size={12} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        <TouchableOpacity
                            onPress={pickImages}
                            className="flex-row items-center justify-center bg-slate-100 rounded-3xl py-4 border border-dashed border-slate-300"
                        >
                            <Ionicons name="camera-outline" size={20} color="#64748b" />
                            <Text className="text-slate-500 font-semibold ml-2">
                                {images.length > 0 ? `${images.length} photo(s) added — add more` : 'Upload photos of the issue'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Submit */}
                    <TouchableOpacity
                        className={`bg-slate-900 rounded-3xl py-4 items-center shadow-md mb-12 ${loading ? 'opacity-60' : ''}`}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white font-bold text-lg tracking-wide">Post Job</Text>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

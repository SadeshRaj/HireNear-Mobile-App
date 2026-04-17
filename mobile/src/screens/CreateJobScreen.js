import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const CATEGORIES = ["Plumbing", "Electrical", "Cleaning", "Repairs", "Carpentry", "Painting", "Gardening"];

export default function CreateJobScreen({ navigation }) {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState('');

    // Mock states for UI purposes
    const [deadline, setDeadline] = useState('Select Date');
    const [images, setImages] = useState([]);

    const handlePostJob = () => {
        console.log("Job Post Data:", { title, category, description, budget, deadline });
        // After backend is ready, this will navigate to the Dashboard or My Jobs tab
        navigation.goBack();
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">

                {/* Header */}
                <View className="px-5 pt-4 pb-2 flex-row items-center">
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100"
                    >
                        <Ionicons name="arrow-back" size={20} color="#0f172a" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-slate-900 ml-4">Post a Job</Text>
                </View>

                <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>

                    <Text className="text-slate-500 text-sm font-medium mb-6">
                        Describe what you need help with. The more details, the better professionals you'll attract.
                    </Text>

                    {/* Job Title */}
                    <View className="mb-5">
                        <Text className="text-slate-900 font-bold mb-2 ml-1">Job Title</Text>
                        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                            <MaterialIcons name="work-outline" size={20} color="#94a3b8" />
                            <TextInput
                                placeholder="e.g. Fix leaking kitchen sink"
                                className="flex-1 ml-3 text-slate-800"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>
                    </View>

                    {/* Category Selection */}
                    <View className="mb-6">
                        <Text className="text-slate-900 font-bold mb-2 ml-1">Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setCategory(cat)}
                                    className={`mr-3 px-4 py-2 rounded-full border ${category === cat ? 'bg-slate-900 border-slate-900' : 'bg-white border-gray-200 shadow-sm'}`}
                                >
                                    <Text className={`${category === cat ? 'text-white font-bold' : 'text-slate-600 font-medium'}`}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Description */}
                    <View className="mb-5">
                        <Text className="text-slate-900 font-bold mb-2 ml-1">Description</Text>
                        <View className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                            <TextInput
                                placeholder="Describe the problem in detail..."
                                className="h-28 text-slate-800"
                                multiline
                                textAlignVertical="top"
                                value={description}
                                onChangeText={setDescription}
                            />
                        </View>
                    </View>

                    {/* Budget & Deadline Row */}
                    <View className="flex-row gap-4 mb-6">
                        <View className="flex-1">
                            <Text className="text-slate-900 font-bold mb-2 ml-1">Budget</Text>
                            <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                                <Text className="text-slate-400 font-bold mr-2">Rs.</Text>
                                <TextInput
                                    placeholder="5000"
                                    className="flex-1 text-slate-800 font-bold"
                                    keyboardType="numeric"
                                    value={budget}
                                    onChangeText={setBudget}
                                />
                            </View>
                        </View>

                        <View className="flex-1">
                            <Text className="text-slate-900 font-bold mb-2 ml-1">Deadline</Text>
                            <TouchableOpacity className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                                <Ionicons name="calendar-outline" size={20} color="#94a3b8" />
                                <Text className={`flex-1 ml-2 ${deadline === 'Select Date' ? 'text-slate-400' : 'text-slate-800 font-medium'}`}>
                                    {deadline}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Image Upload Area (UI Placeholder) */}
                    <View className="mb-8">
                        <Text className="text-slate-900 font-bold mb-2 ml-1">Add Photos (Optional)</Text>
                        <TouchableOpacity className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl h-32 items-center justify-center">
                            <View className="bg-white p-3 rounded-full shadow-sm mb-2">
                                <Ionicons name="camera-outline" size={24} color="#64748b" />
                            </View>
                            <Text className="text-slate-500 font-medium text-sm">Tap to upload images</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        className="bg-emerald-600 rounded-3xl py-4 items-center shadow-md mb-12"
                        onPress={handlePostJob}
                    >
                        <Text className="text-white font-bold text-lg tracking-wide">Publish Job Post</Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
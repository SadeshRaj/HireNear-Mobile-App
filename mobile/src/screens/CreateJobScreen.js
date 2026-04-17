import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker'; // NEW IMPORT
import { API_BASE_URL } from '../../config';

const CATEGORIES = ["Plumbing", "Electrical", "Cleaning", "Repairs", "Carpentry", "Painting", "Gardening"];

export default function CreateJobScreen({ navigation, route }) {
    // Dynamically getting the logged-in user's ID passed from the previous screen
    const { userId } = route.params || {};

    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [budget, setBudget] = useState('');
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);

    // Date Picker States
    const [deadline, setDeadline] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    const pickImages = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            setImages(result.assets);
        }
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios'); // iOS keeps it open, Android auto-closes
        if (selectedDate) {
            setDeadline(selectedDate);
        }
    };

    const handlePostJob = async () => {
        if (!userId) return Alert.alert("Auth Error", "Could not verify your account. Please log in again.");
        if (!title || !category || !description || !budget) return Alert.alert("Error", "Please fill all required fields.");

        setLoading(true);

        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLoading(false);
                return Alert.alert("Permission Denied", "Location is needed to post a job.");
            }
            let location = await Location.getCurrentPositionAsync({});

            const formData = new FormData();
            formData.append('clientId', userId); // Sending dynamic ID as string
            formData.append('title', title);
            formData.append('category', category);
            formData.append('description', description);
            formData.append('budget', budget);
            formData.append('deadline', deadline.toISOString()); // Sending the selected date
            formData.append('longitude', location.coords.longitude);
            formData.append('latitude', location.coords.latitude);

            images.forEach((img, index) => {
                formData.append('images', {
                    uri: img.uri,
                    type: 'image/jpeg',
                    name: `job_image_${index}.jpg`,
                });
            });

            const response = await fetch(`${API_BASE_URL}/jobs/create`, {
                method: 'POST',
                body: formData,
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const result = await response.json();

            if (response.ok) {
                Alert.alert("Success", "Job posted successfully!");
                navigation.goBack();
            } else {
                Alert.alert("Failed", result.message || "Something went wrong");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Could not connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">

                {/* Header */}
                <View className="px-5 pt-4 pb-2 flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100">
                        <Ionicons name="arrow-back" size={20} color="#0f172a" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-slate-900 ml-4">Post a Job</Text>
                </View>

                <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>

                    {/* Job Title */}
                    <View className="mb-5">
                        <Text className="text-slate-900 font-bold mb-2 ml-1">Job Title</Text>
                        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                            <MaterialIcons name="work-outline" size={20} color="#94a3b8" />
                            <TextInput placeholder="e.g. Fix leaking kitchen sink" className="flex-1 ml-3 text-slate-800" value={title} onChangeText={setTitle} />
                        </View>
                    </View>

                    {/* Category */}
                    <View className="mb-6">
                        <Text className="text-slate-900 font-bold mb-2 ml-1">Category</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity key={cat} onPress={() => setCategory(cat)} className={`mr-3 px-4 py-2 rounded-full border ${category === cat ? 'bg-slate-900 border-slate-900' : 'bg-white border-gray-200'}`}>
                                    <Text className={category === cat ? 'text-white font-bold' : 'text-slate-600'}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Description */}
                    <View className="mb-5">
                        <Text className="text-slate-900 font-bold mb-2 ml-1">Description</Text>
                        <View className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                            <TextInput placeholder="Describe the problem..." className="h-28 text-slate-800" multiline textAlignVertical="top" value={description} onChangeText={setDescription} />
                        </View>
                    </View>

                    {/* Budget & Deadline Row */}
                    <View className="flex-row gap-4 mb-6">
                        <View className="flex-1">
                            <Text className="text-slate-900 font-bold mb-2 ml-1">Budget (Rs.)</Text>
                            <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                                <TextInput placeholder="5000" className="flex-1 text-slate-800 font-bold" keyboardType="numeric" value={budget} onChangeText={setBudget} />
                            </View>
                        </View>

                        <View className="flex-1">
                            <Text className="text-slate-900 font-bold mb-2 ml-1">Deadline</Text>
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 h-[52px]"
                            >
                                <Ionicons name="calendar-outline" size={20} color="#94a3b8" />
                                <Text className="flex-1 ml-2 text-slate-800 font-medium">
                                    {deadline.toLocaleDateString()}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Show Date Picker Modal */}
                    {showDatePicker && (
                        <DateTimePicker
                            value={deadline}
                            mode="date"
                            display="default"
                            minimumDate={new Date()} // Prevent picking past dates
                            onChange={handleDateChange}
                        />
                    )}

                    {/* Image Upload Area */}
                    <View className="mb-8">
                        <Text className="text-slate-900 font-bold mb-2 ml-1">Add Photos</Text>
                        <TouchableOpacity onPress={pickImages} className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl h-32 items-center justify-center">
                            {images.length > 0 ? (
                                <View className="flex-row">
                                    {images.slice(0, 3).map((img, i) => (
                                        <Image key={i} source={{ uri: img.uri }} className="w-16 h-16 rounded-lg m-1" />
                                    ))}
                                    {images.length > 3 && <Text className="ml-2 self-center">+{images.length - 3}</Text>}
                                </View>
                            ) : (
                                <>
                                    <Ionicons name="camera-outline" size={24} color="#64748b" />
                                    <Text className="text-slate-500">Tap to upload images</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        className={`bg-emerald-600 rounded-3xl py-4 items-center mb-12 ${loading ? 'opacity-70' : ''}`}
                        onPress={handlePostJob}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Publish Job Post</Text>}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
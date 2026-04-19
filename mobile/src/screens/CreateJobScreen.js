import React, { useState, useRef } from 'react'; // ADDED useRef
import {
    View, Text, TextInput, TouchableOpacity, ScrollView,
    KeyboardAvoidingView, Platform, Image, Alert, ActivityIndicator, Modal, StyleSheet
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker } from 'react-native-maps';
import { API_BASE_URL } from '../../config';

const CATEGORIES = ["Plumbing", "Electrical", "Cleaning", "Repairs", "Carpentry", "Painting", "Gardening", "Other"];

export default function CreateJobScreen({ navigation, route }) {
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

    // Map States
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [customLocation, setCustomLocation] = useState(null);
    const [tempMarker, setTempMarker] = useState(null);

    // NEW: Search States & Map Ref
    const mapRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Initial Map Region (Centered on Sri Lanka)
    const sriLankaRegion = {
        latitude: 7.8731,
        longitude: 80.7718,
        latitudeDelta: 3.5,
        longitudeDelta: 3.5,
    };

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
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDeadline(selectedDate);
        }
    };

    // Map Handlers
    const handleMapPress = (e) => {
        setTempMarker(e.nativeEvent.coordinate);
    };

    const confirmLocation = () => {
        if (tempMarker) {
            setCustomLocation(tempMarker);
        }
        setIsMapVisible(false);
    };

    // NEW: Search Handler
    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            // Geocode the text into coordinates
            const results = await Location.geocodeAsync(searchQuery);

            if (results.length > 0) {
                const { latitude, longitude } = results[0];
                const newCoords = { latitude, longitude };

                // Set the pin
                setTempMarker(newCoords);

                // Animate the map to zoom in on the searched location
                mapRef.current?.animateToRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.05, // Zoomed in closer
                    longitudeDelta: 0.05,
                }, 1000);
            } else {
                Alert.alert("Not Found", "Could not find that location. Please try a different name.");
            }
        } catch (error) {
            Alert.alert("Error", "Location search failed.");
            console.error(error);
        } finally {
            setIsSearching(false);
        }
    };

    const handlePostJob = async () => {
        if (!userId) return Alert.alert("Auth Error", "Could not verify your account. Please log in again.");
        if (!title || !category || !description || !budget) return Alert.alert("Error", "Please fill all required fields.");

        setLoading(true);

        try {
            let finalLat, finalLng;

            if (customLocation) {
                finalLat = customLocation.latitude;
                finalLng = customLocation.longitude;
            } else {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setLoading(false);
                    return Alert.alert("Permission Denied", "Location is needed to post a job. Please pin a location on the map.");
                }
                let location = await Location.getCurrentPositionAsync({});
                finalLat = location.coords.latitude;
                finalLng = location.coords.longitude;
            }

            const formData = new FormData();
            formData.append('clientId', userId);
            formData.append('title', title);
            formData.append('category', category);
            formData.append('description', description);
            formData.append('budget', budget);
            formData.append('deadline', deadline.toISOString());
            formData.append('latitude', finalLat);
            formData.append('longitude', finalLng);

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
                            minimumDate={new Date()}
                            onChange={handleDateChange}
                        />
                    )}

                    {/* Location Selector */}
                    <View className="mb-6">
                        <Text className="text-slate-900 font-bold mb-2 ml-1">Service Location</Text>
                        <View className="flex-row items-center justify-between bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                            <View className="flex-row items-center flex-1">
                                <Ionicons name="location-outline" size={22} color={customLocation ? "#059669" : "#94a3b8"} />
                                <Text className={`ml-2 font-medium ${customLocation ? "text-emerald-700" : "text-slate-500"}`}>
                                    {customLocation ? "Custom Map Pin Selected" : "Using Current Device Location"}
                                </Text>
                            </View>
                            <TouchableOpacity
                                className="bg-slate-100 px-3 py-2 rounded-xl"
                                onPress={() => {
                                    setTempMarker(customLocation);
                                    setIsMapVisible(true);
                                }}
                            >
                                <Text className="text-slate-800 font-bold text-xs">Change</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

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

            {/* Full Screen Map Modal */}
            <Modal visible={isMapVisible} animationType="slide">
                <View className="flex-1 bg-white">

                    {/* NEW: Search Bar Header */}
                    <View className="absolute top-12 left-5 right-5 z-10 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <View className="flex-row items-center px-4 py-3 border-b border-gray-50">
                            <Ionicons name="search" size={20} color="#94a3b8" />
                            <TextInput
                                className="flex-1 ml-3 text-slate-800 text-base"
                                placeholder="Search city or address..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                onSubmitEditing={handleSearch}
                                returnKeyType="search"
                            />
                            {isSearching ? (
                                <ActivityIndicator size="small" color="#0f172a" className="ml-2" />
                            ) : (
                                <TouchableOpacity onPress={() => setIsMapVisible(false)} className="ml-2 p-1">
                                    <Ionicons name="close-circle" size={24} color="#94a3b8" />
                                </TouchableOpacity>
                            )}
                        </View>
                        <View className="px-4 py-2 bg-slate-50">
                            <Text className="text-[11px] text-slate-500 text-center font-medium">
                                Search above or tap anywhere on the map to pin a location
                            </Text>
                        </View>
                    </View>

                    <MapView
                        ref={mapRef} // Added Map ref
                        style={StyleSheet.absoluteFillObject}
                        initialRegion={sriLankaRegion}
                        onPress={handleMapPress}
                    >
                        {tempMarker && (
                            <Marker
                                coordinate={tempMarker}
                                title="Service Location"
                                description="The worker will come here"
                                pinColor="red"
                            />
                        )}
                    </MapView>

                    <View className="absolute bottom-10 left-5 right-5 z-10">
                        <TouchableOpacity
                            className={`rounded-2xl py-4 items-center shadow-lg ${tempMarker ? 'bg-slate-900' : 'bg-slate-300'}`}
                            disabled={!tempMarker}
                            onPress={confirmLocation}
                        >
                            <Text className="text-white font-bold text-lg">Confirm Location</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

        </SafeAreaView>
    );
}
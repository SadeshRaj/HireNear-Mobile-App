import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function DashboardScreen() {
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>

                {/* Header Section */}
                <View className="flex-row justify-between items-center mb-6">
                    <View>
                        <Text className="text-gray-500 text-sm font-medium">Location</Text>
                        <View className="flex-row items-center mt-1">
                            <Ionicons name="location-sharp" size={18} color="#2563eb" />
                            <Text className="text-gray-900 text-lg font-bold ml-1">Colombo, LK</Text>
                            <Ionicons name="chevron-down" size={16} color="#4b5563" className="ml-1" />
                        </View>
                    </View>
                    <TouchableOpacity className="bg-white p-2 rounded-full shadow-sm">
                        <Ionicons name="notifications-outline" size={24} color="#1f2937" />
                        {/* Notification Badge */}
                        <View className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                    </TouchableOpacity>
                </View>

                {/* Welcome & Search */}
                <View className="mb-6">
                    <Text className="text-3xl font-extrabold text-gray-900 mb-1">Need a fix?</Text>
                    <Text className="text-gray-500 mb-4">Find reliable workers near you instantly.</Text>

                    <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                        <Ionicons name="search" size={20} color="#9ca3af" />
                        <TextInput
                            placeholder="Search for plumbers, electricians..."
                            className="flex-1 ml-3 text-base text-gray-800"
                            placeholderTextColor="#9ca3af"
                        />
                        <TouchableOpacity className="bg-blue-600 p-2 rounded-xl">
                            <Ionicons name="options" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Categories Section */}
                <View className="mb-8">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-xl font-bold text-gray-900">Categories</Text>
                        <TouchableOpacity>
                            <Text className="text-blue-600 font-medium">See All</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row justify-between">
                        <CategoryCard icon="water-drop" title="Plumbing" color="bg-blue-100" iconColor="#2563eb" />
                        <CategoryCard icon="electrical-services" title="Electrical" color="bg-yellow-100" iconColor="#d97706" />
                        <CategoryCard icon="cleaning-services" title="Cleaning" color="bg-green-100" iconColor="#16a34a" />
                        <CategoryCard icon="handyman" title="Handyman" color="bg-purple-100" iconColor="#9333ea" />
                    </View>
                </View>

                {/* Active Bookings / Nearby Workers snippet */}
                <View className="mb-8">
                    <Text className="text-xl font-bold text-gray-900 mb-4">Nearby Workers</Text>

                    <TouchableOpacity className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex-row items-center mb-3">
                        <View className="w-14 h-14 bg-gray-200 rounded-full items-center justify-center">
                            {/* Placeholder for Profile Image */}
                            <Ionicons name="person" size={24} color="#9ca3af" />
                        </View>
                        <View className="flex-1 ml-4">
                            <View className="flex-row justify-between items-center">
                                <Text className="text-lg font-bold text-gray-900">Kamal Perera</Text>
                                <View className="flex-row items-center">
                                    <Ionicons name="star" size={14} color="#fbbf24" />
                                    <Text className="text-gray-700 font-bold ml-1">4.8</Text>
                                </View>
                            </View>
                            <Text className="text-gray-500 text-sm">Expert Electrician</Text>
                            <View className="flex-row items-center mt-2">
                                <Ionicons name="location" size={14} color="#2563eb" />
                                <Text className="text-blue-600 text-xs font-bold ml-1">2.5 km away</Text>
                            </View>
                        </View>
                    </TouchableOpacity>

                </View>

                {/* Bottom Padding for Scroll */}
                <View className="h-10" />
            </ScrollView>
        </SafeAreaView>
    );
}

// Reusable Category Component
const CategoryCard = ({ icon, title, color, iconColor }) => (
    <TouchableOpacity className="items-center">
        <View className={`w-16 h-16 ${color} rounded-2xl items-center justify-center mb-2`}>
            <MaterialIcons name={icon} size={28} color={iconColor} />
        </View>
        <Text className="text-gray-700 text-sm font-medium">{title}</Text>
    </TouchableOpacity>
);
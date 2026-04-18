import React, { useState, useEffect, useRef } from 'react';
import {View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, FlatList, Alert} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CAROUSEL_IMAGES = [
    { id: '1', uri: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1000&auto=format&fit=crop' },
    { id: '2', uri: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1000&auto=format&fit=crop' },
    { id: '3', uri: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1000&auto=format&fit=crop' },
];

export default function DashboardScreen({ navigation, route }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef(null);

    // Get the user object from route params
    const user = route?.params?.user;
    const firstName = user?.name ? user.name.split(' ')[0] : 'Guest';

    useEffect(() => {
        const interval = setInterval(() => {
            let nextIndex = activeIndex + 1;
            if (nextIndex >= CAROUSEL_IMAGES.length) nextIndex = 0;

            flatListRef.current?.scrollToIndex({
                index: nextIndex,
                animated: true,
            });
            setActiveIndex(nextIndex);
        }, 3500);

        return () => clearInterval(interval);
    }, [activeIndex]);

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

                {/* Top Header */}
                <View className="px-5 pt-6 pb-4 flex-row justify-between items-center">
                    <View className="flex-row items-center bg-white py-2 px-4 rounded-full shadow-sm border border-gray-100">
                        <View className="bg-emerald-50 p-1.5 rounded-full mr-2">
                            <Ionicons name="location" size={16} color="#047857" />
                        </View>
                        <View>
                            <Text className="text-gray-400 text-xs font-medium uppercase">Current Location</Text>
                            <Text className="text-slate-800 text-sm font-bold">Colombo, WP</Text>
                        </View>
                    </View>

                    <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center bg-white py-2 px-3 rounded-full shadow-sm border border-gray-100">
                            <Feather name="sun" size={18} color="#d97706" />
                            <Text className="text-slate-700 font-bold ml-2">29°</Text>
                        </View>
                        <TouchableOpacity
                            className="bg-white p-2.5 rounded-full shadow-sm border border-gray-100"
                            onPress={() => navigation.replace('Login')}
                        >
                            <Ionicons name="log-out-outline" size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Greeting */}
                <View className="px-5 mb-6">
                    <Text className="text-3xl font-extrabold text-slate-900 mb-1">Hello, {firstName} </Text>
                    <Text className="text-slate-500 mb-5 font-medium">Find elite professionals near you.</Text>

                    <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100">
                        <Ionicons name="search" size={22} color="#94a3b8" />
                        <TextInput
                            placeholder="Search for a service..."
                            className="flex-1 ml-3 text-base text-slate-800"
                            placeholderTextColor="#94a3b8"
                        />
                        <TouchableOpacity className="bg-slate-900 p-2.5 rounded-2xl">
                            <Ionicons name="options" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Carousel */}
                <View className="mb-8">
                    <FlatList
                        ref={flatListRef}
                        data={CAROUSEL_IMAGES}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        keyExtractor={(item) => item.id}
                        onMomentumScrollEnd={(event) => {
                            const index = Math.round(event.nativeEvent.contentOffset.x / width);
                            setActiveIndex(index);
                        }}
                        renderItem={({ item }) => (
                            <View style={{ width, paddingHorizontal: 20 }}>
                                <Image source={{ uri: item.uri }} className="w-full h-48 rounded-[32px]" resizeMode="cover" />
                                <View className="absolute inset-0 bg-black/20 rounded-[32px] ml-5" style={{ width: width - 40 }} />
                            </View>
                        )}
                    />
                    <View className="flex-row justify-center mt-4">
                        {CAROUSEL_IMAGES.map((_, index) => (
                            <View key={index} className={`h-2 rounded-full mx-1 ${activeIndex === index ? 'w-6 bg-slate-800' : 'w-2 bg-slate-300'}`} />
                        ))}
                    </View>
                </View>

                {/* Categories */}
                <View className="px-5 mb-8">
                    <View className="flex-row justify-between items-center mb-5">
                        <Text className="text-xl font-bold text-slate-900">Expert Services</Text>
                        <TouchableOpacity><Text className="text-emerald-700 font-semibold">View All</Text></TouchableOpacity>
                    </View>
                    <View className="flex-row justify-between">
                        <CategoryCard icon="water-drop" title="Plumbing" bgColor="bg-sky-50" iconColor="#0284c7" />
                        <CategoryCard icon="electrical-services" title="Electrical" bgColor="bg-amber-50" iconColor="#d97706" />
                        <CategoryCard icon="cleaning-services" title="Cleaning" bgColor="bg-emerald-50" iconColor="#059669" />
                        <CategoryCard icon="handyman" title="Repairs" bgColor="bg-indigo-50" iconColor="#4f46e5" />
                    </View>
                </View>

                {/* Nearby Workers */}
                <View className="px-5 mb-8">
                    <Text className="text-xl font-bold text-slate-900 mb-5">Top Rated Nearby</Text>
                    <TouchableOpacity className="bg-white rounded-[32px] p-5 shadow-sm border border-gray-100 flex-row items-center mb-4">
                        <View className="w-16 h-16 bg-slate-100 rounded-full overflow-hidden border-2 border-white shadow-sm">
                            <Image source={{ uri: 'https://randomuser.me/api/portraits/men/32.jpg' }} className="w-full h-full" />
                        </View>
                        <View className="flex-1 ml-4">
                            <View className="flex-row justify-between items-center mb-1">
                                <Text className="text-lg font-bold text-slate-900">Kamal Perera</Text>
                                <View className="flex-row items-center bg-amber-50 px-2 py-1 rounded-lg">
                                    <Ionicons name="star" size={14} color="#d97706" /><Text className="text-amber-700 font-bold ml-1 text-xs">4.9</Text>
                                </View>
                            </View>
                            <Text className="text-slate-500 text-sm">Master Electrician</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View className="h-20" />
            </ScrollView>

            {/* UPDATED FAB: Passes the userId to CreateJob screen */}
            <TouchableOpacity
                style={{ position: 'absolute', bottom: 25, right: 25 }}
                className="bg-slate-900 w-16 h-16 rounded-full items-center justify-center shadow-lg border-[3px] border-white"
                onPress={() => {
                    if (user?._id || user?.id) {
                        navigation.navigate('CreateJob', { userId: user._id || user.id });
                    } else {
                        Alert.alert("Error", "User session not found. Please log in again.");
                    }
                }}
            >
                <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const CategoryCard = ({ icon, title, bgColor, iconColor }) => (
    <TouchableOpacity className="items-center">
        <View className={`w-16 h-16 ${bgColor} rounded-[24px] items-center justify-center mb-3 shadow-sm`}>
            <MaterialIcons name={icon} size={28} color={iconColor} />
        </View>
        <Text className="text-slate-700 text-xs font-bold">{title}</Text>
    </TouchableOpacity>
);
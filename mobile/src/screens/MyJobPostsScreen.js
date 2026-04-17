import React from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Mock data to see how it looks
const MY_POSTS = [
    {
        id: '1',
        title: 'Fix leaking kitchen sink',
        category: 'Plumbing',
        budget: '5,000',
        status: 'Open',
        date: '17 April'
    },
    {
        id: '2',
        title: 'Garden edge trimming',
        category: 'Gardening',
        budget: '3,500',
        status: 'Completed',
        date: '10 April'
    }
];

export default function MyJobPostsScreen() {
    const renderItem = ({ item }) => (
        <TouchableOpacity className="bg-white rounded-3xl p-5 mb-4 shadow-sm border border-gray-100">
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                    <Text className="text-lg font-bold text-slate-900">{item.title}</Text>
                    <Text className="text-slate-500 font-medium text-xs mt-1">{item.category} • {item.date}</Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${item.status === 'Open' ? 'bg-emerald-50' : 'bg-slate-100'}`}>
                    <Text className={`text-[10px] font-bold uppercase ${item.status === 'Open' ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {item.status}
                    </Text>
                </View>
            </View>

            <View className="flex-row justify-between items-center border-t border-gray-50 pt-4">
                <View>
                    <Text className="text-gray-400 text-[10px] uppercase font-bold">Budget</Text>
                    <Text className="text-slate-900 font-extrabold">Rs. {item.budget}</Text>
                </View>
                <TouchableOpacity className="bg-slate-900 px-4 py-2 rounded-xl">
                    <Text className="text-white text-xs font-bold">View Details</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB] px-5">
            <View className="pt-6 pb-6">
                <Text className="text-3xl font-extrabold text-slate-900">My Job Posts</Text>
                <Text className="text-slate-500 font-medium">Track your service requests</Text>
            </View>

            <FlatList
                data={MY_POSTS}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View className="items-center mt-20">
                        <Ionicons name="document-text-outline" size={80} color="#e2e8f0" />
                        <Text className="text-slate-400 font-bold mt-4">No jobs posted yet.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}
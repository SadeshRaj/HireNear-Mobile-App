import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function CreateInvoiceScreen({ route, navigation }) {
    const { bookingId } = route.params;
    const [items, setItems] = useState([]);
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAddItem = () => {
        if (!desc || !amount) return;
        setItems([...items, { description: desc, amount: parseFloat(amount) }]);
        setDesc('');
        setAmount('');
    };

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    const submitInvoice = async () => {
        if (items.length === 0) return Alert.alert("Error", "Please add at least one item.");
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/invoices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ bookingId, items, totalAmount })
            });
            const data = await res.json();
            if (data.success) {
                // Navigate to the native view screen instead of downloading immediately
                navigation.replace('InvoiceDetails', { bookingId, role: 'worker' });
            } else {
                Alert.alert("Error", data.msg);
            }
        } catch (err) {
            Alert.alert("Error", "Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <View className="px-5 py-4 flex-row items-center bg-white border-b border-gray-100 shadow-sm">
                <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-slate-50 rounded-full">
                    <Ionicons name="arrow-back" size={22} color="#334155" />
                </TouchableOpacity>
                <Text className="ml-4 text-xl font-extrabold text-slate-800">Create Invoice</Text>
            </View>

            <View className="p-5 flex-1">
                <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4">
                    <Text className="font-bold text-slate-800 mb-3">Add Billable Items</Text>
                    <TextInput
                        placeholder="E.g. Material cost, Labor fee"
                        value={desc}
                        onChangeText={setDesc}
                        className="bg-slate-50 p-4 rounded-xl mb-3 border border-slate-200"
                    />
                    <TextInput
                        placeholder="Amount (LKR)"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        className="bg-slate-50 p-4 rounded-xl mb-3 border border-slate-200"
                    />
                    <TouchableOpacity onPress={handleAddItem} className="bg-slate-900 p-3 rounded-xl items-center">
                        <Text className="text-white font-bold">Add to Table</Text>
                    </TouchableOpacity>
                </View>

                {/* Native Table Preview */}
                <View className="border border-slate-200 rounded-xl overflow-hidden mb-2 bg-white flex-1">
                    <View className="flex-row bg-slate-100 p-3 border-b border-slate-200">
                        <Text className="flex-1 font-bold text-slate-700">Description</Text>
                        <Text className="w-24 font-bold text-slate-700 text-right">Amount</Text>
                    </View>
                    <FlatList
                        data={items}
                        keyExtractor={(_, i) => i.toString()}
                        renderItem={({ item }) => (
                            <View className="flex-row p-3 border-b border-slate-100">
                                <Text className="flex-1 text-slate-600">{item.description}</Text>
                                <Text className="w-24 text-slate-800 text-right font-medium">LKR {item.amount}</Text>
                            </View>
                        )}
                    />
                </View>

                <View className="flex-row justify-between items-center py-4 px-2">
                    <Text className="text-lg font-bold text-slate-500">Total:</Text>
                    <Text className="text-2xl font-extrabold text-emerald-600">LKR {totalAmount.toLocaleString()}</Text>
                </View>

                <TouchableOpacity
                    onPress={submitInvoice}
                    disabled={loading}
                    className={`p-4 rounded-2xl items-center mt-2 ${loading ? 'bg-indigo-400' : 'bg-indigo-600'}`}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-bold">Save Invoice</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
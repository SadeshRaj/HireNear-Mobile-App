import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function CreateInvoiceScreen({ route, navigation }) {
    const { bookingId, agreedPrice } = route.params;

    const [items, setItems] = useState(agreedPrice ? [{ description: 'Agreed Job Price', amount: parseFloat(agreedPrice), isFixed: true }] : []);
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    const [editingIndex, setEditingIndex] = useState(null);

    const handleAddOrUpdateItem = () => {
        if (!desc || !amount) return Alert.alert("Hold up", "Please enter both a description and an amount.");

        if (editingIndex !== null) {
            const updatedItems = [...items];
            updatedItems[editingIndex] = {
                ...updatedItems[editingIndex],
                description: desc,
                amount: updatedItems[editingIndex].isFixed ? updatedItems[editingIndex].amount : parseFloat(amount)
            };
            setItems(updatedItems);
            setEditingIndex(null);
        } else {
            setItems([...items, { description: desc, amount: parseFloat(amount), isFixed: false }]);
        }

        setDesc('');
        setAmount('');
    };

    const handleEditClick = (index) => {
        setEditingIndex(index);
        setDesc(items[index].description);
        setAmount(items[index].amount.toString());
    };

    const handleDeleteItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const cancelEdit = () => {
        setEditingIndex(null);
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

    const isEditingFixedItem = editingIndex !== null && items[editingIndex].isFixed;

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
                    <Text className="font-bold text-slate-800 mb-3">
                        {editingIndex !== null ? "Edit Billable Item" : "Add Billable Items"}
                    </Text>

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
                        editable={!isEditingFixedItem}
                        className={`bg-slate-50 p-4 rounded-xl mb-3 border border-slate-200 ${isEditingFixedItem ? 'opacity-50 bg-slate-100' : ''}`}
                    />
                    {isEditingFixedItem && (
                        <Text className="text-xs text-amber-600 mb-3 -mt-2 ml-1 font-medium">
                            * The agreed bid price cannot be modified.
                        </Text>
                    )}

                    <View className="flex-row gap-2">
                        {editingIndex !== null && (
                            <TouchableOpacity onPress={cancelEdit} className="bg-slate-200 p-3 rounded-xl items-center flex-1">
                                <Text className="text-slate-700 font-bold">Cancel</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={handleAddOrUpdateItem} className="bg-slate-900 p-3 rounded-xl items-center flex-[2]">
                            <Text className="text-white font-bold">{editingIndex !== null ? "Update Item" : "Add to Table"}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="border border-slate-200 rounded-xl overflow-hidden mb-2 bg-white flex-1 shadow-sm">
                    <View className="flex-row bg-slate-100 p-3 border-b border-slate-200 items-center">
                        <Text className="flex-1 font-bold text-slate-700">Description</Text>
                        <Text className="w-24 font-bold text-slate-700 text-right pr-2">Amount</Text>
                        <View className="w-16" />
                    </View>

                    <FlatList
                        data={items}
                        keyExtractor={(_, i) => i.toString()}
                        renderItem={({ item, index }) => (
                            <View className={`flex-row items-center p-3 border-b border-slate-50 ${editingIndex === index ? 'bg-indigo-50' : ''}`}>
                                <Text className="flex-1 text-slate-600 font-medium">{item.description}</Text>
                                <Text className="w-24 text-slate-800 text-right font-bold mr-3">LKR {item.amount}</Text>

                                <View className="flex-row gap-1">
                                    <TouchableOpacity onPress={() => handleEditClick(index)} className="p-2 bg-blue-50 rounded-md">
                                        <Ionicons name="pencil" size={16} color="#3b82f6" />
                                    </TouchableOpacity>

                                    {!item.isFixed ? (
                                        <TouchableOpacity onPress={() => handleDeleteItem(index)} className="p-2 bg-red-50 rounded-md">
                                            <Ionicons name="trash-outline" size={16} color="#ef4444" />
                                        </TouchableOpacity>
                                    ) : (
                                        <View className="w-[32px] p-2" />
                                    )}
                                </View>
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
                    disabled={loading || editingIndex !== null}
                    className={`p-4 rounded-2xl items-center mt-2 ${loading || editingIndex !== null ? 'bg-indigo-400' : 'bg-indigo-600'}`}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-bold">Save Invoice</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
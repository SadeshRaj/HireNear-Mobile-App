import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function GenerateInvoiceScreen({ route, navigation }) {
    const { bookingId, clientName } = route.params;
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

    // We now accept the savedInvoice object to pull the real ID and Dates
    const generatePDF = async (savedInvoice) => {
        let logoSrc = '';
        try {
            const asset = await Asset.loadAsync(require('../../assets/HireNear_Logo.png'));
            const imageUri = asset[0].localUri || asset[0].uri;
            if (imageUri) {
                const logoBase64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
                logoSrc = `data:image/png;base64,${logoBase64}`;
            }
        } catch (imgErr) {
            console.error("🚨 EXACT LOGO ERROR:", imgErr);
        }

        const refNumber = savedInvoice ? savedInvoice._id.slice(-6).toUpperCase() : Date.now().toString().slice(-6);
        const dateStr = savedInvoice ? new Date(savedInvoice.createdAt).toLocaleDateString() : new Date().toLocaleDateString();
        const workerName = 'HireNear Professional'; // General title immediately after generation
        const workerPhone = 'Platform Verified';

        try {
            const html = `
                <html>
                    <head>
                        <style>
                            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #334155; }
                            
                            /* Top Header Layout */
                            .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
                            .brand-logo { width: 160px; height: auto; }
                            
                            /* Right Side Details */
                            .header-right { text-align: right; }
                            .header-right h1 { color: #0f172a; margin: 0 0 10px 0; font-size: 38px; letter-spacing: 2px; }
                            .header-right p { margin: 4px 0; font-size: 14px; color: #64748b; }
                            .company-info { margin-top: 15px; font-size: 14px; color: #64748b; }
                            .company-info strong { color: #0f172a; }
                            
                            /* Divider */
                            .divider { border: none; border-top: 2px solid #E2E8F0; margin: 30px 0; }
                            
                            /* Sender and Receiver */
                            .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
                            .party-box { background: #f8fafc; padding: 20px; border-radius: 8px; width: 45%; }
                            .party-title { color: #0f172a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; margin-bottom: 8px; display: block; }
                            .party-name { font-size: 18px; font-weight: bold; color: #334155; display: block; margin-bottom: 4px; }
                            .party-detail { font-size: 14px; color: #64748b; }
                            
                            /* Table */
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th { padding: 12px; text-align: left; border-bottom: 2px solid #0f172a; color: #0f172a; font-weight: bold; }
                            td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
                            .total-row td { font-weight: bold; font-size: 20px; color: #059669; border-top: 2px solid #0f172a; border-bottom: none; }
                        </style>
                    </head>
                    <body>
                        <div class="header-top">
                            <div>
                                ${logoSrc ? `<img src="${logoSrc}" class="brand-logo" alt="HireNear Logo" />` : ''}
                            </div>
                            <div class="header-right">
                                <h1>INVOICE</h1>
                                <p><strong>Ref No:</strong> #${refNumber}</p>
                                <p><strong>Date:</strong> ${dateStr}</p>
                                <div class="company-info">
                                    <strong>HireNear Services</strong><br/>
                                    support@hirenear.com<br/>
                                    Western Province, Sri Lanka
                                </div>
                            </div>
                        </div>

                        <hr class="divider" />

                        <div class="parties">
                            <div class="party-box">
                                <span class="party-title">From (Service Provider)</span>
                                <span class="party-name">${workerName}</span>
                                <span class="party-detail">${workerPhone}</span>
                            </div>
                            <div class="party-box">
                                <span class="party-title">Billed To (Client)</span>
                                <span class="party-name">${clientName || 'Client'}</span>
                            </div>
                        </div>

                        <table>
                            <tr>
                                <th>Description</th>
                                <th style="text-align: right;">Amount (LKR)</th>
                            </tr>
                            ${items.map(item => `
                                <tr>
                                    <td>${item.description}</td>
                                    <td style="text-align: right;">${item.amount.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                            <tr class="total-row">
                                <td style="text-align: right;">Total Due:</td>
                                <td style="text-align: right;">LKR ${totalAmount.toLocaleString()}</td>
                            </tr>
                        </table>
                    </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });

            if (Platform.OS === 'android') {
                const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                if (permissions.granted) {
                    const base64Data = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
                    const fileName = `HireNear_Invoice_${refNumber}.pdf`;
                    const newUri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, 'application/pdf');
                    await FileSystem.writeAsStringAsync(newUri, base64Data, { encoding: 'base64' });
                    Alert.alert("Success", "Invoice PDF generated and saved!");
                }
            } else {
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to generate PDF');
        }
    };

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
                await generatePDF(data.invoice); // Pass the real invoice object to the PDF generator
                Alert.alert("Success", "Invoice created & saved!");
                navigation.goBack();
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
                    <Text className="font-bold text-slate-800 mb-3">Add Items</Text>
                    <TextInput
                        placeholder="E.g. Pipe replacement parts"
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
                    <TouchableOpacity onPress={handleAddItem} className="bg-indigo-600 p-3 rounded-xl items-center shadow-sm">
                        <Text className="text-white font-bold">Add Item</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={items}
                    keyExtractor={(_, i) => i.toString()}
                    renderItem={({ item }) => (
                        <View className="flex-row justify-between bg-white p-4 rounded-xl mb-2 border border-gray-100 shadow-sm">
                            <Text className="text-slate-700 font-medium">{item.description}</Text>
                            <Text className="text-emerald-600 font-bold">LKR {item.amount}</Text>
                        </View>
                    )}
                />

                <View className="flex-row justify-between items-center py-4 px-2 border-t border-slate-200 mt-2">
                    <Text className="text-lg font-bold text-slate-500">Total:</Text>
                    <Text className="text-2xl font-extrabold text-emerald-600">LKR {totalAmount.toLocaleString()}</Text>
                </View>

                <TouchableOpacity
                    onPress={submitInvoice}
                    disabled={loading}
                    className={`p-4 rounded-2xl items-center mt-2 shadow-md ${loading ? 'bg-slate-400' : 'bg-slate-900'}`}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-lg font-bold">Submit & Save to Phone</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, Image, ScrollView, Platform, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import ImageView from "react-native-image-viewing";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export default function InvoiceDetailsScreen({ route, navigation }) {
    const { bookingId, role } = route.params;
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [viewerVisible, setViewerVisible] = useState(false);

    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editItems, setEditItems] = useState([]);
    const [editDesc, setEditDesc] = useState('');
    const [editAmount, setEditAmount] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Reject State
    const [rejectModalVisible, setRejectModalVisible] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejecting, setRejecting] = useState(false);

    useEffect(() => {
        fetchInvoice();
    }, [bookingId]);

    const fetchInvoice = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/invoices/booking/${bookingId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setInvoice(data.invoice);
                setEditItems([...data.invoice.items]);
            }
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    // --- CRUD: UPDATE FUNCTIONS ---
    const startEditing = () => {
        setEditItems(JSON.parse(JSON.stringify(invoice.items))); // Deep copy
        setIsEditing(true);
    };

    // Handles inline text changes for existing items
    const handleInlineEdit = (index, field, value) => {
        const updated = [...editItems];
        if (field === 'amount') {
            updated[index][field] = value ? parseFloat(value) || 0 : '';
        } else {
            updated[index][field] = value;
        }
        setEditItems(updated);
    };

    const handleAddEditItem = () => {
        if (!editDesc || !editAmount) return;
        setEditItems([...editItems, { description: editDesc, amount: parseFloat(editAmount), isFixed: false }]);
        setEditDesc('');
        setEditAmount('');
    };

    const handleRemoveEditItem = (index) => {
        setEditItems(editItems.filter((_, i) => i !== index));
    };

    const saveEditedInvoice = async () => {
        if (editItems.length === 0) return Alert.alert("Error", "Invoice must have at least one item.");

        // Ensure no empty descriptions or amounts are sent
        for (let item of editItems) {
            if (!item.description || item.amount === '' || isNaN(item.amount)) {
                return Alert.alert("Error", "Please ensure all fields are filled out correctly.");
            }
        }

        setIsSavingEdit(true);
        const newTotal = editItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/invoices/${invoice._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ items: editItems, totalAmount: newTotal })
            });
            const data = await res.json();
            if (data.success) {
                setInvoice(data.invoice);
                setIsEditing(false);
                Alert.alert("Success", "Invoice updated successfully!");
            }
        } catch (err) {
            Alert.alert("Error", "Failed to update invoice.");
        } finally {
            setIsSavingEdit(false);
        }
    };

    // --- CRUD: DELETE FUNCTION ---
    const handleDeleteInvoice = async () => {
        Alert.alert("Delete Invoice", "Are you sure you want to permanently delete this invoice?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: "destructive",
                onPress: async () => {
                    try {
                        const token = await AsyncStorage.getItem('token');
                        const res = await fetch(`${API_BASE_URL}/invoices/${invoice._id}`, {
                            method: 'DELETE',
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const data = await res.json();
                        if (data.success) {
                            Alert.alert("Deleted", "Invoice removed.");
                            navigation.goBack();
                        }
                    } catch (err) {
                        Alert.alert("Error", "Failed to delete.");
                    }
                }
            }
        ]);
    };

    // --- CASH PAYMENT FUNCTION ---
    const handleCashPayment = async () => {
        Alert.alert("Confirm Cash Payment", "Are you sure the client paid in cash? This will close the invoice.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Confirm",
                onPress: async () => {
                    setVerifying(true);
                    try {
                        const token = await AsyncStorage.getItem('token');
                        const res = await fetch(`${API_BASE_URL}/invoices/${invoice._id}/cash`, {
                            method: 'PATCH',
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const data = await res.json();
                        if (data.success) {
                            setInvoice(data.invoice);
                            Alert.alert("Success", "Marked as Paid in Cash!");
                        }
                    } catch (err) {
                        Alert.alert("Error", "Action failed.");
                    } finally {
                        setVerifying(false);
                    }
                }
            }
        ]);
    };

    const handleUploadSlip = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
        if (!result.canceled) {
            setUploading(true);
            const formData = new FormData();
            const uri = Platform.OS === 'ios' ? result.assets[0].uri.replace('file://', '') : result.assets[0].uri;

            formData.append('slip', { uri: uri, name: 'slip.jpg', type: 'image/jpeg' });

            try {
                const token = await AsyncStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/invoices/${invoice._id}/pay`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    setInvoice(data.invoice);
                    Alert.alert("Success", "Payment slip uploaded!");
                }
            } catch (err) {
                Alert.alert("Error", "Upload failed");
            } finally {
                setUploading(false);
            }
        }
    };

    const handleVerifyPayment = async () => {
        Alert.alert("Accept Payment", "Confirm that you have received this payment?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Confirm",
                onPress: async () => {
                    setVerifying(true);
                    try {
                        const token = await AsyncStorage.getItem('token');
                        const res = await fetch(`${API_BASE_URL}/invoices/${invoice._id}/verify`, {
                            method: 'PATCH',
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        const data = await res.json();
                        if (data.success) {
                            setInvoice(data.invoice);
                            Alert.alert("Success", "Payment verified! Job is now marked as completed.");
                        }
                    } catch (err) {
                        Alert.alert("Error", "Verification failed.");
                    } finally {
                        setVerifying(false);
                    }
                }
            }
        ]);
    };

    const handleRejectPayment = async () => {
        if (!rejectReason.trim()) return Alert.alert("Error", "Please provide a reason.");
        setRejecting(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/invoices/${invoice._id}/reject`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ reason: rejectReason })
            });
            const data = await res.json();
            if (data.success) {
                setInvoice(data.invoice);
                setRejectModalVisible(false);
                setRejectReason('');
                Alert.alert("Rejected", "Payment slip rejected. Client has been notified.");
            } else {
                Alert.alert("Error", data.msg || "Failed to reject.");
            }
        } catch (err) {
            Alert.alert("Error", "Rejection failed.");
        } finally {
            setRejecting(false);
        }
    };

    const downloadPDF = async () => {
        let logoSrc = '';
        try {
            const asset = await Asset.loadAsync(require('../../../assets/HireNear_Logo.png'));
            const imageUri = asset[0].localUri || asset[0].uri;
            if (imageUri) {
                const logoBase64 = await FileSystem.readAsStringAsync(imageUri, { encoding: 'base64' });
                logoSrc = `data:image/png;base64,${logoBase64}`;
            }
        } catch (imgErr) {
            console.error("🚨 EXACT LOGO ERROR:", imgErr);
        }

        const refNumber = invoice._id.slice(-6).toUpperCase();
        const dateStr = new Date(invoice.createdAt).toLocaleDateString();
        const workerName = invoice.workerId?.name || 'HireNear Professional';
        const workerPhone = invoice.workerId?.phone || '';
        const clientName = invoice.clientId?.name || 'Client';

        const isCash = invoice.paymentSlipUrl === 'CASH';
        const stampText = isCash ? 'PAID IN CASH' : 'PAID IN FULL';

        try {
            const html = `
                <html>
                    <head>
                        <style>
                            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #334155; }
                            .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
                            .brand-logo { width: 160px; height: auto; }
                            .header-right { text-align: right; }
                            .header-right h1 { color: #0f172a; margin: 0 0 10px 0; font-size: 38px; letter-spacing: 2px; }
                            .header-right p { margin: 4px 0; font-size: 14px; color: #64748b; }
                            .company-info { margin-top: 15px; font-size: 14px; color: #64748b; }
                            .company-info strong { color: #0f172a; }
                            .divider { border: none; border-top: 2px solid #E2E8F0; margin: 30px 0; }
                            .parties { display: flex; justify-content: space-between; margin-bottom: 40px; }
                            .party-box { background: #f8fafc; padding: 20px; border-radius: 8px; width: 45%; }
                            .party-title { color: #0f172a; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; margin-bottom: 8px; display: block; }
                            .party-name { font-size: 18px; font-weight: bold; color: #334155; display: block; margin-bottom: 4px; }
                            .party-detail { font-size: 14px; color: #64748b; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th { padding: 12px; text-align: left; border-bottom: 2px solid #0f172a; color: #0f172a; font-weight: bold; }
                            td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
                            .total-row td { font-weight: bold; font-size: 20px; color: #059669; border-top: 2px solid #0f172a; border-bottom: none; }
                            .paid-stamp { color: #059669; border: 3px solid #059669; padding: 10px 20px; font-size: 24px; font-weight: bold; border-radius: 8px; transform: rotate(-15deg); position: absolute; top: 350px; right: 50px; opacity: 0.8; }
                        </style>
                    </head>
                    <body>
                        <div class="header-top">
                            <div>${logoSrc ? `<img src="${logoSrc}" class="brand-logo" alt="HireNear Logo" />` : ''}</div>
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
                                <span class="party-name">${clientName}</span>
                            </div>
                        </div>
                        ${invoice.status === 'paid' ? `<div class="paid-stamp">${stampText}</div>` : ''}
                        <table>
                            <tr>
                                <th>Description</th>
                                <th style="text-align: right;">Amount (LKR)</th>
                            </tr>
                            ${invoice.items.map(item => `
                                <tr>
                                    <td>${item.description}</td>
                                    <td style="text-align: right;">${item.amount.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                            <tr class="total-row">
                                <td style="text-align: right;">Total Due:</td>
                                <td style="text-align: right;">LKR ${invoice.totalAmount.toLocaleString()}</td>
                            </tr>
                        </table>
                    </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html });

            if (Platform.OS === 'android') {
                try {
                    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
                    if (permissions.granted) {
                        const base64Data = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
                        const fileName = `HireNear_Invoice_${refNumber}.pdf`;
                        const newUri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, 'application/pdf');
                        await FileSystem.writeAsStringAsync(newUri, base64Data, { encoding: 'base64' });
                        Alert.alert("Success", "Invoice PDF saved to your files!");
                    }
                } catch (e) { Alert.alert("Error", "Could not save the PDF file."); }
            } else {
                await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
            }
        } catch (error) { Alert.alert('Error', 'Failed to generate PDF'); }
    };

    if (loading) return <SafeAreaView className="flex-1 justify-center items-center"><ActivityIndicator size="large" color="#0F172A" /></SafeAreaView>;
    if (!invoice) return (
        <SafeAreaView className="flex-1 justify-center items-center bg-[#F8F9FB]">
            <Text className="text-slate-500 font-bold">Invoice hasn't been generated yet.</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} className="mt-4 p-3 bg-slate-200 rounded-xl"><Text>Go Back</Text></TouchableOpacity>
        </SafeAreaView>
    );

    let badgeColor = 'bg-amber-100'; let badgeText = 'Payment Pending'; let badgeTextColor = 'text-amber-700';
    if (invoice.status === 'verifying') { badgeColor = 'bg-blue-100'; badgeText = 'Verifying Payment'; badgeTextColor = 'text-blue-700'; }
    else if (invoice.status === 'paid') { badgeColor = 'bg-emerald-100'; badgeText = 'Paid in Full'; badgeTextColor = 'text-emerald-700'; }
    else if (invoice.status === 'rejected') { badgeColor = 'bg-red-100'; badgeText = 'Payment Rejected'; badgeTextColor = 'text-red-700'; }

    const fallbackImage = 'https://via.placeholder.com/400x300?text=No+Slip+Available';
    const activeItems = isEditing ? editItems : invoice.items;
    const currentTotal = activeItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <View className="px-5 py-4 flex-row items-center justify-between bg-white shadow-sm border-b border-gray-100">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="p-2 bg-slate-50 rounded-full mr-3">
                        <Ionicons name="arrow-back" size={22} color="#334155" />
                    </TouchableOpacity>
                    <Text className="text-xl font-extrabold text-slate-800">Invoice</Text>
                </View>
                {!isEditing && (
                    <TouchableOpacity onPress={downloadPDF} className="bg-slate-100 px-3 py-2 rounded-xl flex-row items-center">
                        <Ionicons name="download-outline" size={18} color="#0f172a" />
                        <Text className="ml-1 font-bold text-slate-800 text-xs">PDF</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView className="flex-1 p-5" showsVerticalScrollIndicator={false}>
                <View className="flex-row justify-between items-center mb-4">
                    <View className="flex-row items-center">
                        <View className={`px-4 py-2 rounded-full ${badgeColor}`}>
                            <Text className={`font-bold text-xs uppercase ${badgeTextColor}`}>{badgeText}</Text>
                        </View>
                        {invoice.isUpdated && !isEditing && (
                            <View className="ml-2 bg-indigo-100 px-3 py-2 rounded-full">
                                <Text className="text-indigo-700 text-[10px] font-extrabold uppercase">Updated</Text>
                            </View>
                        )}
                    </View>

                    {/* CRUD Options for Worker if Pending */}
                    {role === 'worker' && invoice.status === 'pending' && !isEditing && (
                        <View className="flex-row gap-2">
                            <TouchableOpacity onPress={startEditing} className="p-2 bg-slate-100 rounded-full">
                                <Ionicons name="pencil" size={18} color="#334155" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleDeleteInvoice} className="p-2 bg-red-50 rounded-full">
                                <Ionicons name="trash" size={18} color="#ef4444" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* INVOICE TABLE */}
                <View className="border border-slate-200 rounded-xl overflow-hidden bg-white mb-6 shadow-sm">
                    <View className="flex-row bg-slate-100 p-4 border-b border-slate-200">
                        <Text className="flex-1 font-extrabold text-slate-700">Service / Item</Text>
                        <Text className={`w-28 font-extrabold text-slate-700 text-right ${isEditing ? 'pr-8' : ''}`}>Cost</Text>
                    </View>

                    {activeItems.map((item, index) => (
                        <View key={index} className={`flex-row p-4 border-b border-slate-50 items-center ${isEditing ? 'bg-indigo-50/30' : ''}`}>
                            {isEditing ? (
                                <>
                                    <TextInput
                                        value={item.description}
                                        onChangeText={(text) => handleInlineEdit(index, 'description', text)}
                                        className="flex-1 bg-white p-2 rounded-lg border border-slate-200 mr-2 text-slate-700 text-sm"
                                    />
                                    <TextInput
                                        value={item.amount.toString()}
                                        onChangeText={(text) => handleInlineEdit(index, 'amount', text)}
                                        editable={!item.isFixed} // Disable amount input if fixed
                                        keyboardType="numeric"
                                        className={`w-24 bg-white p-2 rounded-lg border border-slate-200 text-slate-900 text-right text-sm font-bold ${item.isFixed ? 'bg-slate-100 opacity-50' : ''}`}
                                    />

                                    {!item.isFixed ? (
                                        <TouchableOpacity onPress={() => handleRemoveEditItem(index)} className="p-2 ml-2 bg-red-50 rounded-md">
                                            <Ionicons name="trash" size={16} color="#ef4444" />
                                        </TouchableOpacity>
                                    ) : (
                                        <View className="w-[32px] ml-2" /> // Empty placeholder to keep alignment
                                    )}
                                </>
                            ) : (
                                <>
                                    <Text className="flex-1 text-slate-600 font-medium">{item.description}</Text>
                                    <Text className="w-24 text-slate-900 text-right font-bold mr-2">LKR {item.amount}</Text>
                                </>
                            )}
                        </View>
                    ))}

                    {/* Inline Editor Row for NEW items */}
                    {isEditing && (
                        <View className="p-4 bg-slate-50 border-t border-slate-200">
                            <Text className="text-xs text-slate-500 font-bold mb-2 uppercase tracking-wider">Add New Row</Text>
                            <View className="flex-row gap-2 mb-2">
                                <TextInput placeholder="New Item Description" value={editDesc} onChangeText={setEditDesc} className="flex-1 bg-white p-3 rounded-lg border border-slate-200 text-sm" />
                                <TextInput placeholder="Amount" value={editAmount} onChangeText={setEditAmount} keyboardType="numeric" className="w-24 bg-white p-3 rounded-lg border border-slate-200 text-sm" />
                            </View>
                            <TouchableOpacity onPress={handleAddEditItem} className="bg-slate-900 p-3 rounded-lg items-center">
                                <Text className="text-white font-bold text-sm">Add Item</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <View className="flex-row p-4 bg-slate-50 items-center justify-between">
                        <Text className="text-slate-500 font-bold uppercase tracking-widest text-xs">Total Amount</Text>
                        <Text className="text-2xl font-black text-emerald-600">LKR {currentTotal}</Text>
                    </View>
                </View>

                {/* Edit Action Buttons */}
                {isEditing && (
                    <View className="flex-row gap-3 mb-6">
                        <TouchableOpacity onPress={() => setIsEditing(false)} className="flex-1 bg-slate-200 p-4 rounded-xl items-center">
                            <Text className="text-slate-700 font-bold text-base">Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={saveEditedInvoice} disabled={isSavingEdit} className="flex-1 bg-emerald-600 p-4 rounded-xl items-center flex-row justify-center">
                            {isSavingEdit ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Save Changes</Text>}
                        </TouchableOpacity>
                    </View>
                )}

                {/* CLIENT ACTIONS */}
                {role === 'client' && invoice.status === 'rejected' && invoice.rejectionReason && (
                    <View className="bg-red-50 p-4 rounded-xl mb-4 border border-red-200">
                        <Text className="text-red-800 font-bold mb-1">Payment Rejected by Worker:</Text>
                        <Text className="text-red-700 text-sm">{invoice.rejectionReason}</Text>
                    </View>
                )}

                {role === 'client' && (invoice.status === 'pending' || invoice.status === 'rejected') && (
                    <TouchableOpacity onPress={handleUploadSlip} disabled={uploading} className="bg-slate-900 p-4 rounded-2xl items-center flex-row justify-center shadow-md mb-6">
                        {uploading ? <ActivityIndicator color="#fff" /> : (
                            <>
                                <Ionicons name="cloud-upload" size={24} color="#fff" />
                                <Text className="text-white text-lg font-bold ml-2">
                                    {invoice.status === 'rejected' ? 'Re-upload Payment Slip' : 'Upload Payment Slip'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {role === 'client' && invoice.status === 'verifying' && (
                    <View className="bg-blue-50 p-4 rounded-2xl items-center flex-row justify-center border border-blue-200 mb-6">
                        <Ionicons name="time" size={24} color="#1d4ed8" />
                        <Text className="text-blue-800 text-lg font-bold ml-2">Waiting for Worker Approval</Text>
                    </View>
                )}

                {/* WORKER ACTIONS */}
                {role === 'worker' && invoice.status === 'pending' && !isEditing && (
                    <TouchableOpacity onPress={handleCashPayment} disabled={verifying} className="bg-slate-900 p-4 rounded-2xl items-center flex-row justify-center shadow-md mb-6">
                        {verifying ? <ActivityIndicator color="#fff" /> : (
                            <>
                                <Ionicons name="cash-outline" size={24} color="#fff" />
                                <Text className="text-white text-lg font-bold ml-2">Mark as Paid in Cash</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {role === 'worker' && invoice.status === 'verifying' && invoice.paymentSlipUrl !== 'CASH' && (
                    <View className="mb-6 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                        <Text className="font-bold text-slate-800 mb-3 text-lg">Review Payment Slip</Text>
                        <TouchableOpacity onPress={() => setViewerVisible(true)}>
                            <Image source={{ uri: invoice.paymentSlipUrl || fallbackImage }} className="w-full h-64 rounded-xl bg-gray-100 mb-4" resizeMode="cover" />
                            <View className="absolute bottom-6 right-2 bg-black/60 px-3 py-1 rounded-full flex-row items-center">
                                <Ionicons name="scan" size={14} color="white" />
                                <Text className="text-white text-xs ml-1 font-bold">Tap to Zoom</Text>
                            </View>
                        </TouchableOpacity>

                        <View className="flex-row gap-3 mt-2">
                            <TouchableOpacity onPress={() => setRejectModalVisible(true)} disabled={verifying} className="flex-1 border border-red-200 bg-red-50 p-4 rounded-2xl items-center flex-row justify-center">
                                <Ionicons name="close-circle" size={20} color="#ef4444" />
                                <Text className="text-red-600 text-sm font-bold ml-1">Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleVerifyPayment} disabled={verifying} className="flex-[2] bg-emerald-600 p-4 rounded-2xl items-center flex-row justify-center shadow-md">
                                {verifying ? <ActivityIndicator color="#fff" /> : (
                                    <>
                                        <Ionicons name="checkmark-done" size={20} color="#fff" />
                                        <Text className="text-white text-base font-bold ml-2">Accept Payment</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* COMPLETED RECEIPT */}
                {invoice.status === 'paid' && (
                    <View className="mb-10">
                        <Text className="font-bold text-slate-800 mb-3 text-lg">Payment Receipt</Text>

                        {invoice.paymentSlipUrl === 'CASH' ? (
                            <View className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl items-center justify-center shadow-sm">
                                <Ionicons name="cash" size={48} color="#059669" />
                                <Text className="text-emerald-700 font-black text-xl mt-2 tracking-widest">PAID IN CASH</Text>
                            </View>
                        ) : (
                            <TouchableOpacity onPress={() => setViewerVisible(true)} className="border border-emerald-100 p-2 rounded-2xl bg-white shadow-sm relative">
                                <Image source={{ uri: invoice.paymentSlipUrl || fallbackImage }} className="w-full h-64 rounded-xl bg-gray-100" resizeMode="cover" />
                                <View className="absolute bottom-4 right-4 bg-black/60 px-3 py-1 rounded-full flex-row items-center">
                                    <Ionicons name="scan" size={14} color="white" />
                                    <Text className="text-white text-xs ml-1 font-bold">Tap to Zoom</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </ScrollView>

            {invoice?.paymentSlipUrl && invoice.paymentSlipUrl !== 'CASH' && (
                <ImageView
                    images={[{ uri: invoice.paymentSlipUrl || fallbackImage }]}
                    imageIndex={0}
                    visible={viewerVisible}
                    onRequestClose={() => setViewerVisible(false)}
                    swipeToCloseEnabled={true}
                />
            )}

            {/* REJECTION MODAL */}
            <Modal animationType="fade" transparent={true} visible={rejectModalVisible} onRequestClose={() => setRejectModalVisible(false)}>
                <View className="flex-1 bg-black/50 justify-center items-center p-5">
                    <View className="bg-white w-full rounded-3xl p-6">
                        <Text className="text-xl font-bold text-slate-800 mb-2">Reject Payment Slip</Text>
                        <Text className="text-slate-500 mb-4 text-sm">Please provide a reason so the client knows what to fix.</Text>
                        <TextInput
                            className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-800 mb-6 h-24"
                            placeholder="E.g., Amount doesn't match, image is blurry..."
                            multiline
                            textAlignVertical="top"
                            value={rejectReason}
                            onChangeText={setRejectReason}
                        />
                        <View className="flex-row gap-3">
                            <TouchableOpacity onPress={() => setRejectModalVisible(false)} className="flex-1 bg-slate-200 p-4 rounded-xl items-center">
                                <Text className="text-slate-700 font-bold">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleRejectPayment} disabled={rejecting} className="flex-1 bg-red-600 p-4 rounded-xl items-center flex-row justify-center">
                                {rejecting ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Submit</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
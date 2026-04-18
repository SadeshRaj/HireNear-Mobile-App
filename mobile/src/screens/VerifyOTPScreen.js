import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../config';

export default function VerifyOTPScreen({ route, navigation }) {
    const { phone } = route.params;
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const showError = (msg) => {
        setErrorMessage(msg);
        setTimeout(() => setErrorMessage(''), 4000);
    };

    const handleVerify = async () => {
        if (otp.length < 4) return showError("Enter the 4-digit code.");

        setLoading(true);
        setErrorMessage('');

        try {
            console.log(`Sending Verify Request -> Phone: ${phone}, OTP: ${otp}`);

            const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp }),
            });

            const data = await response.json();
            console.log("Backend Response:", response.status, data);

            if (response.ok) {
                // Navigate seamlessly on success instead of halting with an alert
                navigation.replace('Dashboard');
                navigation.replace('MainTabs', { user: data.user });
            } else {
                showError(data.msg || data.error || "Something went wrong.");
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            showError("Could not connect to server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white px-8 justify-center">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <Text className="text-3xl font-bold text-slate-900 mb-2 text-center">Verify Phone</Text>
                <Text className="text-slate-500 mb-8 text-center">
                    Enter the code sent to {phone}
                </Text>

                {errorMessage !== '' && (
                    <View className="bg-red-50 p-3 rounded-2xl border border-red-100 mb-5 flex-row items-center shadow-sm">
                        <Ionicons name="alert-circle" size={20} color="#ef4444" />
                        <Text className="text-red-600 font-medium ml-2 flex-1">{errorMessage}</Text>
                    </View>
                )}

                <TextInput
                    className="bg-slate-100 rounded-2xl py-5 text-center text-3xl font-bold tracking-[20] mb-8"
                    placeholder="0000"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={otp}
                    onChangeText={setOtp}
                    autoFocus={true}
                />

                <TouchableOpacity
                    className={`bg-slate-900 py-4 rounded-3xl shadow-lg ${loading ? 'opacity-50' : ''}`}
                    onPress={handleVerify}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white text-center font-bold text-lg">Confirm & Continue</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity className="mt-6" onPress={() => navigation.goBack()}>
                    <Text className="text-slate-500 text-center font-medium">Changed your number? Go back</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
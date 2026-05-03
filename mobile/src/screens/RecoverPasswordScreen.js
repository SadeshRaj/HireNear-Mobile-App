import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../config';

export default function RecoverPasswordScreen({ navigation }) {
    const [step, setStep] = useState(1); // 1: Phone, 2: OTP & New Password
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendOTP = async () => {
        if (!phone) {
            setError('Please enter your registered mobile number.');
            return;
        }
        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });

            const data = await response.json();

            if (response.ok) {
                setStep(2);
                Alert.alert("OTP Sent", "An OTP has been sent to your mobile number.");
            } else {
                setError(data.msg || data.error || 'Failed to send OTP.');
            }
        } catch (err) {
            console.error('Forgot Password Error:', err);
            setError('Network error. Check server and IP.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!otp || !password || !confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$&*]).{6,}$/;
        if (!passwordRegex.test(password)) {
            setError("Password must be at least 6 characters, include a capital letter and a symbol.");
            return;
        }

        setError('');
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp, newPassword: password }),
            });

            const data = await response.json();

            if (response.ok) {
                Alert.alert(
                    'Success',
                    'Your password has been reset successfully.',
                    [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
                );
            } else {
                setError(data.msg || data.error || 'Failed to reset password.');
            }
        } catch (err) {
            console.error('Reset Password Error:', err);
            setError('Network error. Check server and IP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView 
                    className="flex-1 px-8 pt-6"
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mb-8 w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100">
                        <Ionicons name="arrow-back" size={24} color="#0f172a" />
                    </TouchableOpacity>

                    <View className="mb-10">
                        <Text className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                            {step === 1 ? 'Recover Password' : 'Reset Password'}
                        </Text>
                        <Text className="text-slate-500 text-base font-medium">
                            {step === 1 
                                ? 'Enter your mobile number to receive an OTP.' 
                                : 'Enter the OTP and your new password.'}
                        </Text>
                    </View>

                    {!!error && (
                        <View className="bg-red-50 p-3 rounded-2xl border border-red-100 mb-5 flex-row items-center">
                            <Ionicons name="alert-circle" size={20} color="#ef4444" />
                            <Text className="text-red-600 font-medium ml-2 flex-1">{error}</Text>
                        </View>
                    )}

                    {step === 1 ? (
                        <View className="mb-8">
                            <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100 mb-5">
                                <Ionicons name="call-outline" size={22} color="#94a3b8" />
                                <TextInput
                                    placeholder="Mobile Number"
                                    className="flex-1 ml-3 text-base text-slate-800"
                                    placeholderTextColor="#94a3b8"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="phone-pad"
                                />
                            </View>

                            <TouchableOpacity
                                className={`bg-slate-900 rounded-3xl py-4 items-center shadow-md ${loading ? 'opacity-70' : ''}`}
                                onPress={handleSendOTP}
                                disabled={loading}
                            >
                                <Text className="text-white font-bold text-lg tracking-wide">
                                    {loading ? 'Sending OTP...' : 'Send OTP'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View className="mb-8">
                            <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100 mb-5">
                                <Ionicons name="keypad-outline" size={22} color="#94a3b8" />
                                <TextInput
                                    placeholder="Enter OTP"
                                    className="flex-1 ml-3 text-base text-slate-800"
                                    placeholderTextColor="#94a3b8"
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="number-pad"
                                />
                            </View>

                            <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100 mb-5">
                                <Ionicons name="lock-closed-outline" size={22} color="#94a3b8" />
                                <TextInput
                                    placeholder="New Password"
                                    className="flex-1 ml-3 text-base text-slate-800"
                                    placeholderTextColor="#94a3b8"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>

                            <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100 mb-2">
                                <Ionicons name="lock-closed-outline" size={22} color="#94a3b8" />
                                <TextInput
                                    placeholder="Verify Password"
                                    className="flex-1 ml-3 text-base text-slate-800"
                                    placeholderTextColor="#94a3b8"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                />
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} className="p-1">
                                    <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#94a3b8" />
                                </TouchableOpacity>
                            </View>
                            
                            <Text className="text-slate-500 text-xs ml-2 mb-6">* Minimum 6 characters, 1 capital letter, and 1 symbol (!@#$&*).</Text>

                            <TouchableOpacity
                                className={`bg-slate-900 rounded-3xl py-4 items-center shadow-md ${loading ? 'opacity-70' : ''}`}
                                onPress={handleResetPassword}
                                disabled={loading}
                            >
                                <Text className="text-white font-bold text-lg tracking-wide">
                                    {loading ? 'Resetting Password...' : 'Reset Password'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

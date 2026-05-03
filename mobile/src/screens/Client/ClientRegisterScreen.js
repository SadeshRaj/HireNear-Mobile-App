import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { API_BASE_URL } from '../../../config'; // ADD THIS IMPORT

export default function ClientRegisterScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState(''); // NEW: Phone state
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegistration = async () => {
        // Updated Validation to include phone
        if (!name || !email || !phone || !password) {
            setErrorMessage('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$&*]).{6,}$/;
        if (!passwordRegex.test(password)) {
            setErrorMessage("Password must be at least 6 characters, include a capital letter and a symbol.");
            return;
        }

        setLoading(true);

        try {
            // Try to get GPS location — silently fall back to Colombo default if unavailable
            let locationData = {
                type: 'Point',
                coordinates: [79.8612, 6.9271] // Default: Colombo, Sri Lanka
            };

            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const currentLocation = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                        timeInterval: 5000,
                    });
                    locationData = {
                        type: 'Point',
                        coordinates: [currentLocation.coords.longitude, currentLocation.coords.latitude]
                    };
                }
            } catch {
                // Location unavailable (emulator/no GPS) — using Colombo default
            }

            // API Call using config URL
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    phone,
                    password,
                    role: 'Client',
                    location: locationData
                }),
            });

            // --- ADDED DEBUGGING LOGIC ---
            const rawText = await response.text();
            console.log("RAW RESPONSE STATUS:", response.status);
            console.log("RAW RESPONSE TEXT:", rawText);

            let data;
            try {
                data = JSON.parse(rawText);
            } catch (parseError) {
                console.error("JSON Parse Error. The server did not return JSON.");
                setErrorMessage(`Server Error (Status: ${response.status})`);
                setLoading(false);
                return;
            }
            // --- END DEBUGGING LOGIC ---

            if (response.ok) {
                // Dev mode: user is already verified, skip OTP → go to Login
                // Production: SMS was sent → go to OTP verification screen
                if (data.msg && data.msg.includes('dev mode')) {
                    Alert.alert('Registered!', 'Account created. Please sign in.', [
                        { text: 'OK', onPress: () => navigation.replace('Login') }
                    ]);
                } else {
                    navigation.navigate('VerifyOTP', { phone: phone });
                }
            } else {
                setErrorMessage(data.msg || 'Registration failed');
            }
        } catch (error) {
            console.error(error);
            setErrorMessage('Network error. Check server and IP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            {/* 1. Improved KeyboardAvoidingView: 'padding' usually works best on iOS, 'height' on Android */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
            >
                <ScrollView
                    className="flex-1 px-8 pt-6"
                    showsVerticalScrollIndicator={false}
                    // 2. THIS IS KEY: Allows you to scroll past the keyboard
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
                    keyboardShouldPersistTaps="handled"
                >

                    <TouchableOpacity onPress={() => navigation.goBack()} className="mb-8 w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100">
                        <Ionicons name="arrow-back" size={24} color="#0f172a" />
                    </TouchableOpacity>

                    <View className="mb-10">
                        <Text className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Join Us.</Text>
                        <Text className="text-slate-500 text-base font-medium">Register as a Client to hire services.</Text>
                    </View>

                    <View className="flex-row justify-between mb-8 bg-slate-200/50 p-1.5 rounded-full">
                        <View className="flex-1 py-3 rounded-full items-center bg-white shadow-sm">
                            <Text className="font-bold text-slate-900">I want to Hire</Text>
                        </View>
                        <TouchableOpacity
                            className="flex-1 py-3 rounded-full items-center"
                            onPress={() => navigation.navigate('WorkerRegister')}
                        >
                            <Text className="font-bold text-slate-500">I am a Worker</Text>
                        </TouchableOpacity>
                    </View>

                    {errorMessage !== '' && (
                        <View className="bg-red-50 p-3 rounded-2xl border border-red-100 mb-5 flex-row items-center">
                            <Ionicons name="alert-circle" size={20} color="#ef4444" />
                            <Text className="text-red-600 font-medium ml-2">{errorMessage}</Text>
                        </View>
                    )}

                    <View className="mb-8">
                        <InputField icon="person-outline" placeholder="Full Name" value={name} onChangeText={setName} />
                        <InputField icon="mail-outline" placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

                        {/* NEW: Mobile Number Input */}
                        <InputField
                            icon="call-outline"
                            placeholder="Mobile Number"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />

                        <PasswordField placeholder="Create password" value={password} show={showPassword} setShow={setShowPassword} onChangeText={setPassword} />
                        <PasswordField placeholder="Verify password" value={confirmPassword} show={showConfirmPassword} setShow={setShowConfirmPassword} onChangeText={setConfirmPassword} />
                        <Text className="text-slate-500 text-xs ml-2 mb-2 -mt-3">* Minimum 6 characters, 1 capital letter, and 1 symbol (!@#$&*).</Text>
                    </View>

                    <TouchableOpacity
                        className={`bg-slate-900 rounded-3xl py-4 items-center shadow-md mb-12 ${loading ? 'opacity-70' : ''}`}
                        onPress={handleRegistration}
                        disabled={loading}
                    >
                        <Text className="text-white font-bold text-lg tracking-wide">
                            {loading ? 'Processing...' : 'Create Client Account'}
                        </Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// Sub-components
const InputField = ({ icon, ...props }) => (
    <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100 mb-5">
        <Ionicons name={icon} size={22} color="#94a3b8" />
        <TextInput
            className="flex-1 ml-3 text-base text-slate-800"
            placeholderTextColor="#94a3b8"
            {...props}
        />
    </View>
);

const PasswordField = ({ placeholder, value, show, setShow, onChangeText }) => (
    <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100 mb-5">
        <Ionicons name="lock-closed-outline" size={22} color="#94a3b8" />
        <TextInput
            placeholder={placeholder}
            className="flex-1 ml-3 text-base text-slate-800"
            placeholderTextColor="#94a3b8"
            value={value}
            onChangeText={onChangeText}
            secureTextEntry={!show}
        />
        <TouchableOpacity onPress={() => setShow(!show)} className="p-1">
            <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={22} color="#94a3b8" />
        </TouchableOpacity>
    </View>
);
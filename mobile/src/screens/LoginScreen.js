import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../config'; // ADD THIS IMPORT

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        // Basic Validation
        if (!email || !password) {
            return Alert.alert("Error", "Please fill in all fields.");
        }

        setLoading(true);
        try {
            // REPLACE the hardcoded URL with API_BASE_URL
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Login Success!
                console.log("Login Success User Data:", data.user);

                // You can pass the user data to the dashboard if needed
                navigation.replace('Dashboard', { user: data.user });

            } else {
                // Login Failed (Wrong password, user not found, or not verified)
                Alert.alert("Login Failed", data.msg || "Invalid credentials.");

                // Logic: If user is not verified, you could redirect them to OTP screen
                if (data.unverified) {
                    // Note: You'd need to send the phone number from the backend in the error response
                    // to make this navigation work perfectly.
                }
            }
        } catch (error) {
            console.error("Login Error:", error);
            Alert.alert("Error", "Could not connect to the server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1 justify-center px-8"
            >
                <View className="mb-12">
                    <Text className="text-5xl font-extrabold text-slate-900 tracking-tighter mb-3">HireNear.</Text>
                    <Text className="text-slate-500 text-lg font-medium">Premium services, right at your doorstep.</Text>
                </View>

                <View className="mb-6">
                    <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100 mb-5">
                        <Ionicons name="mail-outline" size={22} color="#94a3b8" />
                        <TextInput
                            placeholder="Email address"
                            className="flex-1 ml-3 text-base text-slate-800"
                            placeholderTextColor="#94a3b8"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100">
                        <Ionicons name="lock-closed-outline" size={22} color="#94a3b8" />
                        <TextInput
                            placeholder="Password"
                            className="flex-1 ml-3 text-base text-slate-800"
                            placeholderTextColor="#94a3b8"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>
                </View>

                <TouchableOpacity className="items-end mb-8">
                    <Text className="text-emerald-700 font-semibold">Recover Password</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className={`bg-slate-900 rounded-3xl py-4 items-center shadow-md mb-8 ${loading ? 'opacity-70' : ''}`}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg tracking-wide">Sign In</Text>
                    )}
                </TouchableOpacity>

                <View className="flex-row justify-center mt-4">
                    <Text className="text-slate-500 font-medium">New to HireNear? </Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text className="text-emerald-700 font-bold">Create Account</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
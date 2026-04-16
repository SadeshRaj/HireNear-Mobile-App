import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        // DEV BYPASS: skip login if no credentials entered
        if (!email && !password) {
            navigation.replace('ClientDashboard');
            return;
        }
        if (!email || !password) {
            setError('Please enter your email and password.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const response = await fetch('http://192.168.1.4:3001/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();

            if (response.ok) {
                // Store token and user info
                await AsyncStorage.setItem('token', data.token);
                await AsyncStorage.setItem('user', JSON.stringify(data.user));

                // Route based on role
                if (data.user.role === 'Client') {
                    navigation.replace('ClientDashboard');
                } else {
                    navigation.replace('Dashboard');
                }
            } else {
                setError(data.msg || 'Login failed. Check your credentials.');
            }
        } catch {
            setError('Network error. Make sure the server is running.');
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

                {/* Error */}
                {!!error && (
                    <View className="bg-red-50 p-3 rounded-2xl border border-red-100 mb-5 flex-row items-center">
                        <Ionicons name="alert-circle" size={20} color="#ef4444" />
                        <Text className="text-red-600 font-medium ml-2 flex-1">{error}</Text>
                    </View>
                )}

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
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#94a3b8" />
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity className="items-end mb-8">
                    <Text className="text-emerald-700 font-semibold">Recover Password</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className={`bg-slate-900 rounded-3xl py-4 items-center shadow-md mb-8 ${loading ? 'opacity-60' : ''}`}
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
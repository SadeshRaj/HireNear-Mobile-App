import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [role, setRole] = useState('Hire'); // 'Hire' or 'Work'

    // State for our custom disappearing notification
    const [errorMessage, setErrorMessage] = useState('');

    const handleRegistration = () => {
        if (password !== confirmPassword) {
            // Show custom inline error instead of a default browser/system alert
            setErrorMessage('Passwords do not match. Please try again.');
            setTimeout(() => {
                setErrorMessage('');
            }, 3000); // Disappears after 3 seconds
            return;
        }

        // Proceed with registration logic here
        navigation.replace('Dashboard');
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1 px-8 pt-6" showsVerticalScrollIndicator={false}>

                    <TouchableOpacity onPress={() => navigation.goBack()} className="mb-8 w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100">
                        <Ionicons name="arrow-back" size={24} color="#0f172a" />
                    </TouchableOpacity>

                    <View className="mb-10">
                        <Text className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Join Us.</Text>
                        <Text className="text-slate-500 text-base font-medium">Experience the best service marketplace.</Text>
                    </View>

                    {/* Professional Role Selection Toggle */}
                    <View className="flex-row justify-between mb-8 bg-slate-200/50 p-1.5 rounded-full">
                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-full items-center ${role === 'Hire' ? 'bg-white shadow-sm' : ''}`}
                            onPress={() => setRole('Hire')}
                        >
                            <Text className={`font-bold ${role === 'Hire' ? 'text-slate-900' : 'text-slate-500'}`}>Looking to Hire</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-full items-center ${role === 'Work' ? 'bg-white shadow-sm' : ''}`}
                            onPress={() => setRole('Work')}
                        >
                            <Text className={`font-bold ${role === 'Work' ? 'text-slate-900' : 'text-slate-500'}`}>Offering Services</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Custom Disappearing Error Notification */}
                    {errorMessage !== '' && (
                        <View className="bg-red-50 p-3 rounded-2xl border border-red-100 mb-5 flex-row items-center">
                            <Ionicons name="alert-circle" size={20} color="#ef4444" />
                            <Text className="text-red-600 font-medium ml-2">{errorMessage}</Text>
                        </View>
                    )}

                    <View className="mb-8">
                        <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100 mb-5">
                            <Ionicons name="person-outline" size={22} color="#94a3b8" />
                            <TextInput
                                placeholder="Full Name"
                                className="flex-1 ml-3 text-base text-slate-800"
                                placeholderTextColor="#94a3b8"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

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

                        <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100 mb-5">
                            <Ionicons name="lock-closed-outline" size={22} color="#94a3b8" />
                            <TextInput
                                placeholder="Create password"
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

                        <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100">
                            <Ionicons name="shield-checkmark-outline" size={22} color="#94a3b8" />
                            <TextInput
                                placeholder="Verify password"
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
                    </View>

                    <TouchableOpacity
                        className="bg-slate-900 rounded-3xl py-4 items-center shadow-md mb-12"
                        onPress={handleRegistration}
                    >
                        <Text className="text-white font-bold text-lg tracking-wide">Create Account</Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
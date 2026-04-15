import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ClientRegisterScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleRegistration = () => {
        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match. Please try again.');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }
        // Logic for Client Registration
        navigation.replace('Dashboard');
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1 px-8 pt-6" showsVerticalScrollIndicator={false}>

                    {/* Back Button */}
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mb-8 w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100">
                        <Ionicons name="arrow-back" size={24} color="#0f172a" />
                    </TouchableOpacity>

                    <View className="mb-10">
                        <Text className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Join Us.</Text>
                        <Text className="text-slate-500 text-base font-medium">Experience the best service marketplace.</Text>
                    </View>

                    {/* Navigation Toggle - This is the fix! */}
                    <View className="flex-row justify-between mb-8 bg-slate-200/50 p-1.5 rounded-full">
                        <TouchableOpacity className="flex-1 py-3 rounded-full items-center bg-white shadow-sm">
                            <Text className="font-bold text-slate-900">Looking to Hire</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-1 py-3 rounded-full items-center"
                            onPress={() => navigation.navigate('WorkerRegister')} // Move to worker screen immediately
                        >
                            <Text className="font-bold text-slate-500">Offering Services</Text>
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
                        <InputField icon="mail-outline" placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" />

                        <PasswordField
                            placeholder="Create password"
                            value={password}
                            show={showPassword}
                            setShow={setShowPassword}
                            onChangeText={setPassword}
                        />

                        <PasswordField
                            placeholder="Verify password"
                            value={confirmPassword}
                            show={showConfirmPassword}
                            setShow={setShowConfirmPassword}
                            onChangeText={setConfirmPassword}
                        />
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

// Reusable Sub-components to keep the main code clean
const InputField = ({ icon, ...props }) => (
    <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100 mb-5">
        <Ionicons name={icon} size={22} color="#94a3b8" />
        <TextInput className="flex-1 ml-3 text-base text-slate-800" placeholderTextColor="#94a3b8" {...props} />
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
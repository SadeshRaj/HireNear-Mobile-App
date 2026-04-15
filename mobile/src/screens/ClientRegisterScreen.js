import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

export default function ClientRegisterScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegistration = async () => {
        if (!name || !email || !password) {
            setErrorMessage('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            // 1. Get Location
            let { status } = await Location.requestForegroundPermissionsAsync();
            let locationData = null;

            if (status === 'granted') {
                const currentLocation = await Location.getCurrentPositionAsync({});
                locationData = {
                    type: "Point",
                    coordinates: [currentLocation.coords.longitude, currentLocation.coords.latitude]
                };
            } else {
                Alert.alert("Permission Denied", "Location is required for registration.");
                setLoading(false);
                return;
            }

            // 2. API Call
            const response = await fetch('http://192.168.1.180:5000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    role: 'Client', // Updated to 'Client'
                    location: locationData
                }),
            });

            // Parse response carefully
            const data = await response.json();

            if (response.ok) {
                Alert.alert("Success", "Client account created!");
                navigation.replace('Dashboard');
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
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1 px-8 pt-6" showsVerticalScrollIndicator={false}>

                    <TouchableOpacity onPress={() => navigation.goBack()} className="mb-8 w-12 h-12 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100">
                        <Ionicons name="arrow-back" size={24} color="#0f172a" />
                    </TouchableOpacity>

                    <View className="mb-10">
                        <Text className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Join Us.</Text>
                        <Text className="text-slate-500 text-base font-medium">Register as a Client to hire services.</Text>
                    </View>

                    {/* Simplified Toggle */}
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
                        <InputField icon="mail-outline" placeholder="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" />
                        <PasswordField placeholder="Create password" value={password} show={showPassword} setShow={setShowPassword} onChangeText={setPassword} />
                        <PasswordField placeholder="Verify password" value={confirmPassword} show={showConfirmPassword} setShow={setShowConfirmPassword} onChangeText={setConfirmPassword} />
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

// Sub-components (InputField and PasswordField remain the same as your previous version)
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
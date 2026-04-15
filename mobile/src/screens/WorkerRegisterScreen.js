import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function WorkerRegisterScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [skills, setSkills] = useState(''); // Comma separated: "Plumbing, Electrician"
    const [bio, setBio] = useState('');
    const [password, setPassword] = useState('');

    const handleWorkerRegistration = () => {
        // Logic to format skills into an array for your MongoDB schema
        const workerData = {
            name,
            email,
            phone,
            role: 'worker',
            skills: skills.split(',').map(s => s.trim()),
            bio,
            password,
            rating: 0,
            totalReviews: 0
        };

        console.log("Registering Worker:", workerData);
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
                        <Text className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Pro Partner.</Text>
                        <Text className="text-slate-500 text-base font-medium">List your services and start earning.</Text>
                    </View>

                    <View className="mb-8">
                        {/* Name Input */}
                        <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100 mb-5">
                            <Ionicons name="person-outline" size={22} color="#94a3b8" />
                            <TextInput
                                placeholder="Full Name"
                                className="flex-1 ml-3 text-base text-slate-800"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>

                        {/* Email Input */}
                        <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100 mb-5">
                            <Ionicons name="mail-outline" size={22} color="#94a3b8" />
                            <TextInput
                                placeholder="Email address"
                                className="flex-1 ml-3 text-base text-slate-800"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                            />
                        </View>

                        {/* Phone Input */}
                        <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100 mb-5">
                            <Ionicons name="call-outline" size={22} color="#94a3b8" />
                            <TextInput
                                placeholder="Phone (e.g., 071...)"
                                className="flex-1 ml-3 text-base text-slate-800"
                                value={phone}
                                onChangeText={setPhone}
                                keyboardType="phone-pad"
                            />
                        </View>

                        {/* Skills Input */}
                        <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100 mb-5">
                            <Ionicons name="construct-outline" size={22} color="#94a3b8" />
                            <TextInput
                                placeholder="Skills (e.g. Plumbing, Wiring)"
                                className="flex-1 ml-3 text-base text-slate-800"
                                value={skills}
                                onChangeText={setSkills}
                            />
                        </View>

                        {/* Bio Input */}
                        <View className="bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100 mb-5">
                            <View className="flex-row items-start">
                                <Ionicons name="document-text-outline" size={22} color="#94a3b8" />
                                <TextInput
                                    placeholder="Brief professional bio..."
                                    className="flex-1 ml-3 text-base text-slate-800 h-24"
                                    multiline
                                    textAlignVertical="top"
                                    value={bio}
                                    onChangeText={setBio}
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100 mb-5">
                            <Ionicons name="lock-closed-outline" size={22} color="#94a3b8" />
                            <TextInput
                                placeholder="Create password"
                                className="flex-1 ml-3 text-base text-slate-800"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        className="bg-blue-600 rounded-3xl py-4 items-center shadow-md mb-12"
                        onPress={handleWorkerRegistration}
                    >
                        <Text className="text-white font-bold text-lg tracking-wide">Register as Worker</Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
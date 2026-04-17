import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../../config'; // ADDED: Import your config

// Pre-defined list of skills
const PRESET_SKILLS = ["Plumbing", "Electrical", "Carpentry", "Cleaning", "Painting", "AC Repair", "Gardening", "Masonry"];

export default function WorkerRegisterScreen({ navigation }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [bio, setBio] = useState('');
    const [password, setPassword] = useState('');

    // Skills State
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [customSkill, setCustomSkill] = useState('');

    const [loading, setLoading] = useState(false);

    // Toggle skill selection
    const toggleSkill = (skill) => {
        if (selectedSkills.includes(skill)) {
            setSelectedSkills(selectedSkills.filter(s => s !== skill));
        } else {
            setSelectedSkills([...selectedSkills, skill]);
        }
    };

    // Add a custom skill to the list
    const addCustomSkill = () => {
        const trimmed = customSkill.trim();
        if (trimmed && !selectedSkills.includes(trimmed)) {
            setSelectedSkills([...selectedSkills, trimmed]);
            setCustomSkill('');
        }
    };

    const handleWorkerRegistration = async () => {
        if (!name || !email || !phone || !password || selectedSkills.length === 0) {
            return Alert.alert("Error", "Please fill in all fields and select at least one skill.");
        }

        setLoading(true);
        try {
            const workerData = {
                name,
                email,
                phone,
                password,
                role: 'Worker',
                skills: selectedSkills,
                bio,
                location: { type: 'Point', coordinates: [79.8612, 6.9271] }
            };

            // CHANGED: Using dynamic API URL
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(workerData),
            });

            const data = await response.json();

            if (response.ok) {
                navigation.navigate('VerifyOTP', { phone: data.phone || phone });
            } else {
                Alert.alert("Registration Failed", data.msg || "Something went wrong.");
            }
        } catch (error) {
            Alert.alert("Error", "Could not connect to server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1 px-8 pt-6" showsVerticalScrollIndicator={false}>

                    <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-gray-100">
                        <Ionicons name="arrow-back" size={20} color="#0f172a" />
                    </TouchableOpacity>

                    <View className="mb-6">
                        <Text className="text-3xl font-extrabold text-slate-900 tracking-tight">Pro Partner.</Text>
                        <Text className="text-slate-500 text-sm font-medium">Select your expertise and join us.</Text>
                    </View>

                    {/* Standard Inputs */}
                    <View className="space-y-4 mb-6">
                        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100">
                            <Ionicons name="person-outline" size={20} color="#94a3b8" />
                            <TextInput placeholder="Full Name" className="flex-1 ml-3 text-slate-800" value={name} onChangeText={setName} />
                        </View>

                        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 mt-3">
                            <Ionicons name="mail-outline" size={20} color="#94a3b8" />
                            <TextInput placeholder="Email" className="flex-1 ml-3 text-slate-800" value={email} onChangeText={setEmail} autoCapitalize="none" />
                        </View>

                        <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 mt-3">
                            <Ionicons name="call-outline" size={20} color="#94a3b8" />
                            <TextInput placeholder="Phone" className="flex-1 ml-3 text-slate-800" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
                        </View>
                    </View>

                    {/* SKILLS TILES SECTION */}
                    <Text className="text-slate-900 font-bold mb-3 text-lg">Your Skills</Text>
                    <View className="flex-row flex-wrap mb-4">
                        {PRESET_SKILLS.map((skill) => {
                            const isSelected = selectedSkills.includes(skill);
                            return (
                                <TouchableOpacity
                                    key={skill}
                                    onPress={() => toggleSkill(skill)}
                                    className={`mr-2 mb-2 px-4 py-2 rounded-full border ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-200 shadow-sm'}`}
                                >
                                    <Text className={`${isSelected ? 'text-white font-bold' : 'text-slate-600'}`}>{skill}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* CUSTOM SKILL INPUT */}
                    <View className="flex-row items-center bg-white rounded-2xl px-4 py-2 border border-dashed border-gray-300 mb-6">
                        <TextInput
                            placeholder="Other skill..."
                            className="flex-1 text-slate-800"
                            value={customSkill}
                            onChangeText={setCustomSkill}
                        />
                        <TouchableOpacity onPress={addCustomSkill} className="bg-slate-100 p-2 rounded-xl">
                            <Ionicons name="add" size={20} color="#0f172a" />
                        </TouchableOpacity>
                    </View>

                    {/* BIO & PASSWORD */}
                    <View className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 mb-4">
                        <TextInput placeholder="Professional Bio" className="h-20 text-slate-800" multiline value={bio} onChangeText={setBio} textAlignVertical="top" />
                    </View>

                    <View className="flex-row items-center bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 mb-8">
                        <Ionicons name="lock-closed-outline" size={20} color="#94a3b8" />
                        <TextInput placeholder="Password" secureTextEntry className="flex-1 ml-3 text-slate-800" value={password} onChangeText={setPassword} />
                    </View>

                    <TouchableOpacity
                        className={`bg-blue-600 rounded-3xl py-4 items-center shadow-lg mb-10 ${loading ? 'opacity-70' : ''}`}
                        onPress={handleWorkerRegistration}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Register as Partner</Text>}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
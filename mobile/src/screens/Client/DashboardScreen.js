import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Dimensions, FlatList, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native'; // Added for refreshing badge
import { io } from 'socket.io-client'; // Added for real-time notifications
import { API_BASE_URL } from '../../../config';

const { width } = Dimensions.get('window');

const CAROUSEL_IMAGES = [
    { id: '1', uri: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?q=80&w=1000&auto=format&fit=crop' },
    { id: '2', uri: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1000&auto=format&fit=crop' },
    { id: '3', uri: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1000&auto=format&fit=crop' },
];

export default function DashboardScreen({ navigation, route }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const flatListRef = useRef(null);

    const [currentUser, setCurrentUser] = useState(route?.params?.user || {});
    const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Guest';

    // Data States
    const [topWorkers, setTopWorkers] = useState([]);
    const [userStats, setUserStats] = useState({ openJobs: 0, activeBookings: 0 });
    const [isLoading, setIsLoading] = useState(true);

    // UI States
    const [isProfileModalVisible, setProfileModalVisible] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState(currentUser?.name || '');
    const [editProfileImage, setEditProfileImage] = useState(currentUser?.profileImage || '');
    const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

    // NEW: Notification State
    const [unreadCount, setUnreadCount] = useState(0);

    // NEW: Fetch unread count whenever the screen comes into focus
    const fetchUnreadCount = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const userId = currentUser?._id || currentUser?.id;
            if (!token || !userId) return;

            const res = await fetch(`${API_BASE_URL}/support/unread/${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.unreadCount !== undefined) {
                setUnreadCount(data.unreadCount);
            }
        } catch (error) {
            console.error("Failed to fetch unread count", error);
        }
    };

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            const token = await AsyncStorage.getItem('token');
            const userId = currentUser?._id || currentUser?.id;
            
            if (token) {
                // Fetch top workers
                const workersRes = await fetch(`${API_BASE_URL}/auth/workers/top`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (workersRes.ok) {
                    const workersData = await workersRes.json();
                    setTopWorkers(workersData);
                }

                // Fetch user's jobs for stats
                if (userId) {
                    const jobsRes = await fetch(`${API_BASE_URL}/jobs/my-jobs/${userId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (jobsRes.ok) {
                        const jobsData = await jobsRes.json();
                        if (jobsData.success && jobsData.jobs) {
                            const open = jobsData.jobs.filter(j => j.status === 'open').length;
                            const active = jobsData.jobs.filter(j => j.status === 'accepted').length;
                            setUserStats({ openJobs: open, activeBookings: active });
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchUnreadCount();
            fetchDashboardData();
        }, [currentUser])
    );

    // NEW: Global Socket Listener for Real-Time Badge Updates
    useEffect(() => {
        let socket = null;
        const userId = currentUser?._id || currentUser?.id;

        if (userId) {
            const backendUrl = API_BASE_URL.replace('/api', '');
            socket = io(backendUrl);
            socket.emit('join', { userId: userId });

            socket.on('receiveMessage', (msg) => {
                // If a message arrives from the admin, increase the badge!
                if (msg.isAdmin) {
                    setUnreadCount(prev => prev + 1);
                }
            });
        }

        return () => {
            if (socket) socket.disconnect();
        };
    }, [currentUser]);



    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            await AsyncStorage.removeItem('rememberMe');
            setProfileModalVisible(false);
            navigation.replace('Login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword) {
            Alert.alert('Error', 'Please fill in both fields');
            return;
        }
        setIsSubmittingPassword(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ oldPassword, newPassword }),
            });
            const data = await response.json();
            if (response.ok) {
                Alert.alert('Success', 'Password updated successfully!');
                setIsChangingPassword(false);
                setOldPassword('');
                setNewPassword('');
            } else {
                Alert.alert('Error', data.msg || 'Failed to update password');
            }
        } catch (error) {
            Alert.alert('Error', 'Network error');
        } finally {
            setIsSubmittingPassword(false);
        }
    };

    const pickProfileImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload an image.');
            return;
        }
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5,
        });
        if (!result.canceled) {
            setEditProfileImage(result.assets[0].uri);
        }
    };

    const handleUpdateProfile = async () => {
        if (!editName.trim()) {
            Alert.alert("Error", "Name cannot be empty");
            return;
        }
        setIsSubmittingProfile(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const formData = new FormData();
            formData.append('name', editName);
            if (editProfileImage && !editProfileImage.startsWith('http')) {
                const filename = editProfileImage.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : `image/jpeg`;
                formData.append('profileImage', { uri: editProfileImage, name: filename, type });
            }
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }, body: formData,
            });
            const data = await response.json();
            if (response.ok) {
                const updatedUser = { ...currentUser, name: data.user.name, profileImage: data.user.profileImage };
                setCurrentUser(updatedUser);
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                Alert.alert('Success', 'Profile updated successfully!');
                setIsEditingProfile(false);
            } else {
                Alert.alert('Error', data.msg || 'Failed to update profile');
            }
        } catch (error) {
            Alert.alert('Error', 'Network error during upload');
        } finally {
            setIsSubmittingProfile(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>

                {/* Top Header */}
                <View className="px-5 pt-6 pb-4 flex-row justify-between items-center">
                    <View className="flex-row items-center bg-white py-2 px-4 rounded-full shadow-sm border border-gray-100">
                        <View className="bg-emerald-50 p-1.5 rounded-full mr-2">
                            <Ionicons name="location" size={16} color="#047857" />
                        </View>
                        <View>
                            <Text className="text-gray-400 text-xs font-medium uppercase">Current Location</Text>
                            <Text className="text-slate-800 text-sm font-bold">Colombo, WP</Text>
                        </View>
                    </View>

                    <View className="flex-row items-center gap-3">
                        {/* NEW: Notification Bell Icon */}
                        <TouchableOpacity
                            className="relative bg-white p-2 rounded-full shadow-sm border border-gray-100"
                            onPress={() => navigation.navigate('SupportChat')}
                        >
                            <Ionicons name="chatbox-ellipses-outline" size={20} color="#0f172a" />
                            {unreadCount > 0 && (
                                <View className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 rounded-full items-center justify-center border-[1.5px] border-white">
                                    <Text className="text-white text-[10px] font-extrabold">{unreadCount > 9 ? '9+' : unreadCount}</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="bg-white p-1 rounded-full shadow-sm border border-gray-100"
                            onPress={() => {
                                setEditName(currentUser?.name);
                                setEditProfileImage(currentUser?.profileImage);
                                setProfileModalVisible(true);
                            }}
                        >
                            <Image
                                source={{ uri: currentUser?.profileImage || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fallback' }}
                                style={{ width: 36, height: 36, borderRadius: 18 }}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Greeting */}
                <View className="px-5 mb-6">
                    <Text className="text-3xl font-extrabold text-slate-900 mb-1">Hello, {firstName} </Text>
                    <Text className="text-slate-500 mb-5 font-medium">Find elite professionals near you.</Text>

                    <View className="flex-row items-center bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100">
                        <Ionicons name="search" size={22} color="#94a3b8" />
                        <TextInput
                            placeholder="Search for a service..."
                            className="flex-1 ml-3 text-base text-slate-800"
                            placeholderTextColor="#94a3b8"
                        />
                        <TouchableOpacity className="bg-slate-900 p-2.5 rounded-2xl">
                            <Ionicons name="options" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stats Section instead of Carousel */}
                <View className="px-5 mb-8 flex-row justify-between">
                    <TouchableOpacity 
                        className="flex-1 bg-slate-900 rounded-[24px] p-5 mr-2 shadow-md shadow-slate-300"
                        onPress={() => navigation.navigate('My Posts')}
                    >
                        <View className="bg-slate-800 w-10 h-10 rounded-full items-center justify-center mb-3">
                            <Ionicons name="document-text" size={20} color="white" />
                        </View>
                        <Text className="text-white text-3xl font-extrabold">{userStats.openJobs}</Text>
                        <Text className="text-slate-300 font-medium mt-1">Open Posts</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        className="flex-1 bg-emerald-600 rounded-[24px] p-5 ml-2 shadow-md shadow-emerald-200"
                        onPress={() => navigation.navigate('My Posts')}
                    >
                        <View className="bg-emerald-500 w-10 h-10 rounded-full items-center justify-center mb-3">
                            <Ionicons name="hammer" size={20} color="white" />
                        </View>
                        <Text className="text-white text-3xl font-extrabold">{userStats.activeBookings}</Text>
                        <Text className="text-emerald-100 font-medium mt-1">Active Bookings</Text>
                    </TouchableOpacity>
                </View>

                {/* Categories */}
                <View className="px-5 mb-8">
                    <View className="flex-row justify-between items-center mb-5">
                        <Text className="text-xl font-bold text-slate-900">Expert Services</Text>
                    </View>
                    <View className="flex-row justify-between">
                        <CategoryCard icon="water-drop" title="Plumbing" bgColor="bg-sky-50" iconColor="#0284c7" />
                        <CategoryCard icon="electrical-services" title="Electrical" bgColor="bg-amber-50" iconColor="#d97706" />
                        <CategoryCard icon="cleaning-services" title="Cleaning" bgColor="bg-emerald-50" iconColor="#059669" />
                        <CategoryCard icon="handyman" title="Repairs" bgColor="bg-indigo-50" iconColor="#4f46e5" />
                    </View>
                </View>

                {/* Top Rated Workers */}
                <View className="px-5 mb-8">
                    <Text className="text-xl font-bold text-slate-900 mb-5">Top Rated Professionals</Text>
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#0f172a" />
                    ) : topWorkers.length > 0 ? (
                        topWorkers.map(worker => (
                            <TouchableOpacity 
                                key={worker._id} 
                                className="bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 flex-row items-center mb-3"
                                onPress={() => navigation.navigate('CreateJob', { preSelectedWorker: worker._id })}
                            >
                                <View className="w-14 h-14 bg-slate-100 rounded-full overflow-hidden border border-gray-200">
                                    <Image source={{ uri: worker.profileImage || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fallback' }} className="w-full h-full" />
                                </View>
                                <View className="flex-1 ml-4">
                                    <View className="flex-row justify-between items-center mb-1">
                                        <Text className="text-base font-bold text-slate-900">{worker.name}</Text>
                                        <View className="flex-row items-center bg-amber-50 px-2 py-1 rounded-lg">
                                            <Ionicons name="star" size={12} color="#d97706" /><Text className="text-amber-700 font-bold ml-1 text-[10px]">Top</Text>
                                        </View>
                                    </View>
                                    <Text className="text-slate-500 text-xs" numberOfLines={1}>{worker.bio || 'Verified Professional'}</Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text className="text-slate-500">No professionals found nearby.</Text>
                    )}
                </View>

                <View className="h-20" />
            </ScrollView>

            {/* FAB */}
            <TouchableOpacity
                style={{ position: 'absolute', bottom: 25, right: 25 }}
                className="bg-slate-900 w-16 h-16 rounded-full items-center justify-center shadow-lg border-[3px] border-white"
                onPress={() => {
                    if (currentUser?._id || currentUser?.id) {
                        navigation.navigate('CreateJob', { userId: currentUser._id || currentUser.id });
                    } else {
                        Alert.alert("Error", "User session not found. Please log in again.");
                    }
                }}
            >
                <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>

            {/* Profile Slide-up Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={isProfileModalVisible}
                onRequestClose={() => {
                    setProfileModalVisible(false);
                    setIsChangingPassword(false);
                    setIsEditingProfile(false);
                }}
            >
                <TouchableOpacity
                    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
                    activeOpacity={1}
                    onPress={() => {
                        setProfileModalVisible(false);
                        setIsChangingPassword(false);
                        setIsEditingProfile(false);
                    }}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        style={{ backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 }}
                    >
                        <View style={{ width: 40, height: 5, backgroundColor: '#e2e8f0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 }} />

                        {isEditingProfile ? (
                            <>
                                {/* ... Edit Profile Modal Content (Unchanged) ... */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                                    <TouchableOpacity onPress={() => setIsEditingProfile(false)} style={{ marginRight: 16 }}>
                                        <Ionicons name="arrow-back" size={24} color="#0f172a" />
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a' }}>Edit Profile</Text>
                                </View>

                                <View style={{ alignItems: 'center', marginBottom: 24 }}>
                                    <TouchableOpacity onPress={pickProfileImage} style={{ position: 'relative' }}>
                                        <Image
                                            source={{ uri: editProfileImage || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fallback' }}
                                            style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#f1f5f9' }}
                                        />
                                        <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: '#0f172a', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: 'white' }}>
                                            <Ionicons name="camera" size={16} color="white" />
                                        </View>
                                    </TouchableOpacity>
                                </View>

                                <Text style={{ fontWeight: '700', color: '#475569', marginBottom: 8, marginLeft: 4 }}>Full Name</Text>
                                <TextInput
                                    style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 15 }}
                                    placeholder="Your Name"
                                    value={editName}
                                    onChangeText={setEditName}
                                />

                                <TouchableOpacity
                                    style={{ backgroundColor: '#0f172a', borderRadius: 20, padding: 18, alignItems: 'center', opacity: isSubmittingProfile ? 0.7 : 1 }}
                                    onPress={handleUpdateProfile}
                                    disabled={isSubmittingProfile}
                                >
                                    {isSubmittingProfile ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Save Changes</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : isChangingPassword ? (
                            <>
                                {/* ... Change Password Modal Content (Unchanged) ... */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                                    <TouchableOpacity onPress={() => setIsChangingPassword(false)} style={{ marginRight: 16 }}>
                                        <Ionicons name="arrow-back" size={24} color="#0f172a" />
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a' }}>Change Password</Text>
                                </View>

                                <TextInput
                                    style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 15 }}
                                    placeholder="Current Password"
                                    secureTextEntry
                                    value={oldPassword}
                                    onChangeText={setOldPassword}
                                />
                                <TextInput
                                    style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 15 }}
                                    placeholder="New Password"
                                    secureTextEntry
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                />

                                <TouchableOpacity
                                    style={{ backgroundColor: '#0f172a', borderRadius: 20, padding: 18, alignItems: 'center', opacity: isSubmittingPassword ? 0.7 : 1 }}
                                    onPress={handleChangePassword}
                                    disabled={isSubmittingPassword}
                                >
                                    {isSubmittingPassword ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Update Password</Text>
                                    )}
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 24 }}>Account Settings</Text>

                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 12 }}
                                    onPress={() => {
                                        setProfileModalVisible(false);
                                        navigation.navigate('SupportChat');
                                    }}
                                >
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#bfdbfe', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                        <Ionicons name="chatbubbles" size={20} color="#3b82f6" />
                                    </View>
                                    <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#1e293b' }}>Contact Admins (Support)</Text>

                                    {/* Modal Unread Badge */}
                                    {unreadCount > 0 && (
                                        <View className="bg-red-500 px-2 py-0.5 rounded-full mr-2">
                                            <Text className="text-white text-xs font-bold">{unreadCount}</Text>
                                        </View>
                                    )}
                                    <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
                                    onPress={() => setIsEditingProfile(true)}
                                >
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                        <Ionicons name="person-outline" size={20} color="#0f172a" />
                                    </View>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 }}>Edit Profile</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
                                    onPress={() => setIsChangingPassword(true)}
                                >
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                        <Ionicons name="lock-closed-outline" size={20} color="#0f172a" />
                                    </View>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 }}>Change Password</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16 }}
                                    onPress={handleLogout}
                                >
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                                    </View>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#ef4444', flex: 1 }}>Sign Out</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const CategoryCard = ({ icon, title, bgColor, iconColor }) => (
    <TouchableOpacity className="items-center">
        <View className={`w-16 h-16 ${bgColor} rounded-[24px] items-center justify-center mb-3 shadow-sm`}>
            <MaterialIcons name={icon} size={28} color={iconColor} />
        </View>
        <Text className="text-slate-700 text-xs font-bold">{title}</Text>
    </TouchableOpacity>
);
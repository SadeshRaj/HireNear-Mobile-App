import React, { useState, useEffect } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    Image, ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, Platform, Modal, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../../config';

const { width } = Dimensions.get('window');

export default function WorkerPortfolioScreen({ route, navigation }) {
    // Check if a workerId was passed via navigation
    const workerId = route.params?.workerId;
    const isOwnProfile = !workerId;

    const [user, setUser] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    // Lightbox / Image Set Viewer States
    const [selectedItem, setSelectedItem] = useState(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    // Profile Edit States
    const [isProfileModalVisible, setProfileModalVisible] = useState(false);
    const [editBio, setEditBio] = useState('');
    const [editStatus, setEditStatus] = useState('Available');

    // Portfolio Form States
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [images, setImages] = useState([]);

    // Map & Location States
    const [isMapVisible, setIsMapVisible] = useState(false);
    const [mapRegion, setMapRegion] = useState(null);
    const [tempPinLocation, setTempPinLocation] = useState(null);
    const [finalAddress, setFinalAddress] = useState('');
    const [finalCoords, setFinalCoords] = useState(null);

    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
    };

    useEffect(() => {
        loadData();
    }, [workerId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = await AsyncStorage.getItem('token');

            // 1. Fetch Profile Data
            if (workerId) {
                // Fetch specific worker profile from API
                const response = await fetch(`${API_BASE_URL}/auth/worker/${workerId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (response.ok) setUser(data);
            } else {
                // Fetch logged in user from local storage
                const userJson = await AsyncStorage.getItem('user');
                if (userJson) {
                    const parsedUser = JSON.parse(userJson);
                    setUser({
                        ...parsedUser,
                        bio: parsedUser.bio || "No bio added yet.",
                        status: parsedUser.status || "Available",
                        profileImage: parsedUser.profileImage || "https://api.dicebear.com/7.x/avataaars/svg?seed=Fallback"
                    });
                }
            }

            // 2. Fetch Portfolio Items
            const portfolioUrl = workerId ? `${API_BASE_URL}/portfolio/${workerId}` : `${API_BASE_URL}/portfolio`;
            const response = await fetch(portfolioUrl, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) setItems(data);

        } catch (error) {
            console.error(error);
            showToast('Network error', 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Profile Management ---
    const handleUpdateProfile = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/auth/profile`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ bio: editBio, status: editStatus })
            });
            if (response.ok) {
                const updatedUser = { ...user, bio: editBio, status: editStatus };
                setUser(updatedUser);
                await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
                setProfileModalVisible(false);
                showToast('Profile updated!', 'success');
            }
        } catch (error) {
            showToast('Failed to update profile', 'error');
        }
    };

    // --- Portfolio Management ---
    const openAddForm = () => {
        setEditingItemId(null);
        setTitle(''); setDescription(''); setFinalAddress(''); setFinalCoords(null); setImages([]);
        setIsFormVisible(true);
    };

    const pickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') return showToast('Camera roll permissions required!', 'error');

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            selectionLimit: 5,
            quality: 0.7,
        });

        if (!result.canceled) setImages([...images, ...result.assets].slice(0, 5));
    };

    const handleUpload = async () => {
        if (!title || !description) return showToast('Title and description are required', 'error');
        if (images.length === 0 && !editingItemId) return showToast('Please add at least one image', 'error');

        setUploading(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('address', finalAddress);

            if (finalCoords) {
                formData.append('lat', String(finalCoords.latitude));
                formData.append('lng', String(finalCoords.longitude));
            }

            images.forEach((img) => {
                const filename = img.uri.split('/').pop();
                const match = /\.(\w+)$/.exec(filename);
                formData.append('images', { uri: img.uri, name: filename, type: match ? `image/${match[1]}` : `image` });
            });

            const url = editingItemId ? `${API_BASE_URL}/portfolio/${editingItemId}` : `${API_BASE_URL}/portfolio`;
            const method = editingItemId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
                body: formData
            });

            if (response.ok) {
                showToast(editingItemId ? 'Project updated!' : 'Project added!', 'success');
                setIsFormVisible(false);
                loadData(); // Re-fetch data
            } else {
                showToast('Upload failed', 'error');
            }
        } catch (error) {
            showToast('Network error during upload', 'error');
        } finally {
            setUploading(false);
        }
    };

    // --- Map Handlers ---
    const openMapModal = async () => {
        setIsMapVisible(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            const pos = await Location.getCurrentPositionAsync({});
            const currentLoc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            setMapRegion({ ...currentLoc, latitudeDelta: 0.05, longitudeDelta: 0.05 });
            setTempPinLocation(currentLoc);
        } else {
            const colombo = { latitude: 6.9271, longitude: 79.8612 };
            setMapRegion({ ...colombo, latitudeDelta: 0.1, longitudeDelta: 0.1 });
            setTempPinLocation(colombo);
        }
    };

    const confirmLocation = async () => {
        setFinalCoords(tempPinLocation);
        setIsMapVisible(false);
        try {
            const geo = await Location.reverseGeocodeAsync(tempPinLocation);
            if (geo.length > 0) {
                const place = geo[0];
                const addressStr = `${place.street || ''} ${place.city || place.district || ''}, ${place.country || ''}`.trim();
                setFinalAddress(addressStr);
            }
        } catch (error) {
            setFinalAddress('Custom Location Selected');
        }
    };

    // --- UI Components ---
    const getStatusColor = (status) => {
        if (status === 'Available') return '#10b981';
        if (status === 'Working') return '#f59e0b';
        return '#94a3b8';
    };

    const renderGridItem = ({ item }) => {
        const coverImage = item.images && item.images.length > 0 ? item.images[0] : 'https://placehold.co/400x400/e2e8f0/64748b?text=No+Image';

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => { setSelectedItem(item); setActiveImageIndex(0); }}
                style={{ flex: 1, aspectRatio: 1, margin: 6, borderRadius: 16, overflow: 'hidden', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#f1f5f9' }}
            >
                <Image source={{ uri: coverImage }} style={{ width: '100%', height: '100%' }} />
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 10, paddingTop: 20, backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <Text style={{ color: 'white', fontSize: 13, fontWeight: '700' }} numberOfLines={1}>{item.title}</Text>
                </View>
                {item.images && item.images.length > 1 && (
                    <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', padding: 4, borderRadius: 8 }}>
                        <Ionicons name="images" size={14} color="white" />
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FB' }}>
            {toast.visible && (
                <View style={{ position: 'absolute', top: 50, left: 20, right: 20, zIndex: 100, backgroundColor: toast.type === 'error' ? '#fef2f2' : '#ecfdf5', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.1, elevation: 5 }}>
                    <Ionicons name={toast.type === 'error' ? "warning" : "checkmark-circle"} size={24} color={toast.type === 'error' ? '#ef4444' : '#10b981'} />
                    <Text style={{ marginLeft: 12, color: toast.type === 'error' ? '#b91c1c' : '#047857', fontWeight: '700' }}>{toast.message}</Text>
                </View>
            )}

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#0f172a" /></View>
            ) : isFormVisible ? (
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={{ padding: 20 }}>
                        <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 20 }}>{editingItemId ? 'Edit Project' : 'Add Project'}</Text>

                        <TextInput style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' }} placeholder="Project Title" value={title} onChangeText={setTitle} />
                        <TextInput style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', height: 100, textAlignVertical: 'top' }} placeholder="Description..." multiline value={description} onChangeText={setDescription} />

                        <TouchableOpacity
                            onPress={openMapModal}
                            style={{ backgroundColor: 'white', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', alignItems: 'center' }}
                        >
                            <Ionicons name="location" size={20} color={finalCoords ? "#10b981" : "#64748b"} />
                            <Text style={{ marginLeft: 10, color: finalAddress ? '#0f172a' : '#94a3b8', flex: 1, fontWeight: finalAddress ? '600' : '400' }} numberOfLines={1}>
                                {finalAddress || 'Pin location on Map (Optional)'}
                            </Text>
                            <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                        </TouchableOpacity>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
                            <TouchableOpacity onPress={pickImages} style={{ width: 100, height: 100, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#cbd5e1', marginRight: 12 }}>
                                <Ionicons name="camera-outline" size={28} color="#64748b" />
                                <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Upload</Text>
                            </TouchableOpacity>
                            {images.map((img, index) => (
                                <Image key={index} source={{ uri: img.uri }} style={{ width: 100, height: 100, borderRadius: 16, marginRight: 12 }} />
                            ))}
                        </ScrollView>

                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity style={{ flex: 1, padding: 18, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center' }} onPress={() => setIsFormVisible(false)}>
                                <Text style={{ color: '#475569', fontWeight: '700' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ flex: 2, padding: 18, borderRadius: 20, backgroundColor: '#0f172a', alignItems: 'center' }} onPress={handleUpload} disabled={uploading}>
                                {uploading ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontWeight: '700' }}>Save</Text>}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            ) : (
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 }}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' }}>
                            <Ionicons name="arrow-back" size={20} color="#0f172a" />
                        </TouchableOpacity>
                    </View>

                    <FlatList
                        data={items}
                        keyExtractor={item => item._id}
                        numColumns={2}
                        contentContainerStyle={{ paddingHorizontal: 14, paddingBottom: 100 }}
                        showsVerticalScrollIndicator={false}
                        ListHeaderComponent={
                            <View style={{ alignItems: 'center', paddingBottom: 30, borderBottomWidth: 1, borderColor: '#e2e8f0', marginBottom: 20, marginHorizontal: 6 }}>
                                <View style={{ position: 'relative' }}>
                                    <Image source={{ uri: user?.profileImage }} style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: 'white', backgroundColor: '#f1f5f9' }} />
                                    <View style={{ position: 'absolute', bottom: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: getStatusColor(user?.status), borderWidth: 3, borderColor: 'white' }} />
                                </View>

                                <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a', marginTop: 12 }}>{user?.name}</Text>

                                <View style={{ backgroundColor: '#f8fafc', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginTop: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: getStatusColor(user?.status) }}>{user?.status}</Text>
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16 }}>
                                    <Text style={{ color: '#475569', fontSize: 14, textAlign: 'center', fontStyle: 'italic' }}>"{user?.bio}"</Text>
                                    {isOwnProfile && (
                                        <TouchableOpacity onPress={() => { setEditBio(user?.bio); setEditStatus(user?.status); setProfileModalVisible(true); }} style={{ marginLeft: 8 }}>
                                            <Ionicons name="pencil" size={20} color="#64748b" style={{ padding: 4, backgroundColor: '#f1f5f9', borderRadius: 12 }} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        }
                        renderItem={renderGridItem}
                        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: '#94a3b8' }}>No portfolio projects yet.</Text>}
                    />

                    {isOwnProfile && (
                        <TouchableOpacity
                            style={{ position: 'absolute', bottom: 30, right: 20, backgroundColor: '#0f172a', width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 }}
                            onPress={openAddForm}
                        >
                            <Ionicons name="add" size={32} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Lightbox / Image Viewer */}
            <Modal visible={!!selectedItem} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'black' }}>
                    <SafeAreaView>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 }}>
                            <TouchableOpacity onPress={() => setSelectedItem(null)} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 }}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                            {isOwnProfile && (
                                <TouchableOpacity onPress={() => {
                                    const idToDelete = selectedItem._id;
                                    setSelectedItem(null);
                                    Alert.alert("Delete", "Remove this project?", [
                                        { text: "Cancel", style: "cancel" },
                                        { text: "Delete", style: "destructive", onPress: async () => {
                                                const token = await AsyncStorage.getItem('token');
                                                await fetch(`${API_BASE_URL}/portfolio/${idToDelete}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                                                setItems(items.filter(i => i._id !== idToDelete));
                                            }}
                                    ]);
                                }} style={{ padding: 8 }}>
                                    <Ionicons name="trash-outline" size={24} color="#ef4444" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </SafeAreaView>

                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        {selectedItem?.images && (
                            <ScrollView
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                onMomentumScrollEnd={(e) => {
                                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                                    setActiveImageIndex(index);
                                }}
                            >
                                {selectedItem.images.map((imgUrl, index) => (
                                    <View key={index} style={{ width, justifyContent: 'center', alignItems: 'center' }}>
                                        <Image source={{ uri: imgUrl }} style={{ width: '100%', height: width }} resizeMode="cover" />
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                        {selectedItem?.images?.length > 1 && (
                            <View style={{ position: 'absolute', top: 20, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 }}>
                                <Text style={{ color: 'white', fontWeight: '700', fontSize: 12 }}>
                                    {activeImageIndex + 1} / {selectedItem.images.length}
                                </Text>
                            </View>
                        )}
                    </View>

                    <SafeAreaView edges={['bottom']}>
                        <View style={{ padding: 20, backgroundColor: 'rgba(0,0,0,0.8)' }}>
                            <Text style={{ color: 'white', fontSize: 18, fontWeight: '800', marginBottom: 8 }}>{selectedItem?.title}</Text>
                            {selectedItem?.location?.address && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                    <Ionicons name="location" size={14} color="#94a3b8" />
                                    <Text style={{ color: '#94a3b8', fontSize: 13, marginLeft: 4 }}>{selectedItem.location.address}</Text>
                                </View>
                            )}
                            <Text style={{ color: '#cbd5e1', fontSize: 14, lineHeight: 22 }}>{selectedItem?.description}</Text>
                        </View>
                    </SafeAreaView>
                </View>
            </Modal>

            {/* Map Modal */}
            <Modal visible={isMapVisible} animationType="slide">
                <View style={{ flex: 1 }}>
                    <View style={{ position: 'absolute', top: 50, left: 20, zIndex: 10, right: 20, flexDirection: 'row', justifyContent: 'space-between' }}>
                        <TouchableOpacity onPress={() => setIsMapVisible(false)} style={{ backgroundColor: 'white', padding: 12, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: {width:0, height:2} }}>
                            <Ionicons name="close" size={24} color="#0f172a" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={confirmLocation} style={{ backgroundColor: '#0f172a', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: {width:0, height:2} }}>
                            <Text style={{ color: 'white', fontWeight: '700' }}>Confirm Location</Text>
                        </TouchableOpacity>
                    </View>
                    {mapRegion && (
                        <MapView style={{ flex: 1 }} initialRegion={mapRegion} onPress={(e) => setTempPinLocation(e.nativeEvent.coordinate)}>
                            {tempPinLocation && <Marker draggable coordinate={tempPinLocation} onDragEnd={(e) => setTempPinLocation(e.nativeEvent.coordinate)} />}
                        </MapView>
                    )}
                </View>
            </Modal>

            {/* Profile Edit Modal */}
            <Modal visible={isProfileModalVisible} transparent animationType="slide">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: 'white', padding: 24, borderTopLeftRadius: 32, borderTopRightRadius: 32 }}>
                        <Text style={{ fontSize: 20, fontWeight: '800', marginBottom: 20 }}>Edit Profile</Text>
                        <Text style={{ fontWeight: '700', color: '#475569', marginBottom: 8 }}>Current Status</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
                            {['Available', 'Working', 'Offline'].map(status => (
                                <TouchableOpacity key={status} onPress={() => setEditStatus(status)} style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: editStatus === status ? '#0f172a' : '#f1f5f9' }}>
                                    <Text style={{ color: editStatus === status ? 'white' : '#64748b', fontWeight: '600' }}>{status}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={{ fontWeight: '700', color: '#475569', marginBottom: 8 }}>About Me</Text>
                        <TextInput style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, height: 100, textAlignVertical: 'top', marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0' }} multiline value={editBio} onChangeText={setEditBio} />
                        <View style={{ flexDirection: 'row', gap: 12 }}>
                            <TouchableOpacity style={{ flex: 1, padding: 16, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center' }} onPress={() => setProfileModalVisible(false)}>
                                <Text style={{ fontWeight: '700', color: '#475569' }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={{ flex: 2, padding: 16, borderRadius: 20, backgroundColor: '#0f172a', alignItems: 'center' }} onPress={handleUpdateProfile}>
                                <Text style={{ fontWeight: '700', color: 'white' }}>Save Changes</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
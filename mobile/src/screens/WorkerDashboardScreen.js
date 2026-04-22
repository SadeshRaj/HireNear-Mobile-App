import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, ScrollView, Modal, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { API_BASE_URL } from '../../config';

const CATEGORIES = ['All', 'Plumbing', 'Electrical', 'Cleaning', 'Repairs', 'Carpentry', 'Painting', 'Other'];

const CAT_STYLE = {
    Plumbing:   { icon: 'water-drop',         color: '#0284c7', bg: '#f0f9ff' },
    Electrical: { icon: 'electrical-services', color: '#d97706', bg: '#fffbeb' },
    Cleaning:   { icon: 'cleaning-services',   color: '#059669', bg: '#ecfdf5' },
    Repairs:    { icon: 'handyman',            color: '#4f46e5', bg: '#eef2ff' },
    Carpentry:  { icon: 'carpenter',           color: '#92400e', bg: '#fef3c7' },
    Painting:   { icon: 'format-paint',        color: '#db2777', bg: '#fdf2f8' },
    Other:      { icon: 'more-horiz',          color: '#64748b', bg: '#f8fafc' },
};

const getCatStyle = (cat) => CAT_STYLE[cat] || CAT_STYLE.Other;
const formatBudget = (b) => b !== undefined ? `LKR ${Number(b).toLocaleString()}` : '–';
const formatDeadline = (d) => {
    if (!d) return '–';
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Haversine distance (km) between two lat/lng points
const calcDistanceKm = (lat1, lng1, lat2, lng2) => {
    const toRad = v => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function WorkerDashboardScreen({ navigation }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const [activeDistance, setActiveDistance] = useState(20);
    const [activeBudget, setActiveBudget] = useState('All');
    const [workerName, setWorkerName] = useState('there');
    const [workerLocation, setWorkerLocation] = useState(null);

    // Custom Toast State
    const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

    // Modal & Profile States
    const [isProfileModalVisible, setProfileModalVisible] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

    const showToast = (message, type = 'success') => {
        setToast({ visible: true, message, type });
        setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
    };

    useEffect(() => {
        AsyncStorage.getItem('user').then(raw => {
            if (raw) {
                const u = JSON.parse(raw);
                setWorkerName(u.name ? u.name.split(' ')[0] : 'there');
            }
        });

        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const pos = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    });
                    setWorkerLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                }
            } catch { /* location is optional */ }
        })();
    }, []);

    const fetchJobs = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            let url;

            let params = [];
            if (activeCategory !== 'All') params.push(`category=${activeCategory}`);
            if (activeBudget === 'Under 5k') params.push(`maxBudget=5000`);
            else if (activeBudget === '5k - 15k') { params.push(`minBudget=5000`); params.push(`maxBudget=15000`); }
            else if (activeBudget === '15k+') params.push(`minBudget=15000`);

            const queryString = params.length > 0 ? params.join('&') : '';

            if (workerLocation && activeDistance !== 'All') {
                url = `${API_BASE_URL}/jobs/nearby?lat=${workerLocation.lat}&lng=${workerLocation.lng}&maxDistanceKm=${activeDistance}`;
                if (queryString) url += `&${queryString}`;
            } else {
                url = `${API_BASE_URL}/jobs`; // Uses getOpenJobs logic which returns all jobs
                if (queryString) url += `?${queryString}`;
            }

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();

            if (Array.isArray(data)) {
                setJobs(data);
            } else {
                showToast(data.msg || 'Failed to load jobs.', 'error');
            }
        } catch {
            showToast('Network error. Make sure the server is running.', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [workerLocation, activeCategory, activeDistance, activeBudget]);

    useEffect(() => {
        setLoading(true);
        fetchJobs();
    }, [fetchJobs]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchJobs();
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('user');
            setProfileModalVisible(false);
            navigation.replace('Login');
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const handleChangePassword = async () => {
        if (!oldPassword || !newPassword) {
            showToast('Please fill in both fields', 'error');
            return;
        }

        setIsSubmittingPassword(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Password updated successfully!', 'success');
                setIsChangingPassword(false);
                setOldPassword('');
                setNewPassword('');
            } else {
                showToast(data.msg || 'Failed to update password', 'error');
            }
        } catch (error) {
            showToast('Network error', 'error');
        } finally {
            setIsSubmittingPassword(false);
        }
    };

    const renderJob = ({ item }) => {
        const cat = getCatStyle(item.category);

        // Calculate distance from worker's current location to job
        let distKm = null;
        if (workerLocation && item.location?.coordinates?.length === 2) {
            const [jobLng, jobLat] = item.location.coordinates;
            const d = calcDistanceKm(workerLocation.lat, workerLocation.lng, jobLat, jobLng);
            distKm = isNaN(d) ? null : Math.round(d * 10) / 10;
        }
        const isNearby = distKm !== null && distKm < 5;

        const distLabel = distKm === null ? null
            : distKm < 1 ? `${Math.round(distKm * 1000)} m`
            : `${distKm.toFixed(1)} km`;

        return (
            <View style={{
                backgroundColor: 'white', borderRadius: 28, padding: 20, marginBottom: 16,
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
                borderWidth: isNearby ? 1.5 : 1,
                borderColor: isNearby ? '#bbf7d0' : '#f1f5f9',
            }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: cat.bg, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                            <MaterialIcons name={cat.icon} size={22} color={cat.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15, lineHeight: 20 }} numberOfLines={1}>{item.title}</Text>
                            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', marginTop: 2 }}>{item.category}</Text>
                        </View>
                    </View>
                    {/* Distance badge */}
                    {distLabel && (
                        <View style={{
                            backgroundColor: isNearby ? '#ecfdf5' : '#f8fafc',
                            paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, marginLeft: 8,
                        }}>
                            <Text style={{ fontSize: 12, fontWeight: '700', color: isNearby ? '#047857' : '#64748b' }}>
                                {isNearby ? '🔥' : '📍'} {distLabel}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                        <Ionicons name="cash-outline" size={14} color="#059669" />
                        <Text style={{ color: '#047857', fontWeight: '700', fontSize: 13, marginLeft: 5 }}>{formatBudget(item.budget)}</Text>
                    </View>
                </View>

                {!!item.description && (
                    <Text style={{ color: '#64748b', fontSize: 13, lineHeight: 19, marginBottom: 14 }} numberOfLines={2}>{item.description}</Text>
                )}

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    {isNearby ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6 }}>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#047857' }}>🔥 Nearby – High Priority</Text>
                        </View>
                    ) : <View />}
                    <TouchableOpacity
                        style={{ backgroundColor: '#0f172a', borderRadius: 16, paddingHorizontal: 20, paddingVertical: 10 }}
                        onPress={() => navigation.navigate('SubmitBid', { job: item })}
                    >
                        <Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>Place Bid →</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FB' }}>
            {/* Custom Disappearing Toast */}
            {toast.visible && (
                <View style={{
                    position: 'absolute', top: 50, left: 20, right: 20, zIndex: 100,
                    backgroundColor: toast.type === 'error' ? '#fef2f2' : '#ecfdf5',
                    borderWidth: 1, borderColor: toast.type === 'error' ? '#f87171' : '#34d399',
                    padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12,
                }}>
                    <Ionicons name={toast.type === 'error' ? "warning" : "checkmark-circle"} size={24} color={toast.type === 'error' ? '#ef4444' : '#10b981'} />
                    <Text style={{ marginLeft: 12, color: toast.type === 'error' ? '#b91c1c' : '#047857', fontWeight: '700', fontSize: 14 }}>
                        {toast.message}
                    </Text>
                </View>
            )}

            <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                    <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600' }}>Welcome back</Text>
                    <Text style={{ color: '#0f172a', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>
                        Hi, {workerName} 👋
                    </Text>
                </View>
                <TouchableOpacity
                    style={{
                        backgroundColor: '#e2e8f0', width: 45, height: 45, borderRadius: 50,
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: 2, borderColor: 'white', shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, elevation: 2
                    }}
                    onPress={() => setProfileModalVisible(true)}
                >
                    <Ionicons name="person" size={20} color="#64748b" />
                </TouchableOpacity>
            </View>

            <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
                <View style={{
                    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', borderRadius: 16,
                    paddingHorizontal: 16, paddingVertical: 11, borderWidth: 1, borderColor: '#f1f5f9',
                }}>
                    <Ionicons name="location" size={16} color={workerLocation && activeDistance !== 'All' ? '#047857' : '#94a3b8'} />
                    <Text style={{ marginLeft: 8, fontSize: 13, fontWeight: '600', color: workerLocation && activeDistance !== 'All' ? '#047857' : '#94a3b8' }}>
                        {workerLocation && activeDistance !== 'All' ? `🔥 Showing jobs near you (within ${activeDistance} km)` : 'Showing all open jobs'}
                    </Text>
                </View>
            </View>

            {workerLocation && (
                <View style={{ paddingHorizontal: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '800', marginRight: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Radius</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingRight: 20 }}>
                        {[5, 10, 20, 'All'].map(dist => {
                            const label = dist === 'All' ? 'Anywhere' : `${dist} km`;
                            const isActive = activeDistance === dist;
                            return (
                                <TouchableOpacity
                                    key={dist.toString()}
                                    onPress={() => setActiveDistance(dist)}
                                    style={{
                                        marginRight: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
                                        backgroundColor: isActive ? '#059669' : '#f8fafc',
                                        borderWidth: 1, borderColor: isActive ? '#059669' : '#e2e8f0'
                                    }}
                                >
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? 'white' : '#64748b' }}>
                                        {label}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })}
                    </ScrollView>
                </View>
            )}

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, marginBottom: 12 }} contentContainerStyle={{ paddingHorizontal: 20 }}>
                {CATEGORIES.map(cat => (
                    <TouchableOpacity
                        key={cat} onPress={() => setActiveCategory(cat)}
                        style={{
                            marginRight: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
                            backgroundColor: activeCategory === cat ? '#0f172a' : 'white',
                            borderWidth: 1, borderColor: activeCategory === cat ? '#0f172a' : '#e2e8f0',
                        }}
                    >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: activeCategory === cat ? 'white' : '#64748b' }}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <View style={{ paddingHorizontal: 20, marginBottom: 16, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '800', marginRight: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Budget</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingRight: 20 }}>
                    {['All', 'Under 5k', '5k - 15k', '15k+'].map(budget => {
                        const isActive = activeBudget === budget;
                        return (
                            <TouchableOpacity
                                key={budget}
                                onPress={() => setActiveBudget(budget)}
                                style={{
                                    marginRight: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
                                    backgroundColor: isActive ? '#059669' : '#f8fafc',
                                    borderWidth: 1, borderColor: isActive ? '#059669' : '#e2e8f0'
                                }}
                            >
                                <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? 'white' : '#64748b' }}>
                                    {budget}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </ScrollView>
            </View>

            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#0f172a" />
                </View>
            ) : (
                <FlatList
                    data={jobs}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
                    showsVerticalScrollIndicator={false}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0f172a" />}
                    renderItem={renderJob}
                />
            )}

            <Modal animationType="slide" transparent={true} visible={isProfileModalVisible} onRequestClose={() => { setProfileModalVisible(false); setIsChangingPassword(false); }}>
                <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }} activeOpacity={1} onPress={() => { setProfileModalVisible(false); setIsChangingPassword(false); }}>
                    <TouchableOpacity activeOpacity={1} style={{ backgroundColor: 'white', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 }}>
                        <View style={{ width: 40, height: 5, backgroundColor: '#e2e8f0', borderRadius: 10, alignSelf: 'center', marginBottom: 20 }} />

                        {!isChangingPassword ? (
                            <>
                                <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 24 }}>Account Settings</Text>

                                {/* Portfolio Navigation Button */}
                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}
                                    onPress={() => {
                                        setProfileModalVisible(false);
                                        navigation.navigate('WorkerPortfolio');
                                    }}
                                >
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                        <Ionicons name="briefcase-outline" size={20} color="#3b82f6" />
                                    </View>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 }}>Manage Portfolio</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                                </TouchableOpacity>

                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }} onPress={() => setIsChangingPassword(true)}>
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                        <Ionicons name="lock-closed-outline" size={20} color="#0f172a" />
                                    </View>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 }}>Change Password</Text>
                                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                                </TouchableOpacity>

                                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16 }} onPress={handleLogout}>
                                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                                    </View>
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#ef4444', flex: 1 }}>Sign Out</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                                    <TouchableOpacity onPress={() => setIsChangingPassword(false)} style={{ marginRight: 16 }}>
                                        <Ionicons name="arrow-back" size={24} color="#0f172a" />
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a' }}>Change Password</Text>
                                </View>
                                <TextInput style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 15 }} placeholder="Current Password" secureTextEntry value={oldPassword} onChangeText={setOldPassword} />
                                <TextInput style={{ backgroundColor: '#f8fafc', borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#e2e8f0', fontSize: 15 }} placeholder="New Password" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
                                <TouchableOpacity style={{ backgroundColor: '#0f172a', borderRadius: 20, padding: 18, alignItems: 'center', opacity: isSubmittingPassword ? 0.7 : 1 }} onPress={handleChangePassword} disabled={isSubmittingPassword}>
                                    {isSubmittingPassword ? <ActivityIndicator color="white" /> : <Text style={{ color: 'white', fontSize: 16, fontWeight: '700' }}>Update Password</Text>}
                                </TouchableOpacity>
                            </>
                        )}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}
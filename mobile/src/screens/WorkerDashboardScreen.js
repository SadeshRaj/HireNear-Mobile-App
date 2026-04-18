import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, FlatList, TouchableOpacity,
    ActivityIndicator, RefreshControl, ScrollView
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

const formatBudget = (b) =>
    b !== undefined ? `LKR ${Number(b).toLocaleString()}` : '–';

const formatDeadline = (d) => {
    if (!d) return '–';
    return new Date(d).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric',
    });
};

export default function WorkerDashboardScreen({ navigation }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeCategory, setActiveCategory] = useState('All');
    const [workerName, setWorkerName] = useState('there');
    const [workerLocation, setWorkerLocation] = useState(null);
    const [error, setError] = useState('');

    // Load worker name + get GPS location on mount
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
                    setWorkerLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                    });
                }
            } catch { /* location is optional */ }
        })();
    }, []);

    const fetchJobs = useCallback(async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            let url;

            if (workerLocation) {
                // Nearby jobs within 15 km
                url = `${API_BASE_URL}/jobs/nearby?lat=${workerLocation.lat}&lng=${workerLocation.lng}&maxDistanceKm=15`;
                if (activeCategory !== 'All') url += `&category=${activeCategory}`;
            } else {
                // Fallback: all open jobs
                url = `${API_BASE_URL}/jobs`;
                if (activeCategory !== 'All') url += `?category=${activeCategory}`;
            }

            const response = await fetch(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();

            if (Array.isArray(data)) {
                setJobs(data);
                setError('');
            } else {
                setError(data.msg || 'Failed to load jobs.');
            }
        } catch {
            setError('Network error. Make sure the server is running.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [workerLocation, activeCategory]);

    useEffect(() => {
        setLoading(true);
        fetchJobs();
    }, [fetchJobs]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchJobs();
    };

    const renderJob = ({ item }) => {
        const cat = getCatStyle(item.category);
        const isNearby = !!workerLocation; // All jobs from nearby endpoint are nearby

        return (
            <View style={{
                backgroundColor: 'white',
                borderRadius: 28,
                padding: 20,
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3,
                borderWidth: 1,
                borderColor: '#f1f5f9',
            }}>
                {/* Title row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={{
                            width: 48, height: 48, borderRadius: 16,
                            backgroundColor: cat.bg,
                            alignItems: 'center', justifyContent: 'center', marginRight: 12
                        }}>
                            <MaterialIcons name={cat.icon} size={22} color={cat.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ color: '#0f172a', fontWeight: '800', fontSize: 15, lineHeight: 20 }} numberOfLines={1}>
                                {item.title}
                            </Text>
                            <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                                {item.category}
                            </Text>
                        </View>
                    </View>

                    {isNearby && (
                        <View style={{
                            flexDirection: 'row', alignItems: 'center',
                            backgroundColor: '#fff7ed', paddingHorizontal: 10, paddingVertical: 6,
                            borderRadius: 20, borderWidth: 1, borderColor: '#fed7aa', marginLeft: 8
                        }}>
                            <Text style={{ fontSize: 11 }}>🔥</Text>
                            <Text style={{ color: '#ea580c', fontWeight: '800', fontSize: 11, marginLeft: 3 }}>Nearby</Text>
                        </View>
                    )}
                </View>

                {/* Budget & Deadline chips */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    <View style={{
                        flexDirection: 'row', alignItems: 'center',
                        backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12
                    }}>
                        <Ionicons name="cash-outline" size={14} color="#059669" />
                        <Text style={{ color: '#047857', fontWeight: '700', fontSize: 13, marginLeft: 5 }}>
                            {formatBudget(item.budget)}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
                        <Text style={{ color: '#64748b', fontSize: 12, fontWeight: '600', marginLeft: 4 }}>
                            {formatDeadline(item.deadline)}
                        </Text>
                    </View>
                </View>

                {/* Description */}
                {!!item.description && (
                    <Text style={{ color: '#64748b', fontSize: 13, lineHeight: 19, marginBottom: 14 }} numberOfLines={2}>
                        {item.description}
                    </Text>
                )}

                {/* Client + Bid button */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{
                            width: 28, height: 28, borderRadius: 14,
                            backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 8
                        }}>
                            <Ionicons name="person" size={14} color="#64748b" />
                        </View>
                        <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600' }}>
                            {item.clientId?.name || 'Client'}
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={{
                            backgroundColor: '#0f172a', borderRadius: 16,
                            paddingHorizontal: 20, paddingVertical: 10
                        }}
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

            {/* Header */}
            <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                    <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600' }}>Welcome back</Text>
                    <Text style={{ color: '#0f172a', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 }}>
                        Hi, {workerName} 👋
                    </Text>
                </View>
                <TouchableOpacity
                    style={{
                        backgroundColor: 'white', padding: 12, borderRadius: 50,
                        shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
                        borderWidth: 1, borderColor: '#f1f5f9'
                    }}
                    onPress={() => navigation.replace('Login')}
                >
                    <Ionicons name="log-out-outline" size={20} color="#64748b" />
                </TouchableOpacity>
            </View>

            {/* Location status banner */}
            <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: 'white', borderRadius: 16,
                    paddingHorizontal: 16, paddingVertical: 11,
                    borderWidth: 1, borderColor: '#f1f5f9',
                    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
                }}>
                    <Ionicons
                        name="location"
                        size={16}
                        color={workerLocation ? '#047857' : '#94a3b8'}
                    />
                    <Text style={{
                        marginLeft: 8, fontSize: 13, fontWeight: '600',
                        color: workerLocation ? '#047857' : '#94a3b8',
                    }}>
                        {workerLocation
                            ? '🔥 Showing jobs near you (within 15 km)'
                            : 'Showing all open jobs • Enable location for nearby'}
                    </Text>
                </View>
            </View>

            {/* Category filter */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexGrow: 0, marginBottom: 16 }}
                contentContainerStyle={{ paddingHorizontal: 20 }}
            >
                {CATEGORIES.map(cat => (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => setActiveCategory(cat)}
                        style={{
                            marginRight: 8,
                            paddingHorizontal: 16, paddingVertical: 8,
                            borderRadius: 20,
                            backgroundColor: activeCategory === cat ? '#0f172a' : 'white',
                            borderWidth: 1,
                            borderColor: activeCategory === cat ? '#0f172a' : '#e2e8f0',
                        }}
                    >
                        <Text style={{
                            fontSize: 13, fontWeight: '700',
                            color: activeCategory === cat ? 'white' : '#64748b',
                        }}>
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Job count */}
            {!loading && !error && (
                <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
                    <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600' }}>
                        {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} available
                        {activeCategory !== 'All' ? ` · ${activeCategory}` : ''}
                    </Text>
                </View>
            )}

            {/* Content */}
            {loading ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="large" color="#0f172a" />
                    <Text style={{ color: '#94a3b8', marginTop: 12, fontWeight: '600' }}>Looking for jobs...</Text>
                </View>
            ) : error ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
                    <Ionicons name="wifi-outline" size={52} color="#cbd5e1" />
                    <Text style={{ color: '#94a3b8', fontWeight: '600', marginTop: 12, textAlign: 'center' }}>{error}</Text>
                    <TouchableOpacity
                        style={{ marginTop: 20, backgroundColor: '#0f172a', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 12 }}
                        onPress={fetchJobs}
                    >
                        <Text style={{ color: 'white', fontWeight: '700' }}>Retry</Text>
                    </TouchableOpacity>
                </View>
            ) : jobs.length === 0 ? (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
                    <Text style={{ fontSize: 52, marginBottom: 16 }}>🔍</Text>
                    <Text style={{ color: '#0f172a', fontSize: 20, fontWeight: '800', marginBottom: 8 }}>No Jobs Found</Text>
                    <Text style={{ color: '#94a3b8', textAlign: 'center', fontWeight: '500' }}>
                        {activeCategory === 'All'
                            ? 'No open jobs right now. Pull down to refresh.'
                            : `No open jobs in ${activeCategory}. Try another category.`}
                    </Text>
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
        </SafeAreaView>
    );
}

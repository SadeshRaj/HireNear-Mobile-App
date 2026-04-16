import React, { useState } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity,
    FlatList, RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { getMyJobs, updateJobStatus, deleteJob } from '../services/jobService';

const CATEGORY_META = {
    Plumbing:    { icon: 'water-drop',         bg: 'bg-sky-50',     color: '#0284c7' },
    Electrical:  { icon: 'electrical-services', bg: 'bg-amber-50',   color: '#d97706' },
    Cleaning:    { icon: 'cleaning-services',   bg: 'bg-emerald-50', color: '#059669' },
    Repairs:     { icon: 'handyman',            bg: 'bg-indigo-50',  color: '#4f46e5' },
    Carpentry:   { icon: 'carpenter',           bg: 'bg-orange-50',  color: '#ea580c' },
    Painting:    { icon: 'format-paint',        bg: 'bg-pink-50',    color: '#db2777' },
    Landscaping: { icon: 'yard',                bg: 'bg-lime-50',    color: '#65a30d' },
    Other:       { icon: 'more-horiz',          bg: 'bg-slate-100',  color: '#475569' },
};

const JOB_STATUS = {
    open:   { label: 'Open',   bg: 'bg-emerald-50', text: 'text-emerald-700', dot: '#059669' },
    closed: { label: 'Closed', bg: 'bg-slate-100',  text: 'text-slate-500',   dot: '#94a3b8' },
};

export default function ClientDashboardScreen({ navigation }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const fetchJobs = async () => {
        try {
            const data = await getMyJobs();
            if (Array.isArray(data)) {
                setJobs(data);
                setError('');
            } else {
                setError(data.msg || 'Failed to load jobs.');
            }
        } catch {
            setError('Network error. Check your connection.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fetch jobs when screen mounts
    // NOTE: pull-to-refresh only during testing (avoids background async state update)
    const onRefresh = () => { setRefreshing(true); fetchJobs(); };

    const handleCloseJob = async (jobId) => {
        const result = await updateJobStatus(jobId, 'closed');
        if (result.job) fetchJobs();
    };

    const handleDeleteJob = (jobId) => {
        Alert.alert('Delete Job', 'Remove this job and all its bids?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                await deleteJob(jobId);
                fetchJobs();
            }}
        ]);
    };

    const openJobs = jobs.filter(j => j.status === 'open').length;
    const totalBids = jobs.reduce((sum, j) => sum + (j.bidCount || 0), 0);

    return (
        <SafeAreaView className="flex-1 bg-[#F8F9FB]">
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* ── Header ─────────────────────────────────────────────── */}
                <View className="px-5 pt-6 pb-4 flex-row justify-between items-center">
                    <View className="flex-row items-center bg-white py-2 px-4 rounded-full shadow-sm border border-gray-100">
                        <View className="bg-emerald-50 p-1.5 rounded-full mr-2">
                            <Ionicons name="location" size={16} color="#047857" />
                        </View>
                        <View>
                            <Text className="text-gray-400 text-xs font-medium tracking-wider uppercase">Current Location</Text>
                            <Text className="text-slate-800 text-sm font-bold tracking-tight">Colombo, WP</Text>
                        </View>
                    </View>

                    <View className="flex-row items-center gap-3">
                        <View className="flex-row items-center bg-white py-2 px-3 rounded-full shadow-sm border border-gray-100">
                            <Feather name="sun" size={18} color="#d97706" />
                            <Text className="text-slate-700 font-bold ml-2">29°</Text>
                        </View>
                        <TouchableOpacity
                            className="bg-white p-2.5 rounded-full shadow-sm border border-gray-100"
                            onPress={() => navigation.replace('Login')}
                        >
                            <Ionicons name="log-out-outline" size={20} color="#64748b" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── Greeting ────────────────────────────────────────────── */}
                <View className="px-5 mb-6">
                    <Text className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">My Dashboard.</Text>
                    <Text className="text-slate-500 font-medium">Manage your jobs and review bids.</Text>
                </View>

                {/* ── Stats Strip ─────────────────────────────────────────── */}
                <View className="px-5 flex-row gap-3 mb-7">
                    <View className="flex-1 bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 items-center">
                        <View className="bg-emerald-50 w-10 h-10 rounded-2xl items-center justify-center mb-2">
                            <Ionicons name="briefcase-outline" size={20} color="#059669" />
                        </View>
                        <Text className="text-2xl font-extrabold text-slate-900">{openJobs}</Text>
                        <Text className="text-slate-400 text-xs font-semibold mt-0.5">Open Jobs</Text>
                    </View>
                    <View className="flex-1 bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 items-center">
                        <View className="bg-blue-50 w-10 h-10 rounded-2xl items-center justify-center mb-2">
                            <Ionicons name="people-outline" size={20} color="#2563eb" />
                        </View>
                        <Text className="text-2xl font-extrabold text-slate-900">{totalBids}</Text>
                        <Text className="text-slate-400 text-xs font-semibold mt-0.5">Total Bids</Text>
                    </View>
                    <View className="flex-1 bg-white rounded-[24px] p-4 shadow-sm border border-gray-100 items-center">
                        <View className="bg-amber-50 w-10 h-10 rounded-2xl items-center justify-center mb-2">
                            <Ionicons name="checkmark-done-outline" size={20} color="#d97706" />
                        </View>
                        <Text className="text-2xl font-extrabold text-slate-900">{jobs.length}</Text>
                        <Text className="text-slate-400 text-xs font-semibold mt-0.5">All Jobs</Text>
                    </View>
                </View>

                {/* ── Post a Job CTA ───────────────────────────────────────── */}
                <View className="px-5 mb-7">
                    <TouchableOpacity
                        className="bg-slate-900 rounded-[28px] p-5 flex-row items-center justify-between shadow-md"
                        onPress={() => navigation.navigate('PostJob')}
                        activeOpacity={0.85}
                    >
                        <View className="flex-1">
                            <Text className="text-white text-xl font-extrabold tracking-tight mb-1">Post a New Job</Text>
                            <Text className="text-slate-400 text-sm font-medium">Get proposals from nearby workers.</Text>
                        </View>
                        <View className="bg-white/10 w-12 h-12 rounded-2xl items-center justify-center ml-3">
                            <Ionicons name="add" size={28} color="white" />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* ── My Posted Jobs ───────────────────────────────────────── */}
                <View className="px-5 mb-8">
                    <View className="flex-row justify-between items-center mb-5">
                        <Text className="text-xl font-bold text-slate-900">My Posted Jobs</Text>
                        <TouchableOpacity>
                            <Text className="text-emerald-700 font-semibold tracking-wide">View All</Text>
                        </TouchableOpacity>
                    </View>

                    {loading ? (
                        <View className="items-center py-10">
                            <ActivityIndicator size="large" color="#0f172a" />
                        </View>
                    ) : jobs.length === 0 ? (
                        <View className="bg-white rounded-[28px] p-8 shadow-sm border border-gray-100 items-center">
                            <Text className="text-4xl mb-3">📋</Text>
                            <Text className="text-slate-700 font-bold text-base mb-1">No jobs posted yet</Text>
                            <Text className="text-slate-400 text-sm text-center">Tap "Post a New Job" above to get started.</Text>
                        </View>
                    ) : (
                        jobs.map((job) => {
                            const catMeta = CATEGORY_META[job.category] || CATEGORY_META.Other;
                            const statusCfg = JOB_STATUS[job.status] || JOB_STATUS.open;
                            const deadlineStr = job.deadline ? new Date(job.deadline).toISOString().split('T')[0] : '';
                            return (
                                <View
                                    key={job._id}
                                    className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 mb-4"
                                >
                                    {/* Job Header */}
                                    <View className="flex-row justify-between items-start mb-3">
                                        <View className="flex-row items-center flex-1 mr-3">
                                            <View className={`w-10 h-10 ${catMeta.bg} rounded-2xl items-center justify-center mr-3`}>
                                                <MaterialIcons name={catMeta.icon} size={20} color={catMeta.color} />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-base font-bold text-slate-900" numberOfLines={1}>
                                                    {job.title}
                                                </Text>
                                                <Text className="text-slate-400 text-xs font-medium mt-0.5">{job.category}</Text>
                                            </View>
                                        </View>

                                        {/* Status Badge */}
                                        <View className={`flex-row items-center px-3 py-1.5 rounded-full ${statusCfg.bg}`}>
                                            <View
                                                style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: statusCfg.dot }}
                                                className="mr-1.5"
                                            />
                                            <Text className={`text-xs font-bold ${statusCfg.text}`}>{statusCfg.label}</Text>
                                        </View>
                                    </View>

                                    {/* Budget + Deadline */}
                                    <View className="flex-row items-center gap-4 mb-4">
                                        <View className="flex-row items-center bg-emerald-50 px-3 py-1.5 rounded-2xl">
                                            <Ionicons name="cash-outline" size={14} color="#059669" />
                                            <Text className="text-emerald-700 font-bold ml-1.5 text-xs">
                                                LKR {job.budget?.toLocaleString()}
                                            </Text>
                                        </View>
                                        <View className="flex-row items-center">
                                            <Ionicons name="calendar-outline" size={14} color="#94a3b8" />
                                            <Text className="text-slate-400 text-xs font-medium ml-1">{deadlineStr}</Text>
                                        </View>
                                    </View>

                                    {/* Bids + Actions */}
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-row items-center bg-blue-50 px-3 py-1.5 rounded-2xl">
                                            <Ionicons name="people-outline" size={14} color="#2563eb" />
                                            <Text className="text-blue-600 font-bold ml-1.5 text-xs">
                                                {job.bidCount || 0} bid{job.bidCount !== 1 ? 's' : ''}
                                            </Text>
                                        </View>

                                        <View className="flex-row gap-2">
                                            {job.status === 'open' && (
                                                <TouchableOpacity
                                                    className="bg-slate-100 border border-slate-200 rounded-2xl px-3 py-2.5"
                                                    onPress={() => handleCloseJob(job._id)}
                                                >
                                                    <Text className="text-slate-600 font-bold text-xs">Close</Text>
                                                </TouchableOpacity>
                                            )}
                                            <TouchableOpacity
                                                className="bg-slate-900 rounded-2xl px-4 py-2.5 flex-row items-center"
                                                onPress={() => navigation.navigate('BidList', { job })}
                                            >
                                                <Text className="text-white font-bold text-xs mr-1">View Bids</Text>
                                                <Ionicons name="arrow-forward" size={13} color="white" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                </View>
                            );
                        })
                    )}
                </View>

                {/* ── Quick Tips ───────────────────────────────────────────── */}
                <View className="px-5 mb-10">
                    <View className="bg-emerald-50 border border-emerald-100 rounded-[24px] p-4 flex-row items-start">
                        <View className="bg-emerald-100 p-2 rounded-xl mr-3 mt-0.5">
                            <Ionicons name="bulb-outline" size={18} color="#047857" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-emerald-800 font-bold text-sm mb-1">Tip: Review all bids</Text>
                            <Text className="text-emerald-700 text-xs font-medium leading-4">
                                Bids are sorted by distance + price. Look for the 🔥 Nearby badge for workers close to you.
                            </Text>
                        </View>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

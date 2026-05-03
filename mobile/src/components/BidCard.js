import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';

/**
 * BidCard — reusable card for both BidListScreen (client view) and MyBidsScreen (worker view)
 *
 * Props:
 *  bid         – bid object from API
 *  mode        – 'client' | 'worker'
 *  onAccept    – (client) called with bid._id
 *  onReject    – (client) called with bid._id
 *  onEdit      – (worker) called with bid object
 *  onWithdraw  – (worker) called with bid._id
 */
export default function BidCard({ bid, mode = 'client', onAccept, onReject, onEdit, onWithdraw }) {
    const worker = bid.workerId || {};
    const job = bid.jobId || {};

    return (
        <View className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 mb-4">

            {/* ── Top Row: Name + Status ────────────────────────────────────── */}
            <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1 mr-3">
                    {mode === 'client' ? (
                        <>
                            <View className="flex-row items-center">
                                <Text className="text-base font-bold text-slate-900">{worker.name || 'Worker'}</Text>
                                {worker.rating !== undefined && (
                                    <View className="flex-row items-center ml-2 bg-amber-50 px-2 py-0.5 rounded-full">
                                        <Ionicons name="star" size={10} color="#f59e0b" />
                                        <Text className="text-amber-700 text-[10px] font-black ml-1">{worker.rating.toFixed(1)}</Text>
                                    </View>
                                )}
                            </View>
                            {worker.skills && worker.skills.length > 0 && (
                                <Text className="text-slate-400 text-xs font-medium mt-0.5">
                                    {worker.skills.slice(0, 2).join(' · ')}
                                </Text>
                            )}
                        </>
                    ) : (
                        <>
                            <Text className="text-base font-bold text-slate-900" numberOfLines={1}>
                                {job.title || 'Job'}
                            </Text>
                            <Text className="text-slate-400 text-xs font-medium mt-0.5" numberOfLines={1}>
                                {job.description || ''}
                            </Text>
                        </>
                    )}
                </View>
                <StatusBadge status={bid.status} />
            </View>

            {/* ── Nearby Badge ─────────────────────────────────────────────── */}
            {bid.isNearby && mode === 'client' && (
                <View className="flex-row items-center bg-orange-50 border border-orange-100 rounded-2xl px-3 py-1.5 mb-3 self-start">
                    <Text className="text-base">🔥</Text>
                    <Text className="text-orange-600 text-xs font-bold ml-1">Nearby — High Priority</Text>
                </View>
            )}

            {/* ── Price + Time + Distance ───────────────────────────────────── */}
            <View className="flex-row items-center mb-3 gap-4">
                <View className="flex-row items-center bg-emerald-50 px-3 py-1.5 rounded-2xl">
                    <Ionicons name="cash-outline" size={15} color="#059669" />
                    <Text className="text-emerald-700 font-bold ml-1.5 text-sm">
                        LKR {bid.price?.toLocaleString()}
                    </Text>
                </View>

                {!!bid.estimatedTime && (
                    <View className="flex-row items-center bg-slate-50 px-3 py-1.5 rounded-2xl">
                        <Ionicons name="timer-outline" size={15} color="#64748b" />
                        <Text className="text-slate-600 font-semibold ml-1.5 text-sm">{bid.estimatedTime}</Text>
                    </View>
                )}

                {bid.distance !== null && bid.distance !== undefined && (
                    <View className="flex-row items-center">
                        <Ionicons name="location-outline" size={14} color="#047857" />
                        <Text className="text-emerald-700 text-xs font-bold ml-1">{bid.distance} km</Text>
                    </View>
                )}
            </View>

            {/* ── Proposal Message ──────────────────────────────────────────── */}
            {!!bid.message && (
                <View className="bg-slate-50 rounded-2xl p-3 mb-3">
                    <Text className="text-slate-600 text-sm leading-5">{bid.message}</Text>
                </View>
            )}

            {/* ── Attachments count ─────────────────────────────────────────── */}
            {bid.attachments?.length > 0 && (
                <View className="flex-row items-center mb-3">
                    <Feather name="paperclip" size={13} color="#94a3b8" />
                    <Text className="text-slate-400 text-xs ml-1.5">
                        {bid.attachments.length} attachment{bid.attachments.length > 1 ? 's' : ''}
                    </Text>
                </View>
            )}

            {/* ── Actions ───────────────────────────────────────────────────── */}
            {mode === 'client' && bid.status === 'pending' && (
                <View className="flex-row gap-3 mt-1">
                    <TouchableOpacity
                        className="flex-1 bg-slate-900 rounded-2xl py-3 items-center"
                        onPress={() => onAccept && onAccept(bid._id)}
                    >
                        <Text className="text-white font-bold text-sm">Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-1 bg-red-50 border border-red-100 rounded-2xl py-3 items-center"
                        onPress={() => onReject && onReject(bid._id)}
                    >
                        <Text className="text-red-600 font-bold text-sm">Reject</Text>
                    </TouchableOpacity>
                </View>
            )}

            {mode === 'worker' && bid.status === 'pending' && (
                <View className="flex-row gap-3 mt-1">
                    <TouchableOpacity
                        className="flex-1 bg-blue-600 rounded-2xl py-3 items-center"
                        onPress={() => onEdit && onEdit(bid)}
                    >
                        <Text className="text-white font-bold text-sm">Edit Bid</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className="flex-1 bg-slate-100 border border-slate-200 rounded-2xl py-3 items-center"
                        onPress={() => onWithdraw && onWithdraw(bid._id)}
                    >
                        <Text className="text-slate-600 font-bold text-sm">Withdraw</Text>
                    </TouchableOpacity>
                </View>
            )}

            {mode === 'worker' && bid.status === 'accepted' && (
                <View className="flex-row items-center bg-emerald-50 rounded-2xl px-4 py-3 mt-1">
                    <Ionicons name="checkmark-circle" size={18} color="#059669" />
                    <Text className="text-emerald-700 font-bold ml-2 text-sm">Your bid was accepted!</Text>
                </View>
            )}
        </View>
    );
}

import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Status config map
const STATUS_CONFIG = {
    pending: {
        label: 'Pending',
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        icon: 'time-outline',
        iconColor: '#d97706',
    },
    // ADDED: Logic for Scheduled status
    scheduled: {
        label: 'Scheduled',
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        icon: 'calendar-outline',
        iconColor: '#2563eb',
    },
    // ADDED: Logic for Completed status (fixes your issue)
    completed: {
        label: 'Completed',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: 'checkmark-done-circle',
        iconColor: '#059669',
    },
    accepted: {
        label: 'Accepted',
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: 'checkmark-circle-outline',
        iconColor: '#059669',
    },
    rejected: {
        label: 'Rejected',
        bg: 'bg-red-50',
        text: 'text-red-600',
        border: 'border-red-200',
        icon: 'close-circle-outline',
        iconColor: '#dc2626',
    },
    withdrawn: {
        label: 'Withdrawn',
        bg: 'bg-slate-100',
        text: 'text-slate-500',
        border: 'border-slate-200',
        icon: 'arrow-undo-outline',
        iconColor: '#64748b',
    },
    cancelled: {
        label: 'Cancelled',
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: 'close-circle-outline',
        iconColor: '#b91c1c',
    },

};

export default function StatusBadge({ status }) {
    // Normalize status to lowercase to match the config keys
    const normalizedStatus = status?.toLowerCase() || 'pending';
    const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.pending;

    return (
        <View className={`flex-row items-center px-3 py-1.5 rounded-full border ${config.bg} ${config.border}`}>
            <Ionicons name={config.icon} size={13} color={config.iconColor} />
            <Text className={`ml-1 text-xs font-bold ${config.text}`}>{config.label}</Text>
        </View>
    );
}
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
};

export default function StatusBadge({ status }) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
        <View className={`flex-row items-center px-3 py-1.5 rounded-full border ${config.bg} ${config.border}`}>
            <Ionicons name={config.icon} size={13} color={config.iconColor} />
            <Text className={`ml-1 text-xs font-bold ${config.text}`}>{config.label}</Text>
        </View>
    );
}

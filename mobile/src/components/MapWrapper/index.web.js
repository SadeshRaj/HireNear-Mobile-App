import React from 'react';
import { View, Text } from 'react-native';

export const Marker = () => null;
export const Callout = () => null;
export const Circle = () => null;
export const PROVIDER_GOOGLE = 'google';
export const PROVIDER_DEFAULT = 'default';

export default function MapView({ style }) {
    return (
        <View style={[{ backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center', minHeight: 200, borderRadius: 12 }, style]}>
            <Text style={{ color: '#475569', fontWeight: 'bold' }}>📍 Map View (Native Only)</Text>
            <Text style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Please use the mobile app to select locations.</Text>
        </View>
    );
}
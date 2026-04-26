import React from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ViewWorkProofScreen = ({ route, navigation }) => {
    const { imageUrl, title } = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                    <Text style={styles.closeText}>✕ Close</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            </View>

            <View style={styles.imageWrapper}>
                <Image
                    source={{ uri: imageUrl }}
                    style={styles.fullImage}
                    resizeMode="contain"
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#000' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333'
    },
    closeBtn: { padding: 5 },
    closeText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    headerTitle: { color: '#fff', marginLeft: 20, fontSize: 18, flex: 1 },
    imageWrapper: { flex: 1, justifyContent: 'center' },
    fullImage: { width: '100%', height: '80%' }
});

export default ViewWorkProofScreen;
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    StyleSheet,
    Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { completeBooking } from '../services/bookingService';

const CompleteJobScreen = ({ route, navigation }) => {
    // Check if params exists, if not, try to get from route.params directly
    const bookingId = route.params?.bookingId;
    const [image, setImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Gallery access is required.');
            return;
        }

        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'images',
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.7,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImage(result.assets[0]);
            }
        } catch (err) {
            console.error("Picker Error:", err);
        }
    };

    const handleSubmit = async () => {
        if (!image) return Alert.alert("Required", "Please select an image first.");
        if (!bookingId) return Alert.alert("Error", "Booking ID not found.");

        setUploading(true);
        try {
            const formData = new FormData();

            // UNIVERSAL URI FIX:
            // Android needs the raw uri, iOS needs the file:// prefix removed.
            const localUri = image.uri;
            const filename = localUri.split('/').pop();

            // Match type from the result asset if possible, otherwise default to jpeg
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : `image/jpeg`;

            formData.append('completionImages', {
                uri: Platform.OS === 'ios' ? localUri.replace('file://', '') : localUri,
                name: filename || `proof_${bookingId}.jpg`,
                type: type,
            });

            console.log("📤 Sending FormData to backend...");

            await completeBooking(bookingId, formData);

            Alert.alert("Success", "Job marked as completed!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            // Detailed logging to find the culprit
            console.error("Detailed Error:", error.response?.data || error.message);
            const msg = error.response?.data?.msg || "Server rejected the request.";
            Alert.alert("Upload Failed", msg);
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.headerSection}>
                <Text style={styles.title}>Job Completion</Text>
                <Text style={styles.subtitle}>Upload a photo to prove the work is done.</Text>
            </View>

            <TouchableOpacity
                onPress={pickImage}
                style={[styles.imagePlaceholder, image && styles.imageSelected]}
            >
                {image ? (
                    <Image source={{ uri: image.uri }} style={styles.fullImage} />
                ) : (
                    <View style={styles.placeholderContent}>
                        <View style={styles.iconCircle}>
                            <Text style={styles.iconText}>📸</Text>
                        </View>
                        <Text style={styles.placeholderText}>Tap to select proof image</Text>
                    </View>
                )}
            </TouchableOpacity>

            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={uploading}
                    style={[styles.submitBtn, uploading && styles.disabledBtn]}
                >
                    {uploading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text style={styles.btnText}>Submit Completion</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelLink}>
                    <Text style={styles.cancelLinkText}>Cancel & Go Back</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ... (Styles remain the same)
const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, backgroundColor: '#ffffff' },
    headerSection: { marginBottom: 30, marginTop: 40 },
    title: { fontSize: 28, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
    subtitle: { fontSize: 15, color: '#64748b', textAlign: 'center', marginTop: 8 },
    imagePlaceholder: {
        width: '100%',
        height: 320,
        backgroundColor: '#f8fafc',
        borderRadius: 24,
        borderStyle: 'dashed',
        borderWidth: 2,
        borderColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    imageSelected: { borderStyle: 'solid', borderColor: '#10b981' },
    placeholderContent: { alignItems: 'center' },
    iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    iconText: { fontSize: 32 },
    fullImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholderText: { color: '#64748b', fontSize: 16, fontWeight: '600' },
    footer: { marginTop: 'auto', marginBottom: 20 },
    submitBtn: {
        backgroundColor: '#2563eb',
        padding: 18,
        borderRadius: 16,
        shadowColor: "#2563eb",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4
    },
    disabledBtn: { backgroundColor: '#94a3b8', shadowOpacity: 0 },
    btnText: { color: 'white', textAlign: 'center', fontWeight: 'bold', fontSize: 18 },
    cancelLink: { marginTop: 20, padding: 10 },
    cancelLinkText: { color: '#94a3b8', textAlign: 'center', fontWeight: '600' }
});

export default CompleteJobScreen;
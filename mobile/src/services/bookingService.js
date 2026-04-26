import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config';

/**
 * Private Helper to get Authorization Header
 * This ensures we always have the latest token from storage
 */
const getAuthHeader = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
        console.warn("⚠️ No token found in AsyncStorage");
    }
    return {
        'Authorization': `Bearer ${token}`
    };
};

// 1. READ: Fetch history (For Schedules/History screens)
export const getMyBookings = async () => {
    try {
        const headers = await getAuthHeader();
        const res = await axios.get(`${API_BASE_URL}/bookings/my-history`, { headers });
        return res.data;
    } catch (error) {
        console.error("📋 Fetch History Error:", error.response?.data || error.message);
        throw error;
    }
};

/**
 * 2. UPDATE: Complete Job
 * Handles FormData for Cloudinary image uploads.
 * CRITICAL: Ensure the FormData 'key' matches the server's 'attachments' field.
 */
export const completeBooking = async (bookingId, formData) => {
    try {
        const headers = await getAuthHeader();

        const res = await axios.patch(
            `${API_BASE_URL}/bookings/${bookingId}/complete`,
            formData,
            {
                headers: {
                    ...headers,
                    'Content-Type': 'multipart/form-data',
                },
                // Optional: track upload progress for the UI
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    console.log(`📤 Upload Progress: ${percentCompleted}%`);
                }
            }
        );
        return res.data;
    } catch (error) {
        console.error("📸 Job Completion Error:", error.response?.data || error.message);
        throw error;
    }
};

// 3. UPDATE: Cancel Booking
export const cancelBooking = async (id) => {
    try {
        const headers = await getAuthHeader();
        const res = await axios.put(`${API_BASE_URL}/bookings/${id}/cancel`, {}, { headers });
        return res.data;
    } catch (error) {
        console.error("🛑 Cancel Error:", error.response?.data || error.message);
        throw error;
    }
};

// 4. READ: Single Booking Details
export const getBookingDetails = async (id) => {
    try {
        const headers = await getAuthHeader();
        const response = await axios.get(`${API_BASE_URL}/bookings/${id}`, { headers });
        return response.data;
    } catch (error) {
        console.error("🔍 Details Fetch Error:", error.response?.data || error.message);
        throw error;
    }
};

// 5. UPDATE: Status (e.g., Change to 'in-progress')
export const updateBookingStatus = async (id, status) => {
    try {
        const headers = await getAuthHeader();
        const res = await axios.patch(`${API_BASE_URL}/bookings/${id}/status`, { status }, { headers });
        return res.data;
    } catch (error) {
        console.error("🔄 Status Update Error:", error.response?.data || error.message);
        throw error;
    }
};
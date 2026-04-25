import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config'; // <-- Ensure config.js has port 4000

/**
 * Helper to get Authorization Header
 */
const getAuthHeader = async () => {
    const token = await AsyncStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

// 1. READ: Fetch history
export const getMyBookings = async () => {
    try {
        const headers = await getAuthHeader();
        const res = await axios.get(`${API_BASE_URL}/bookings/my-history`, { headers });
        return res.data;
    } catch (error) {
        console.error("Fetch Error:", error.response?.data || error.message);
        throw error;
    }
};

// 2. UPDATE: Complete Job (Handles Multipart/FormData for Cloudinary)
export const completeBooking = async (bookingId, formData) => {
    try {
        const token = await AsyncStorage.getItem('token');
        const res = await axios.patch(`${API_BASE_URL}/bookings/${bookingId}/complete`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data' // Important for images
            }
        });
        return res.data;
    } catch (error) {
        console.error("Complete Error:", error.response?.data || error.message);
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
        console.error("Cancel Error:", error.response?.data || error.message);
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
        console.error("Details Error:", error.response?.data || error.message);
        throw error;
    }
};
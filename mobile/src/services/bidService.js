import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.4:3001/api';

// Get auth token stored at login
const getToken = async () => {
    return await AsyncStorage.getItem('token');
};

// Shared auth headers
const authHeaders = async () => {
    const token = await getToken();
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
};

// ─── Submit a bid (with optional file attachments) ───────────────────────────
export const submitBid = async ({ jobId, price, message, estimatedTime, jobCoordinates, files = [] }) => {
    const token = await getToken();
    const formData = new FormData();
    formData.append('jobId', jobId);
    formData.append('price', String(price));
    formData.append('message', message || '');
    formData.append('estimatedTime', estimatedTime || '');
    if (jobCoordinates) {
        formData.append('jobCoordinates', JSON.stringify(jobCoordinates));
    }
    files.forEach((file, i) => {
        formData.append('attachments', {
            uri: file.uri,
            name: file.name || `attachment_${i}`,
            type: file.mimeType || 'application/octet-stream',
        });
    });

    const response = await fetch(`${BASE_URL}/bids`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    return response.json();
};

// ─── Get all bids for a job (client view) ───────────────────────────────────
export const getBidsForJob = async (jobId) => {
    const headers = await authHeaders();
    const response = await fetch(`${BASE_URL}/bids/job/${jobId}`, { headers });
    return response.json();
};

// ─── Get current worker's bids ───────────────────────────────────────────────
export const getMyBids = async (status = null) => {
    const headers = await authHeaders();
    const url = status
        ? `${BASE_URL}/bids/my?status=${status}`
        : `${BASE_URL}/bids/my`;
    const response = await fetch(url, { headers });
    return response.json();
};

// ─── Update a pending bid ────────────────────────────────────────────────────
export const updateBid = async (bidId, { price, message, estimatedTime, files = [] }) => {
    const token = await getToken();
    const formData = new FormData();
    if (price) formData.append('price', String(price));
    if (message !== undefined) formData.append('message', message);
    if (estimatedTime !== undefined) formData.append('estimatedTime', estimatedTime);
    files.forEach((file, i) => {
        formData.append('attachments', {
            uri: file.uri,
            name: file.name || `attachment_${i}`,
            type: file.mimeType || 'application/octet-stream',
        });
    });

    const response = await fetch(`${BASE_URL}/bids/${bidId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    return response.json();
};

// ─── Withdraw a bid ──────────────────────────────────────────────────────────
export const withdrawBid = async (bidId) => {
    const headers = await authHeaders();
    const response = await fetch(`${BASE_URL}/bids/${bidId}`, {
        method: 'DELETE',
        headers,
    });
    return response.json();
};

// ─── Accept a bid (client) ───────────────────────────────────────────────────
export const acceptBid = async (bidId) => {
    const headers = await authHeaders();
    const response = await fetch(`${BASE_URL}/bids/${bidId}/accept`, {
        method: 'PATCH',
        headers,
    });
    return response.json();
};

// ─── Reject a bid (client) ───────────────────────────────────────────────────
export const rejectBid = async (bidId) => {
    const headers = await authHeaders();
    const response = await fetch(`${BASE_URL}/bids/${bidId}/reject`, {
        method: 'PATCH',
        headers,
    });
    return response.json();
};

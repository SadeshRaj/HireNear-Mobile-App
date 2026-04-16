import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.1.4:3001/api';

const getToken = async () => AsyncStorage.getItem('token');

const authHeaders = async () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${await getToken()}`,
});

// ─── Create a new job ────────────────────────────────────────────────────────
export const createJob = async ({ title, description, category, budget, deadline, location, images = [] }) => {
    const token = await getToken();

    // Use JSON when no images (simpler, more reliable in RN)
    if (!images || images.length === 0) {
        const response = await fetch(`${BASE_URL}/jobs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ title, description, category, budget, deadline, location }),
        });
        return response.json();
    }

    // Use FormData only when images are attached
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('budget', String(budget));
    formData.append('deadline', deadline);
    formData.append('location', JSON.stringify(location));
    images.forEach((img, i) => {
        formData.append('images', {
            uri: img.uri,
            name: img.fileName || `job_image_${i}.jpg`,
            type: img.mimeType || 'image/jpeg',
        });
    });
    const response = await fetch(`${BASE_URL}/jobs`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    return response.json();
};

// ─── Get client's own jobs (includes live bid count) ─────────────────────────
export const getMyJobs = async () => {
    const headers = await authHeaders();
    const response = await fetch(`${BASE_URL}/jobs/my`, { headers });
    return response.json();
};

// ─── Get nearby jobs (worker) ─────────────────────────────────────────────────
export const getNearbyJobs = async ({ lng, lat, maxDistanceKm = 10, category, minBudget, maxBudget } = {}) => {
    const headers = await authHeaders();
    let url = `${BASE_URL}/jobs/nearby?lng=${lng}&lat=${lat}&maxDistanceKm=${maxDistanceKm}`;
    if (category) url += `&category=${category}`;
    if (minBudget) url += `&minBudget=${minBudget}`;
    if (maxBudget) url += `&maxBudget=${maxBudget}`;
    const response = await fetch(url, { headers });
    return response.json();
};

// ─── Update job status (open / closed) ───────────────────────────────────────
export const updateJobStatus = async (jobId, status) => {
    const headers = await authHeaders();
    const response = await fetch(`${BASE_URL}/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status }),
    });
    return response.json();
};

// ─── Delete a job ─────────────────────────────────────────────────────────────
export const deleteJob = async (jobId) => {
    const headers = await authHeaders();
    const response = await fetch(`${BASE_URL}/jobs/${jobId}`, {
        method: 'DELETE',
        headers,
    });
    return response.json();
};

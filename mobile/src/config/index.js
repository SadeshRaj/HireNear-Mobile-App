import { Platform } from 'react-native';

// Option A: Using the .env variable if it exists
const ENV_URL = process.env.EXPO_PUBLIC_API_URL;

// Option B: Manual fallback (Best for your group members)
const PORT = "4000";
const PC_IP = "192.168.1.180"; // <--- Change this to your local IP

export const API_BASE_URL = ENV_URL || Platform.select({
    ios: `http://localhost:${PORT}/api`,
    android: `http://10.0.2.2:${PORT}/api`,
    // If testing on a real phone, use the line below:
    // default: `http://${PC_IP}:${PORT}/api`,
});

console.log("Connect to API at:", API_BASE_URL);
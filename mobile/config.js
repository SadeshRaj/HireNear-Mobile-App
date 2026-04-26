// config.js — Single source of truth for the API URL
// Set EXPO_PUBLIC_API_URL in mobile/.env to switch between emulator and physical device

export const API_BASE_URL =
    process.env.EXPO_PUBLIC_API_URL || 'http://10.154.201.48:4000/api';

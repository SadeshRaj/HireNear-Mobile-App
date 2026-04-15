require('dotenv').config();
const express = require('express');
const cors = require('cors'); // 1. Import CORS
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');

const app = express();

// Connect to Database
connectDB();

// --- MIDDLEWARE ---
app.use(cors()); // 2. Enable CORS (Must be before routes)
app.use(express.json());

// --- ROUTES ---
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;

// 3. Listen on '0.0.0.0' to allow external connections (Mobile/Emulator)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Local Network URL: http://192.168.1.180:${PORT}`);
});
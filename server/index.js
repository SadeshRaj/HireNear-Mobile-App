require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const bidRoutes = require('./src/routes/bidRoutes');
const jobRoutes = require('./src/routes/jobRoutes');

const app = express();

// Connect to Database
connectDB();

// --- MIDDLEWARE ---
app.use(cors()); // 2. Enable CORS (Must be before routes)
app.use(express.json());

// --- STATIC FILES (for bid attachments) ---
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/jobs', jobRoutes);

const PORT = process.env.PORT || 5000;

// 3. Listen on '0.0.0.0' to allow external connections (Mobile/Emulator)
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Local Network URL: http://192.168.1.180:${PORT}`);
});
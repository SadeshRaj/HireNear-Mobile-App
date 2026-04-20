require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const os = require('os');
const connectDB = require('./src/config/db');

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes'); // Your module
const bidRoutes = require('./src/routes/bidRoutes');         // Teammate's module
const jobRoutes = require('./src/routes/jobRoutes');         // Teammate's module
const portfolioRoutes = require('./src/routes/portfolioRoutes'); // Teammate's module

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Static files for local uploads (if skipping Cloudinary fallback)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes); // Your module mounted
app.use('/api/bids', bidRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/portfolio', portfolioRoutes);

const PORT = process.env.PORT || 4000;

const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
};

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Local Network URL: http://${getLocalIP()}:${PORT}`);
});
require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const os = require('os');
const cloudinary = require('cloudinary').v2;
const connectDB = require('./src/config/db');

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const bidRoutes = require('./src/routes/bidRoutes');
const jobRoutes = require('./src/routes/jobRoutes');
const portfolioRoutes = require('./src/routes/portfolioRoutes');
const invoiceRoutes = require('./src/routes/invoiceRoutes');

const app = express();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

connectDB();

// Middleware - Standardized for Mobile/Cross-Origin requests
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/invoices', invoiceRoutes);

const PORT = process.env.PORT || 4000;

// Filters out VirtualBox/VMWare IPs to find your real Wi-Fi address
const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && !alias.internal && !alias.address.startsWith('192.168.56')) {
                return alias.address;
            }
        }
    }
    return 'localhost';
};

app.listen(PORT, '0.0.0.0', () => {
    const networkIP = getLocalIP();
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔗 USE THIS FOR MOBILE .env: http://${networkIP}:${PORT}/api`);
});
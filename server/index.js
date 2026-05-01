require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const os = require('os');
const http = require('http'); // Added HTTP module
const { Server } = require('socket.io'); // Added Socket.io Server
const cloudinary = require('cloudinary').v2;
const connectDB = require('./src/config/db');

// Import Routes
const authRoutes = require('./src/routes/authRoutes');
const bidRoutes = require('./src/routes/bidRoutes');
const jobRoutes = require('./src/routes/jobRoutes');
const portfolioRoutes = require('./src/routes/portfolioRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const invoiceRoutes = require('./src/routes/invoiceRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const messageRoutes = require('./src/routes/messageRoutes'); // Added Message Routes

const socketHandler = require('./src/config/socket'); // Added Socket Handler

const app = express();

// Create HTTP Server & Initialize Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// --- CLOUDINARY CONFIG ---
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Static files for local uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes); // Mount Message Routes

// Initialize Sockets
socketHandler(io);

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

// CRITICAL: Switched from app.listen to server.listen
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Local Network URL: http://${getLocalIP()}:${PORT}`);
});
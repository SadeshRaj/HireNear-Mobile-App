require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const os = require('os');
const http = require('http'); // 1. Declared once here
const { Server } = require('socket.io'); // 2. Declared once here
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
const supportRoutes = require('./src/routes/supportRoutes');
const messageRoutes = require('./src/routes/messageRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');

const socketHandler = require('./src/config/socket');
const SupportMessage = require('./src/models/SupportMessage');

const app = express();

// --- INITIALIZE SERVER & SOCKET.IO ---
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Pass io to express app for use in routes if needed
app.set('io', io);

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/uploads', express.static('uploads'));

// --- SOCKET LOGIC ---
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join', (data) => {
        if (data.isAdmin) {
            socket.join('admin_room');
            console.log('Admin joined admin_room');
        } else if (data.userId) {
            socket.join(`user_${data.userId}`);
            console.log(`User joined user_${data.userId}`);
        }
    });

    socket.on('sendMessage', async (data) => {
        try {
            const { senderId, receiverId, message, image, isAdmin } = data;

            const newMsg = new SupportMessage({
                senderId: isAdmin ? null : senderId,
                receiverId: isAdmin ? receiverId : null,
                message,
                image,
                isAdmin
            });
            await newMsg.save();

            io.to('admin_room').emit('receiveMessage', newMsg);
            const targetUser = isAdmin ? receiverId : senderId;
            io.to(`user_${targetUser}`).emit('receiveMessage', newMsg);

            // Auto-reply logic
            if (!isAdmin) {
                const messageCount = await SupportMessage.countDocuments({
                    $or: [{ senderId: senderId }, { receiverId: senderId }]
                });

                if (messageCount === 1) {
                    const autoReplyMsg = new SupportMessage({
                        senderId: null,
                        receiverId: senderId,
                        message: "Hi there! 👋 Thanks for reaching out to HireNear Support. We'll be with you shortly.",
                        image: null,
                        isAdmin: true,
                        read: false
                    });

                    await autoReplyMsg.save();

                    setTimeout(() => {
                        io.to('admin_room').emit('receiveMessage', autoReplyMsg);
                        io.to(`user_${senderId}`).emit('receiveMessage', autoReplyMsg);
                    }, 1500);
                }
            }
        } catch (err) {
            console.error('Socket message error:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
    });
});

// Initialize external Socket handlers if you have them
socketHandler(io);

// --- START SERVER ---
const PORT = process.env.PORT || 4000;

const getLocalIP = () => {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
};

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Local Network URL: http://${getLocalIP()}:${PORT}`);
});
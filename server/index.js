require('dotenv').config();
const express = require('express');
const cors = require('cors');
const os = require('os');
const connectDB = require('./src/config/db');

// 1. Import your Routes
const authRoutes = require('./src/routes/authRoutes');
const jobRoutes = require('./src/routes/jobRoutes'); // Added Job Routes

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// 2. Register your Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes); // Added Job Endpoint

const PORT = process.env.PORT || 4000; // Updated to 4000 as per your last setup

// Function to dynamically grab the local IPv4 address
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
    console.log(`-------------------------------------------`);
    console.log(`Server running on port ${PORT}`);
    console.log(`Local Network URL: http://${getLocalIP()}:${PORT}`);
    console.log(`-------------------------------------------`);
});
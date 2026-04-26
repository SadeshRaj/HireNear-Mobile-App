const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import your User model

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_temporary_secret_key');

            // --- THE CRITICAL FIX ---
            // Fetch the user from DB so req.user._id exists and matches MongoDB's format
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ msg: 'User not found' });
            }

            next();
        } catch (error) {
            console.error("Token verification failed:", error.message);
            return res.status(401).json({ msg: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ msg: 'Not authorized, no token' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        return res.status(403).json({ msg: 'Not authorized as an admin' });
    }
};

module.exports = { protect, adminOnly };
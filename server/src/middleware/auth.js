const jwt = require('jsonwebtoken');
const User = require('../models/user');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Handle both token formats:
            //   Ours:  { id: user._id }
            //   Main:  { user: { id, role } }
            const userId = decoded.id || decoded.user?.id;

            req.user = await User.findById(userId).select('-password');

            if (!req.user) {
                return res.status(401).json({ msg: 'User not found. Please log in again.' });
            }

            return next();
        } catch (error) {
            return res.status(401).json({ msg: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ msg: 'Not authorized, no token' });
    }
};

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        res.status(401).json({ msg: 'Not authorized as an admin' });
    }
};

module.exports = { protect, isAdmin };

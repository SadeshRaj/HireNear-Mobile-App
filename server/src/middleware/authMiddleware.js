const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;

    // Check if the request has an Authorization header starting with "Bearer"
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (Format: "Bearer <token>")
            token = req.headers.authorization.split(' ')[1];

            // Verify token using the secret key
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_temporary_secret_key');

            // Attach the user info (id, role, etc.) to the request object
            // This is what allows your req.user.id to work in the Booking controller!
            req.user = decoded.user;

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

// Middleware to check for Admin roles (Useful for managing all bookings)
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        return res.status(403).json({ msg: 'Not authorized as an admin' });
    }
};

module.exports = { protect, adminOnly };
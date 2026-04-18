const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (Format: "Bearer <token>")
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_temporary_secret_key');

            // Attach the user info to the request object
            req.user = decoded.user;

            next();
        } catch (error) {
            console.error("Token verification failed:", error.message);
            // Returning 401 JSON so your frontend can show a custom UI error, not a browser alert
            return res.status(401).json({ msg: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ msg: 'Not authorized, no token' });
    }
};

// Optional: Middleware to check for Admin roles
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        next();
    } else {
        return res.status(403).json({ msg: 'Not authorized as an admin' });
    }
};

module.exports = { protect, adminOnly };
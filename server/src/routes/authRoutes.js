const express = require('express');
const router = express.Router();

// 1. Import BOTH functions from your controller
const { registerUser, verifyOTP, loginUser } = require('../controllers/authController');

// 2. Your existing register route
router.post('/register', registerUser);

// 3. THE MISSING ROUTE: Add the verify-otp route
router.post('/verify-otp', verifyOTP);

router.post('/login', loginUser);

module.exports = router;
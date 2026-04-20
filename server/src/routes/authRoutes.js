const express = require('express');
const router = express.Router();
const { registerUser, verifyOTP, loginUser, changePassword, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/login', loginUser);
router.put('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile); // New Profile Route

module.exports = router;
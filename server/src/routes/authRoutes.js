const express = require('express');
const router = express.Router();
const {
    registerUser,
    verifyOTP,
    loginUser,
    changePassword,
    updateProfile,
    getWorkerById // Make sure this is imported
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/login', loginUser);
router.put('/change-password', protect, changePassword);
router.put('/profile', protect, updateProfile);

// New Route: Fetch worker profile by ID
// This will be called as /api/auth/worker/:workerId
router.get('/worker/:workerId', protect, getWorkerById);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
    registerUser,
    verifyOTP,
    loginUser,
    changePassword,
    updateProfile,
    getWorkerById,
    getTopWorkers
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload'); // Added upload middleware

router.post('/register', registerUser);
router.post('/verify-otp', verifyOTP);
router.post('/login', loginUser);
router.put('/change-password', protect, changePassword);

// Apply the upload middleware for the profile image
router.put('/profile', protect, upload.single('profileImage'), updateProfile);

// Route: Fetch top workers for dashboard
router.get('/workers/top', protect, getTopWorkers);

// Route: Fetch worker profile by ID
router.get('/worker/:workerId', protect, getWorkerById);

module.exports = router;
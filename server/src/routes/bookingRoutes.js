const express = require('express');
const router = express.Router();
const {
    getBookingByJobId,
    updateBookingStatus,
    uploadProof,
    getWorkerBookings
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// Get all active bookings for a worker
router.get('/worker', protect, getWorkerBookings);

// Get specific booking by Job ID
router.get('/job/:jobId', protect, getBookingByJobId);

// Update status (pending, scheduled, in-progress, completed)
router.patch('/:id/status', protect, updateBookingStatus);

// Worker uploads work proof photos (allows up to 5 images at once)
router.post('/:id/upload-proof', protect, upload.array('images', 5), uploadProof);

module.exports = router;
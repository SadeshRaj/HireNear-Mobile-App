const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/multerConfig');

// --- CLIENT & GENERAL ROUTES ---
router.post('/', protect, bookingController.createBooking);
router.get('/my-history', protect, bookingController.getMyBookings);
router.get('/job/:jobId', protect, bookingController.getBookingByJobId);

// --- WORKER SPECIFIC ROUTES ---
router.get('/worker', protect, bookingController.getWorkerBookings);
router.patch('/:id/status', protect, bookingController.updateBookingStatus);

// 6. COMPLETE JOB (The high-priority fix)
// Using .any() to prevent "Unexpected field" errors from mobile naming mismatches
router.patch(
    '/:id/complete',
    protect,
    upload.any(),
    bookingController.completeBooking
);

router.put('/:id/cancel', protect, bookingController.cancelBooking);

module.exports = router;
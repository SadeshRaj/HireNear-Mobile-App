const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// Ensure this points to your specific multer-cloudinary config
const upload = require('../middleware/multerConfig');

// 1. Create a booking
router.post('/', protect, bookingController.createBooking);

// 2. Get history (Used by your SchedulesScreen)
router.get('/my-history', protect, bookingController.getMyBookings);

// 3. Update Status (General)
router.patch('/:id/status', protect, bookingController.updateBookingStatus);

// 4. COMPLETE JOB (The one giving you the Multer error)
// FIXED: Changed 'completeBooking' to 'bookingController.completeBooking'
// FIXED: Added 'protect' middleware
router.patch(
    '/:id/complete',
    protect,
    upload.array('completionImages', 5),
    bookingController.completeBooking
);

// 5. CANCEL BOOKING
router.put('/:id/cancel', protect, bookingController.cancelBooking);

module.exports = router;
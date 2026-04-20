const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected by our mock auth
router.post('/', protect, bookingController.createBooking);
router.get('/my-history', protect, bookingController.getMyBookings);
router.patch('/:id/status', protect, bookingController.updateBookingStatus);

module.exports = router;
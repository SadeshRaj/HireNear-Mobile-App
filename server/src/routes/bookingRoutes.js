const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Job = require('../models/JobPost'); // Needed to sync Job status
const { protect } = require('../middleware/auth'); // Ensure your routes are protected

// GET /api/bookings/job/:jobId - Fetch booking details
router.get('/job/:jobId', protect, async (req, res) => {
    try {
        const { jobId } = req.params;
        const booking = await Booking.findOne({ jobId: jobId })
            .populate('workerId', 'name email phone')
            .populate('jobId');

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        res.json({ success: true, booking });
    } catch (error) {
        console.error("Fetch Booking Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// PATCH /api/bookings/:bookingId/status - Update booking status
router.patch('/:bookingId/status', protect, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body; // e.g., 'completed'

        const booking = await Booking.findByIdAndUpdate(
            bookingId,
            { status: status },
            { new: true }
        );

        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

        // Sync Job status to 'completed' if the booking is completed
        if (status === 'completed') {
            await Job.findByIdAndUpdate(booking.jobId, { status: 'completed' });
        }

        res.json({ success: true, booking });
    } catch (error) {
        console.error("Status Update Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// PATCH /api/bookings/:bookingId/add-image - Add attachment URL
router.patch('/:bookingId/add-image', protect, async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { imageUrl } = req.body;

        const booking = await Booking.findByIdAndUpdate(
            bookingId,
            { $push: { attachments: imageUrl } },
            { new: true }
        );

        res.json({ success: true, booking });
    } catch (error) {
        console.error("Image Upload Error:", error);
        res.status(500).json({ success: false, message: "Upload failed" });
    }
});

module.exports = router;
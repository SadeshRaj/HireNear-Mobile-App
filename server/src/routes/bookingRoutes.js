const express = require('express');
const router = express.Router();
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const Booking = require('../models/Booking');
const Job = require('../models/JobPost');
const { protect } = require('../middleware/auth');

// --- CLOUDINARY CONFIGURATION ---
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'worker_proofs',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

const upload = multer({ storage: storage });
// ----------------------------

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
        const { status } = req.body;

        const booking = await Booking.findByIdAndUpdate(
            bookingId,
            { status: status },
            { returnDocument: 'after' } // Fixed Mongoose warning
        );

        if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

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
            { returnDocument: 'after' } // Fixed Mongoose warning
        );

        res.json({ success: true, booking });
    } catch (error) {
        console.error("Image Upload Error:", error);
        res.status(500).json({ success: false, message: "Upload failed" });
    }
});

// POST /api/bookings/:bookingId/upload-proof
router.post('/:bookingId/upload-proof', protect, upload.array('images'), async (req, res) => {
    try {
        const { bookingId } = req.params;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, msg: "No files uploaded" });
        }

        // CloudinaryStorage automatically provides the full URL in 'path'
        const imageUrls = req.files.map(file => file.path);

        // Update the database
        const booking = await Booking.findByIdAndUpdate(
            bookingId,
            { $push: { attachments: { $each: imageUrls } } },
            { returnDocument: 'after' } // Fixed Mongoose warning
        );

        res.json({ success: true, booking });
    } catch (error) {
        console.error("Upload Error:", error);
        res.status(500).json({ success: false, msg: "Server error during upload" });
    }
});

module.exports = router;
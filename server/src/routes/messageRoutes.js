const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// GET history for a specific booking
router.get('/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;

        // ✅ ADD THIS VALIDATION (VERY IMPORTANT)
        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            console.error(`❌ Invalid bookingId: ${bookingId}`);
            return res.status(400).json({
                success: false,
                message: "Invalid bookingId"
            });
        }

        const messages = await Message.find({ bookingId })
            .sort({ createdAt: 1 });

        res.json({ success: true, messages });

    } catch (error) {
        console.error("🔥 Server Error:", error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
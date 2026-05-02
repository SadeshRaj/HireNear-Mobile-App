const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        bookingId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Booking'
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        text: {
            type: String,
            required: false
        },
        image: { type: String, required: false },
        location: {
            lat: { type: Number },
            lng: { type: Number }
        }
    },
    { timestamps: true }
);

// 🔥 THIS LINE IS CRITICAL
module.exports = mongoose.model('Message', messageSchema);
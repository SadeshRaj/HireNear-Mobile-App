const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    jobID: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPost', required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bidID: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid', required: true },
    status: {
        type: String,
        enum: ['Pending', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    scheduledDate: { type: Date },
    completionDate: { type: Date },
    attachments: [{ type: String }],
    createdAt: { type: Date, default: Date.now },

    // Inside your Booking.js Schema
    completionImages: {
        type: [String], // Array of strings for Cloudinary URLs
        default: []
    },
    completedAt: {
        type: Date
    }
});

module.exports = mongoose.model('Booking', BookingSchema);
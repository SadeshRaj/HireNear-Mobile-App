const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    // Naming NORM: We use 'jobId' and 'bidId' (lowercase 'd') to match the team's standards
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPost', required: true },
    bidId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid', required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    // Status NORM: Lowercase is safer for frontend comparisons
    status: {
        type: String,
        enum: ['pending', 'scheduled', 'in-progress', 'completed', 'cancelled'],
        default: 'scheduled'
    },

    price: Number,
    scheduledDate: { type: Date, default: Date.now },

    // Combined Image Logic:
    // 'attachments' is the team's field. We will use this for your Cloudinary URLs
    // to keep the "Active Jobs" screen compatible.
    attachments: [String],

    // Your specific Completion Tracking
    completedAt: { type: Date }

}, {
    // This is the team's preferred way to handle 'createdAt' and 'updatedAt'
    timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
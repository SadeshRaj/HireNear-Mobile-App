const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bidId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid', required: true },
    status: {
        type: String,
        enum: ['Pending', 'Scheduled', 'In Progress', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    scheduledDate: { type: Date },
    completionDate: { type: Date },
    attachments: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
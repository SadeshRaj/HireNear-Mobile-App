const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPost', required: true },
    bidId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid', required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, default: 'scheduled' },
    price: Number,
    scheduledDate: { type: Date, default: Date.now },
    attachments: [String],
    reviewId: {type: mongoose.Schema.Types.ObjectId, ref: 'Review', default: null}
}, { timestamps: true }); // This automatically adds createdAt and updatedAt

module.exports = mongoose.model('Booking', bookingSchema);
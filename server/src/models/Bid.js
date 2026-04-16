const mongoose = require('mongoose');

const BidSchema = new mongoose.Schema({
    jobId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JobPost',
        required: true
    },
    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: [1, 'Price must be at least 1']
    },
    message: {
        type: String,
        default: ''
    },
    estimatedTime: {
        type: String,
        default: ''
    },
    attachments: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
        default: 'pending'
    },
    // Pre-calculated distance from worker to job at bid time (km)
    distance: {
        type: Number,
        default: null
    }
}, { timestamps: true });

// One active bid per worker per job
BidSchema.index({ jobId: 1, workerId: 1 }, { unique: true });

module.exports = mongoose.model('Bid', BidSchema);

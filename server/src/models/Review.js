 const mongoose =require ('mongoose');

const reviewSchema = new mongoose.Schema ({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Booking',
        required: true
    },

    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    workerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },

    comment: {
        type: String,
        required: true,
        trim: true,
    },

    images: [{
        type: String
    }]

}, { timestamps: true });

module.exports = mongoose.model ('Review', reviewSchema);
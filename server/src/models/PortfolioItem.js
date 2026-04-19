const mongoose = require('mongoose');

const PortfolioItemSchema = new mongoose.Schema({
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    images: [{ type: String }], // Array of Cloudinary URLs
    location: {
        address: { type: String },
        lat: { type: Number },
        lng: { type: Number }
    }
}, { timestamps: true });

module.exports = mongoose.model('PortfolioItem', PortfolioItemSchema);
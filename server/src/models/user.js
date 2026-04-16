const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    // Matches your new requirement for Client and Worker
    role: {
        type: String,
        enum: ['Client', 'Worker'],
        required: true
    },
    // New field for SMS verification
    phone: {
        type: String,
        required: true
    },
    // OTP Management
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String,
        default: null
    },
    // GeoJSON Location
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: true
        }
    },
    // Profile & Social Fields
    profileImage: {
        type: String,
        default: ""
    },
    skills: {
        type: [String],
        default: []
    },
    bio: {
        type: String,
        default: ""
    },
    rating: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Essential for nearby searching
UserSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('User', UserSchema);
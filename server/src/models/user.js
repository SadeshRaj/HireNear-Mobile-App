const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // ADDED 'Admin' to the enum below
    role: { type: String, enum: ['Client', 'Worker', 'Admin'], required: true },
    phone: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, default: null },

    expireAt: {
        type: Date,
        default: null,
        index: { expires: 300 }
    },

    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: false } // Made false so Admins don't strictly need a location
    },
    profileImage: { type: String, default: "" },
    skills: { type: [String], default: [] },
    bio: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
}, { timestamps: true });

UserSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('User', UserSchema);
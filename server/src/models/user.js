const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
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
        coordinates: { type: [Number], required: false }
    },

    // Updated Profile Fields
    profileImage: { type: String, default: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fallback" },
    skills: { type: [String], default: [] },
    bio: { type: String, default: "No description provided yet." },
    status: { type: String, enum: ['Available', 'Working', 'Offline'], default: 'Available' }, // Added Status

    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
}, { timestamps: true });

UserSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('User', UserSchema);
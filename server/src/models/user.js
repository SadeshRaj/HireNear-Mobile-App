const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['Client', 'Worker'], required: true },
    phone: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    otp: { type: String, default: null },

    // This field controls the auto-deletion
    // It will automatically delete the document 300 seconds (5 mins) after the date in this field
    expireAt: {
        type: Date,
        default: null,
        index: { expires: 300 }
    },

    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true }
    },
    profileImage: { type: String, default: "" },
    skills: { type: [String], default: [] },
    bio: { type: String, default: "" },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
}, { timestamps: true });

UserSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('User', UserSchema);
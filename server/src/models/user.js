const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Updated enum to your new naming convention
    role: {
        type: String,
        enum: ['Client', 'Worker'],
        required: true
    },

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

    phone: { type: String },
    skills: { type: [String] },
    bio: { type: String },
}, { timestamps: true });

// This index is what makes the location data "searchable" later
UserSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('User', UserSchema);
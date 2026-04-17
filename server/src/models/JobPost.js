const mongoose = require('mongoose');

const JobPostSchema = new mongoose.Schema({
    // CHANGED: type is now String instead of ObjectId
    clientId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    budget: { type: Number, required: true },
    deadline: { type: Date, required: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true }
    },
    images: [{ type: String }],
    status: { type: String, enum: ['open', 'closed', 'completed'], default: 'open' }
}, { timestamps: true });

JobPostSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('JobPost', JobPostSchema, 'job_posts');
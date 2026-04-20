const mongoose = require('mongoose');

const JobPostSchema = new mongoose.Schema({
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: [true, 'Job title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: ['Plumbing', 'Electrical', 'Cleaning', 'Repairs', 'Carpentry', 'Painting', 'Landscaping', 'Other']
    },
    budget: {
        type: Number,
        required: [true, 'Budget is required'],
        min: [1, 'Budget must be at least 1']
    },
    deadline: {
        type: Date,
        required: [true, 'Deadline is required']
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            required: [true, 'Location is required']
        }
    },
    images: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ['open', 'closed', 'completed'],
        default: 'open'
    }
}, { timestamps: true });

// Enable geo queries (workers find nearby jobs)
JobPostSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('JobPost', JobPostSchema, 'job_posts');

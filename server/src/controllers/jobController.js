const JobPost = require('../models/JobPost');
const { cloudinary } = require('../middleware/upload');

exports.createJobPost = async (req, res) => {
    try {
        const { clientId, title, description, category, budget, deadline, longitude, latitude } = req.body;

        // 1. Upload images to Cloudinary
        const imagePromises = req.files.map(file =>
            new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'job_posts' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result.secure_url);
                    }
                );
                uploadStream.end(file.buffer);
            })
        );

        const uploadedImages = await Promise.all(imagePromises);

        // 2. Create Job Post
        const newJob = new JobPost({
            clientId, // Mongoose converts string ID to ObjectId automatically
            title,
            description,
            category,
            budget: Number(budget),
            deadline: new Date(deadline),
            location: {
                type: 'Point',
                coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            images: uploadedImages,
            status: 'open'
        });

        await newJob.save();
        res.status(201).json({ success: true, message: "Job posted successfully!", job: newJob });

    } catch (error) {
        console.error("Job Creation Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// controllers/jobController.js
exports.getMyJobs = async (req, res) => {
    try {
        const { userId } = req.params;
        // We find all jobs where clientId matches the logged-in user
        const jobs = await JobPost.find({ clientId: userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching jobs" });
    }
};
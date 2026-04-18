const JobPost = require('../models/JobPost');
const Bid = require('../models/Bid');

// ─── POST /api/jobs ──────────────────────────────────────────────────────────
// Client creates a new job (with optional image uploads)
exports.createJob = async (req, res) => {
    try {
        const { title, description, category, budget, deadline, location } = req.body;

        if (!title || !description || !category || !budget || !deadline || !location) {
            return res.status(400).json({ msg: 'All fields are required' });
        }

        // Parse location if sent as JSON string (from FormData)
        let parsedLocation = location;
        if (typeof location === 'string') {
            parsedLocation = JSON.parse(location);
        }

        const images = req.files ? req.files.map(f => f.path) : [];

        const job = new JobPost({
            clientId: req.user._id,
            title,
            description,
            category,
            budget: Number(budget),
            deadline: new Date(deadline),
            location: parsedLocation,
            images
        });

        await job.save();
        res.status(201).json(job);
    } catch (err) {
        console.error('createJob error:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// ─── GET /api/jobs/my ────────────────────────────────────────────────────────
// Client views their own jobs (with bid count for each)
exports.getMyJobs = async (req, res) => {
    try {
        const jobs = await JobPost.find({ clientId: req.user._id }).sort({ createdAt: -1 });

        // Attach bid count to each job
        const jobsWithBidCount = await Promise.all(
            jobs.map(async (job) => {
                const bidCount = await Bid.countDocuments({
                    jobId: job._id,
                    status: { $ne: 'withdrawn' }
                });
                return { ...job.toObject(), bidCount };
            })
        );

        res.json(jobsWithBidCount);
    } catch (err) {
        console.error('getMyJobs error:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// ─── GET /api/jobs ────────────────────────────────────────────────────────────
// Worker browses all open jobs (fallback when no GPS location)
// Optional query params: category, minBudget, maxBudget
exports.getOpenJobs = async (req, res) => {
    try {
        const { category, minBudget, maxBudget } = req.query;
        const filter = { status: 'open' };

        if (category && category !== 'All') filter.category = category;
        if (minBudget || maxBudget) {
            filter.budget = {};
            if (minBudget) filter.budget.$gte = Number(minBudget);
            if (maxBudget) filter.budget.$lte = Number(maxBudget);
        }

        const jobs = await JobPost.find(filter)
            .sort({ createdAt: -1 })
            .populate('clientId', 'name');
        res.json(jobs);
    } catch (err) {
        console.error('getOpenJobs error:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};


// Worker finds open jobs near their location
// Query params: lng, lat, maxDistanceKm (default 10)
exports.getNearbyJobs = async (req, res) => {
    try {
        const { lng, lat, maxDistanceKm = 10, category, minBudget, maxBudget } = req.query;

        if (!lng || !lat) {
            return res.status(400).json({ msg: 'lng and lat are required query params' });
        }

        const filter = {
            status: 'open',
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
                    $maxDistance: parseFloat(maxDistanceKm) * 1000 // metres
                }
            }
        };

        if (category) filter.category = category;
        if (minBudget || maxBudget) {
            filter.budget = {};
            if (minBudget) filter.budget.$gte = Number(minBudget);
            if (maxBudget) filter.budget.$lte = Number(maxBudget);
        }

        const jobs = await JobPost.find(filter).populate('clientId', 'name phone');
        res.json(jobs);
    } catch (err) {
        console.error('getNearbyJobs error:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// ─── GET /api/jobs/:id ───────────────────────────────────────────────────────
exports.getJobById = async (req, res) => {
    try {
        const job = await JobPost.findById(req.params.id).populate('clientId', 'name phone');
        if (!job) return res.status(404).json({ msg: 'Job not found' });
        res.json(job);
    } catch (err) {
        console.error('getJobById error:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// ─── PUT /api/jobs/:id ───────────────────────────────────────────────────────
// Client edits their job
exports.updateJob = async (req, res) => {
    try {
        const job = await JobPost.findById(req.params.id);
        if (!job) return res.status(404).json({ msg: 'Job not found' });

        if (job.clientId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const { title, description, category, budget, deadline } = req.body;
        if (title) job.title = title;
        if (description) job.description = description;
        if (category) job.category = category;
        if (budget) job.budget = Number(budget);
        if (deadline) job.deadline = new Date(deadline);

        if (req.files && req.files.length > 0) {
            job.images.push(...req.files.map(f => f.path));
        }

        await job.save();
        res.json(job);
    } catch (err) {
        console.error('updateJob error:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// ─── PATCH /api/jobs/:id/status ──────────────────────────────────────────────
// Client changes job status (open → closed)
exports.updateJobStatus = async (req, res) => {
    try {
        const job = await JobPost.findById(req.params.id);
        if (!job) return res.status(404).json({ msg: 'Job not found' });

        if (job.clientId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const { status } = req.body;
        if (!['open', 'closed'].includes(status)) {
            return res.status(400).json({ msg: 'Status must be open or closed' });
        }

        job.status = status;
        await job.save();
        res.json({ msg: `Job marked as ${status}`, job });
    } catch (err) {
        console.error('updateJobStatus error:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// ─── DELETE /api/jobs/:id ────────────────────────────────────────────────────
exports.deleteJob = async (req, res) => {
    try {
        const job = await JobPost.findById(req.params.id);
        if (!job) return res.status(404).json({ msg: 'Job not found' });

        if (job.clientId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        await job.deleteOne();
        // Also remove all bids on this job
        await Bid.deleteMany({ jobId: req.params.id });

        res.json({ msg: 'Job removed' });
    } catch (err) {
        console.error('deleteJob error:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

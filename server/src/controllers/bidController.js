const Bid = require('../models/Bid');
const Job = require('../models/JobPost');
const Booking = require('../models/Booking');

// ─── Helper: Haversine distance in km ───────────────────────────────────────
const haversineDistance = (coords1, coords2) => {
    const toRad = (val) => (val * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(coords2[1] - coords1[1]);
    const dLon = toRad(coords2[0] - coords1[0]);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(coords1[1])) *
        Math.cos(toRad(coords2[1])) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// ─── POST /api/bids ─────────────────────────────────────────────────────────
exports.submitBid = async (req, res) => {
    console.log("📥 Incoming Bid Request Body:", req.body);

    try {
        // 1. Authorization Check
        if (!req.user || !req.user._id) {
            console.log("❌ Auth Failed: req.user is missing");
            return res.status(401).json({ msg: 'Not authorized, user missing' });
        }

        const { jobId, price, message, estimatedTime, jobCoordinates } = req.body;

        // 2. Validation
        if (!jobId || !price) {
            return res.status(400).json({ msg: 'jobId and price are required' });
        }

        // 3. Duplicate Check
        const existing = await Bid.findOne({
            jobId,
            workerId: req.user._id,
            status: { $in: ['pending', 'accepted'] }
        });
        if (existing) return res.status(400).json({ msg: 'You already have an active bid on this job' });

        // 4. Distance Calculation
        let distance = null;
        try {
            const parsedCoords = typeof jobCoordinates === 'string' ? JSON.parse(jobCoordinates) : jobCoordinates;
            const workerLat = parseFloat(req.body.workerLat);
            const workerLng = parseFloat(req.body.workerLng);
            if (Array.isArray(parsedCoords) && parsedCoords.length === 2 && !isNaN(workerLat) && !isNaN(workerLng)) {
                const workerCoords = [workerLng, workerLat];
                const d = haversineDistance(workerCoords, parsedCoords);
                distance = isNaN(d) ? null : Math.round(d * 10) / 10;
            }
        } catch (e) {
            console.log("⚠️ Distance calculation skipped");
        }

        // 5. File Attachments
        const attachments = req.files ? req.files.map(f => f.path) : [];

        // 6. Save Bid
        const bid = new Bid({
            jobId,
            workerId: req.user._id, // Explicitly using req.user._id from protect middleware
            price: Number(price),
            message: message || '',
            estimatedTime: estimatedTime || '',
            attachments,
            distance
        });

        await bid.save();
        console.log("✅ Bid saved successfully for worker:", req.user._id);

        const populated = await bid.populate('workerId', 'name email phone skills bio');
        res.status(201).json(populated);
    } catch (err) {
        console.error('🔥 Server Error in submitBid:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// ─── GET /api/bids/job/:jobId ───────────────────────────────────────────────
exports.getBidsForJob = async (req, res) => {
    try {
        const bids = await Bid.find({
            jobId: req.params.jobId,
            status: { $ne: 'withdrawn' }
        }).populate('workerId', 'name email phone skills bio location');

        const sorted = bids.sort((a, b) => {
            const distA = a.distance ?? Infinity;
            const distB = b.distance ?? Infinity;
            if (distA !== distB) return distA - distB;
            return a.price - b.price;
        });

        const result = sorted.map(bid => ({
            ...bid.toObject(),
            isNearby: bid.distance !== null && bid.distance <= 5
        }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── GET /api/bids/my ──────────────────────────────────────────────────────
exports.getMyBids = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { workerId: req.user._id };
        if (status) filter.status = status;
        const bids = await Bid.find(filter).populate('jobId').sort({ createdAt: -1 });
        res.json(bids);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── PUT /api/bids/:bidId ───────────────────────────────────────────────────
exports.updateBid = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.bidId);
        if (!bid) return res.status(404).json({ msg: 'Bid not found' });

        if (bid.workerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const { price, message, estimatedTime } = req.body;
        if (price) bid.price = Number(price);
        if (message !== undefined) bid.message = message;
        if (estimatedTime !== undefined) bid.estimatedTime = estimatedTime;

        if (req.files && req.files.length > 0) {
            bid.attachments.push(...req.files.map(f => f.path));
        }

        await bid.save();
        res.json(bid);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── DELETE /api/bids/:bidId ────────────────────────────────────────────────
exports.withdrawBid = async (req, res) => {
    try {
        const bid = await Bid.findOneAndUpdate(
            { _id: req.params.bidId, workerId: req.user._id },
            { status: 'withdrawn' },
            { new: true }
        );
        if (!bid) return res.status(404).json({ msg: 'Bid not found' });
        res.json({ msg: 'Bid withdrawn successfully', bid });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── PATCH /api/bids/:bidId/accept ──────────────────────────────────────────
exports.acceptBid = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.bidId).populate('jobId');
        if (!bid) return res.status(404).json({ msg: 'Bid not found' });

        const job = await Job.findById(bid.jobId._id);
        if (!job) return res.status(404).json({ msg: 'Job not found' });

        // Update status
        bid.status = 'accepted';
        await bid.save();
        await Job.findByIdAndUpdate(bid.jobId._id, { status: 'booked' });

        // Create Booking
        const newBooking = new Booking({
            jobId: bid.jobId._id,
            bidId: bid._id,
            clientId: job.clientId,
            workerId: bid.workerId,
            price: bid.price,
            status: 'scheduled',
            scheduledDate: new Date()
        });
        await newBooking.save();

        // Reject other bids
        await Bid.updateMany(
            { jobId: bid.jobId._id, _id: { $ne: bid._id }, status: 'pending' },
            { status: 'rejected' }
        );

        res.json({ success: true, msg: 'Bid accepted!', bookingId: newBooking._id });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// ─── PATCH /api/bids/:bidId/reject ──────────────────────────────────────────
exports.rejectBid = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.bidId);
        if (!bid) return res.status(404).json({ msg: 'Bid not found' });
        bid.status = 'rejected';
        await bid.save();
        res.json({ msg: 'Bid rejected', bid });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};
const Bid = require('../models/Bid');
const Job = require('../models/JobPost'); // <--- STEP 1: IMPORT THE JOB MODEL
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Booking = require('../models/Booking'); // <--- ADD THIS

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

// ─── POST /api/bids  ─────────────────────────────────────────────────────────
// Worker submits a new bid on a job
exports.submitBid = async (req, res) => {
    try {
        const { jobId, price, message, estimatedTime, jobCoordinates } = req.body;

        if (!jobId || !price) {
            return res.status(400).json({ msg: 'jobId and price are required' });
        }

        // Prevent duplicate active bid (same worker, same job)
        const existing = await Bid.findOne({
            jobId,
            workerId: req.user._id,
            status: { $in: ['pending', 'accepted'] }
        });
        if (existing) {
            return res.status(400).json({ msg: 'You already have an active bid on this job' });
        }

        // Calculate distance if both job coords and worker's live GPS are available
        let distance = null;
        try {
            const parsedCoords = typeof jobCoordinates === 'string'
                ? JSON.parse(jobCoordinates)
                : jobCoordinates;

            const workerLat = parseFloat(req.body.workerLat);
            const workerLng = parseFloat(req.body.workerLng);

            if (Array.isArray(parsedCoords) && parsedCoords.length === 2 && !isNaN(workerLat) && !isNaN(workerLng)) {
                // GeoJSON coords are [lng, lat]; haversine expects same format
                const workerCoords = [workerLng, workerLat];
                const d = haversineDistance(workerCoords, parsedCoords);
                distance = isNaN(d) ? null : Math.round(d * 10) / 10;
            }
        } catch { /* coords malformed — leave distance as null */ }



        // Collect uploaded file paths
        const attachments = req.files ? req.files.map(f => f.path) : [];

        const bid = new Bid({
            jobId,
            workerId: req.user._id,
            price: Number(price),
            message: message || '',
            estimatedTime: estimatedTime || '',
            attachments,
            distance
        });

        await bid.save();
        const populated = await bid.populate('workerId', 'name email phone skills bio');
        res.status(201).json(populated);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ msg: 'You already have a bid on this job' });
        }
        console.error('submitBid error:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// ─── GET /api/bids/job/:jobId  ───────────────────────────────────────────────
// Client views all bids on their job, sorted by distance + price
exports.getBidsForJob = async (req, res) => {
    try {
        const bids = await Bid.find({
            jobId: req.params.jobId,
            status: { $ne: 'withdrawn' }
        }).populate('workerId', 'name email phone skills bio location');

        // Sort: nearby first, then by price ascending
        const sorted = bids.sort((a, b) => {
            const distA = a.distance ?? Infinity;
            const distB = b.distance ?? Infinity;
            if (distA !== distB) return distA - distB;
            return a.price - b.price;
        });

        // Add isNearby flag (within 5km)
        const result = sorted.map(bid => ({
            ...bid.toObject(),
            isNearby: bid.distance !== null && bid.distance <= 5
        }));

        res.json(result);
    } catch (err) {
        console.error('getBidsForJob error:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// ─── GET /api/bids/my  ──────────────────────────────────────────────────────
// Worker views their own bids
exports.getMyBids = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { workerId: req.user._id };
        if (status) filter.status = status;

        const bids = await Bid.find(filter)
            .populate('jobId', 'title description budget deadline status')
            .sort({ createdAt: -1 });

        res.json(bids);
    } catch (err) {
        console.error('getMyBids error:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// ─── PUT /api/bids/:bidId  ───────────────────────────────────────────────────
// Worker edits their pending bid
exports.updateBid = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.bidId);
        if (!bid) return res.status(404).json({ msg: 'Bid not found' });

        if (bid.workerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: 'Not authorized to edit this bid' });
        }
        if (bid.status !== 'pending') {
            return res.status(400).json({ msg: 'Can only edit a pending bid' });
        }

        const { price, message, estimatedTime } = req.body;
        if (price) bid.price = Number(price);
        if (message !== undefined) bid.message = message;
        if (estimatedTime !== undefined) bid.estimatedTime = estimatedTime;

        // Append any new file uploads
        if (req.files && req.files.length > 0) {
            bid.attachments.push(...req.files.map(f => f.path));
        }

        await bid.save();
        res.json(bid);
    } catch (err) {
        console.error('updateBid error:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// ─── DELETE /api/bids/:bidId  ────────────────────────────────────────────────
// Worker withdraws their bid (soft delete → status: withdrawn)
exports.withdrawBid = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.bidId);
        if (!bid) return res.status(404).json({ msg: 'Bid not found' });

        if (bid.workerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: 'Not authorized' });
        }
        if (bid.status !== 'pending') {
            return res.status(400).json({ msg: 'Can only withdraw a pending bid' });
        }

        bid.status = 'withdrawn';
        await bid.save();
        res.json({ msg: 'Bid withdrawn successfully', bid });
    } catch (err) {
        console.error('withdrawBid error:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// ─── PATCH /api/bids/:bidId/accept  ─────────────────────────────────────────
// Client accepts a bid → all other bids for that job become rejected
exports.acceptBid = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.bidId);
        if (!bid) return res.status(404).json({ msg: 'Bid not found' });
        if (bid.status !== 'pending') {
            return res.status(400).json({ msg: 'Can only accept a pending bid' });
        }

        // ✅ ADD THIS: Fetch the job
        const job = await Job.findById(bid.jobId);
        if (!job) return res.status(404).json({ msg: 'Job not found' });

        // Accept this bid
        bid.status = 'accepted';
        await bid.save();

        // Update job status
        await Job.findByIdAndUpdate(bid.jobId, { status: 'accepted' });

        // ✅ FIXED: Now job.clientId works
        const newBooking = new Booking({
            jobId: bid.jobId,
            bidId: bid._id,
            clientId: job.clientId, // now valid
            workerId: bid.workerId,
            price: bid.price,
            status: 'scheduled',
            scheduledDate: new Date(),
            attachments: []
        });

        await newBooking.save();

        // Reject all other pending bids for the same job
        await Bid.updateMany(
            { jobId: bid.jobId, _id: { $ne: bid._id }, status: 'pending' },
            { status: 'rejected' }
        );

        const populated = await bid.populate('workerId', 'name email phone');
        res.json({ msg: 'Bid accepted', bid: populated });

    } catch (err) {
        console.error('acceptBid error:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

// ─── PATCH /api/bids/:bidId/reject  ─────────────────────────────────────────
// Client rejects a specific bid
exports.rejectBid = async (req, res) => {
    try {
        const bid = await Bid.findById(req.params.bidId);
        if (!bid) return res.status(404).json({ msg: 'Bid not found' });
        if (bid.status !== 'pending') {
            return res.status(400).json({ msg: 'Can only reject a pending bid' });
        }

        bid.status = 'rejected';
        await bid.save();
        res.json({ msg: 'Bid rejected', bid });
    } catch (err) {
        console.error('rejectBid error:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

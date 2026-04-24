const Booking = require('../models/Booking');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Helper to upload proof images to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
            { folder: 'hirenear_proofs' },
            (error, result) => {
                if (result) resolve(result.secure_url);
                else reject(error);
            }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

// Get booking details by Job ID
exports.getBookingByJobId = async (req, res) => {
    try {
        const booking = await Booking.findOne({ jobId: req.params.jobId })
            .populate('clientId', 'name phone')
            .populate('workerId', 'name phone')
            .populate('jobId'); // Populate to get initial job attachments

        if (!booking) return res.status(404).json({ success: false, msg: 'Booking not found' });

        res.json({ success: true, booking });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};

// Update booking status (e.g., scheduled -> in-progress -> completed)
exports.updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findById(req.params.id)
            .populate('clientId', 'name phone')
            .populate('workerId', 'name phone')
            .populate('jobId');

        if (!booking) return res.status(404).json({ success: false, msg: 'Booking not found' });

        booking.status = status;
        await booking.save();

        res.json({ success: true, booking });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};

// Worker uploads before/after proof photos
exports.uploadProof = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('clientId', 'name phone')
            .populate('workerId', 'name phone')
            .populate('jobId');

        if (!booking) return res.status(404).json({ success: false, msg: 'Booking not found' });

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, msg: 'No images uploaded' });
        }

        // Upload all images to Cloudinary
        const imageUrls = await Promise.all(req.files.map(f => uploadToCloudinary(f.buffer)));

        // Add new URLs to the attachments array
        booking.attachments.push(...imageUrls);
        await booking.save();

        res.json({ success: true, booking });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};

// NEW: Worker views all bookings assigned to them (For the Active Jobs screen)
exports.getWorkerBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ workerId: req.user._id })
            .populate('jobId', 'title budget category')
            .populate('clientId', 'name phone')
            .sort({ createdAt: -1 });

        res.json({ success: true, bookings });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};
const Booking = require('../models/Booking');
const JobPost = require('../models/JobPost');
const User = require('../models/User');

// --- 1. Create a new booking ---
exports.createBooking = async (req, res) => {
    try {
        const { jobId, workerId, bidId, scheduledDate } = req.body;
        // Use req.user._id from your protect middleware fix
        const clientId = req.user._id || req.user.id;

        const newBooking = new Booking({
            jobId,
            bidId,
            workerId,
            clientId,
            scheduledDate: scheduledDate || new Date(),
            status: 'scheduled'
        });

        const savedBooking = await newBooking.save();
        res.status(201).json(savedBooking);
    } catch (error) {
        res.status(400).json({ message: "Validation failed", details: error.message });
    }
};

// --- 2. Fetch booking history ---
exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;

        const bookings = await Booking.find({
            $or: [{ clientId: userId }, { workerId: userId }]
        })
            .populate('jobId', 'title budget location')
            .populate('workerId', 'name phone')
            .populate('clientId', 'name phone')
            .sort({ updatedAt: -1 })
            .lean();

        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- 3. Get Worker Specific Bookings ---
exports.getWorkerBookings = async (req, res) => {
    try {
        const userId = req.user._id || req.user.id;
        const bookings = await Booking.find({ workerId: userId })
            .populate('jobId', 'title budget category location status')
            .populate('clientId', 'name phone')
            .sort({ createdAt: -1 });

        res.json({ success: true, bookings });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};

// --- 4. Get booking details by Job ID ---
exports.getBookingByJobId = async (req, res) => {
    try {
        const booking = await Booking.findOne({ jobId: req.params.jobId })
            .populate('clientId', 'name phone')
            .populate('workerId', 'name phone')
            .populate('jobId');

        if (!booking) return res.status(404).json({ success: false, msg: 'Booking not found' });
        res.json({ success: true, booking });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};

// --- 5. Update status (Generic) ---
exports.updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { new: true } // Standard Mongoose way to get updated doc
        ).populate('clientId workerId jobId');

        if (!booking) return res.status(404).json({ message: "Booking not found" });
        res.status(200).json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ message: "Update failed", error: error.message });
    }
};

// --- 6. COMPLETE BOOKING (Final Synchronized Logic) ---
exports.completeBooking = async (req, res) => {
    console.log(`🏁 Completion request received for Booking: ${req.params.id}`);

    try {
        const bookingId = req.params.id;
        const userId = req.user._id || req.user.id;

        // 1. Check if files exist (Multer puts them in req.files regardless of field name with .any())
        if (!req.files || req.files.length === 0) {
            console.log("❌ No files found in request");
            return res.status(400).json({ msg: "Please upload at least one proof image." });
        }

        // 2. Map Cloudinary URLs
        const imageUrls = req.files.map(file => file.path);
        console.log("📸 Images received from Cloudinary:", imageUrls);

        // 3. Update Booking & Job status
        const updatedBooking = await Booking.findOneAndUpdate(
            { _id: bookingId, workerId: userId },
            {
                $set: { status: 'completed', completedAt: new Date() },
                $push: { attachments: { $each: imageUrls } }
            },
            { new: true }
        ).lean();

        if (!updatedBooking) {
            return res.status(403).json({ msg: "Booking not found or unauthorized" });
        }

        // 4. Update JobPost to completed
        await JobPost.findByIdAndUpdate(updatedBooking.jobId, { status: 'completed' });

        console.log("✅ Booking marked as completed successfully");
        res.json({ success: true, booking: updatedBooking });

    } catch (error) {
        console.error("🔥 Controller Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// --- 7. Cancel Booking ---
exports.cancelBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user._id || req.user.id;
        const booking = await Booking.findById(bookingId);

        if (!booking) return res.status(404).json({ message: "Booking not found" });

        // Security check
        if (booking.clientId.toString() !== userId.toString() && booking.workerId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (booking.status === 'completed') {
            return res.status(400).json({ message: "Cannot cancel a job that is already completed." });
        }

        booking.status = 'cancelled';
        await booking.save();

        // Also free the job post back to 'pending' or 'cancelled'
        await JobPost.findByIdAndUpdate(booking.jobId, { status: 'pending' });

        res.status(200).json({ message: "Booking cancelled successfully", booking });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
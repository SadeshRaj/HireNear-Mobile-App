const Booking = require('../models/Booking');
const JobPost = require('../models/JobPost');
const User = require('../models/User');

// 1. Create a new booking
exports.createBooking = async (req, res) => {
    try {
        const { jobId, workerId, bidId, scheduledDate } = req.body;
        const clientId = req.user.id;

        const newBooking = new Booking({
            jobID: jobId,
            bidID: bidId,
            workerId: workerId,
            clientId: clientId,
            scheduledDate: scheduledDate || new Date(),
            status: 'Pending'
        });

        const savedBooking = await newBooking.save();
        console.log("✅ SUCCESS: Booking created:", savedBooking._id);
        res.status(201).json(savedBooking);
    } catch (error) {
        console.error("❌ CREATE BOOKING ERROR:", error.message);
        res.status(400).json({ message: "Validation failed", details: error.message });
    }
};

// 2. Fetch booking history
exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.user.id;

        const bookings = await Booking.find({
            $or: [{ clientId: userId }, { workerId: userId }]
        })
            .populate('jobID', 'title budget location')
            .populate('workerId', 'name phone')
            .populate('clientId', 'name phone')
            .sort({ updatedAt: -1 })
            .lean();

        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. Update status (Generic)
exports.updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;

        // FIXED: Using returnDocument to remove Mongoose warning
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status: status },
            { returnDocument: 'after' }
        );

        if (!booking) return res.status(404).json({ message: "Booking not found" });
        res.status(200).json(booking);
    } catch (error) {
        res.status(500).json({ message: "Update failed", error: error.message });
    }
};

// 4. Complete Booking with Proof
exports.completeBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user.id;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ msg: "No image uploaded" });
        }

        // Cloudinary provides the URL in .path or .secure_url
        // We ensure forward slashes just in case of local testing fallbacks
        const imageUrl = req.files[0].path.replace(/\\/g, '/');

        // FIXED: Using returnDocument to remove Mongoose warning
        const updatedBooking = await Booking.findOneAndUpdate(
            { _id: bookingId, workerId: userId },
            {
                $set: {
                    status: 'Completed',
                    completedAt: new Date()
                },
                $push: { completionImages: imageUrl }
            },
            { returnDocument: 'after', runValidators: true }
        ).lean();

        if (!updatedBooking) {
            return res.status(403).json({ msg: "Unauthorized or Booking not found" });
        }

        console.log(`✅ SUCCESS: Job ${bookingId} completed. Image stored at: ${imageUrl}`);
        res.json({ success: true, booking: updatedBooking });

    } catch (error) {
        console.error("❌ CompleteBooking Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// 5. Cancel Booking
exports.cancelBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user.id;

        const booking = await Booking.findById(bookingId);

        if (!booking) return res.status(404).json({ message: "Booking not found" });

        if (booking.clientId.toString() !== userId && booking.workerId.toString() !== userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        if (booking.status === 'Completed') {
            return res.status(400).json({ message: "Cannot cancel a completed job" });
        }

        booking.status = 'Cancelled';
        await booking.save();

        res.status(200).json({ message: "Booking cancelled successfully", booking });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const Booking = require('../models/Booking');
const Job = require('../models/Job'); // Add this line
const User = require('../models/User');

// Create a new booking (Simulates "Accept Bid")
exports.createBooking = async (req, res) => {
    try {
        const { jobId, clientId, workerId, bidId, scheduledDate } = req.body;
        const newBooking = new Booking({
            jobId, clientId, workerId, bidId, scheduledDate
        });
        const savedBooking = await newBooking.save();
        res.status(201).json(savedBooking);
    } catch (error) {
        res.status(500).json({ message: "Error creating booking", error: error.message });
    }
};

// Fetch booking history for the logged-in user
exports.getMyBookings = async (req, res) => {
    try {
        const userId = req.user.id; // From middleware
        const bookings = await Booking.find({
            $or: [{ clientId: userId }, { workerId: userId }]
        }).populate('jobId workerId clientId');

        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: "Error fetching bookings", error: error.message });
    }
};

// Update status (e.g., Pending -> In Progress -> Completed)
exports.updateBookingStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const updatedBooking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.status(200).json(updatedBooking);
    } catch (error) {
        res.status(500).json({ message: "Update failed", error: error.message });
    }
};
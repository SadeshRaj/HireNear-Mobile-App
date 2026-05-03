const User = require('../models/user');
const JobPost = require('../models/JobPost');
const Bid = require('../models/Bid');
const PortfolioItem = require('../models/PortfolioItem');
const Invoice = require('../models/Invoice');
const Review = require('../models/Review');
const Booking = require('../models/Booking');


exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getUserById = async (req, res) => {
    try {
        if (!req.params.id || req.params.id === 'undefined') {
            return res.status(400).json({ msg: 'Invalid user ID' });
        }
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ msg: 'User not found' });
        res.json(user);
    } catch (err) {
        console.error("getUserById error:", err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ msg: 'User not found' });

        user.accountStatus = req.body.accountStatus;
        await user.save();
        res.json({ msg: 'User account status updated', user });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.json({ msg: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deletePortfolio = async (req, res) => {
    try {
        await PortfolioItem.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Portfolio deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getAllJobs = async (req, res) => {
    try {
        const jobs = await JobPost.find().populate('clientId', 'name email').sort({ createdAt: -1 });
        res.json(jobs);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getAllBids = async (req, res) => {
    try {
        const bids = await Bid.find().populate('workerId', 'name email').populate('jobId', 'title description').sort({ createdAt: -1 });
        res.json(bids);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getAllPortfolios = async (req, res) => {
    try {
        const portfolios = await PortfolioItem.find().populate('workerId', 'name email').sort({ createdAt: -1 });
        res.json(portfolios);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

exports.getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find().populate('workerId', 'name email').populate('clientId', 'name email').sort({ createdAt: -1 });
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
};

// ==========================================
// DASHBOARD OVERVIEW AGGREGATION (UPDATED)
// ==========================================
exports.getDashboardOverview = async (req, res) => {
    try {
        // 1. TOP LEVEL METRICS
        const totalUsers = await User.countDocuments({ role: { $ne: 'Admin' } });
        const activeJobs = await JobPost.countDocuments({ status: 'Open' }); // Change 'Open' if your active status is different
        const totalBids = await Bid.countDocuments();

        // 2. TOP CATEGORIES (Groups jobs by category and counts them)
        const categoryData = await JobPost.aggregate([
            { $group: { _id: '$category', jobs: { $sum: 1 } } },
            { $project: { name: '$_id', jobs: 1, _id: 0 } },
            { $sort: { jobs: -1 } },
            { $limit: 5 }
        ]);

        // 3. RECENT ACTIVITY
        const recentJobs = await JobPost.find()
            .sort({ createdAt: -1 })
            .limit(4)
            .populate('clientId', 'name');

        const recentActivity = recentJobs.map(job => ({
            id: job._id,
            action: 'New job posted',
            user: job.clientId ? job.clientId.name : 'Unknown Client',
            time: new Date(job.createdAt).toLocaleDateString(),
            type: 'job'
        }));

        res.json({
            metrics: { totalUsers, activeJobs, totalBids },
            categoryData,
            recentActivity
        });

    } catch (err) {
        console.error("Overview Stats Error:", err);
        res.status(500).json({ error: 'Failed to fetch real database stats' });
    }
};

// ==========================================
// REVIEW MANAGEMENT
// ==========================================

exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find()
            .populate('clientId', 'name email profileImage')
            .populate('workerId', 'name email profileImage')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (err) {
        console.error("getAllReviews error:", err);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        // 1. Find the review first to get the Booking/Job info
        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, msg: 'Review not found' });
        }

        const bId = review.bookingId;

        // 2. Delete the actual review
        await Review.findByIdAndDelete(reviewId);

        // 3. UNLINK: Clear the reviewId from Booking and JobPost
        const booking = await Booking.findById(bId);
        if (booking) {
            booking.reviewId = null;
            await booking.save();

            const targetJobId = booking.jobId || booking.job;
            if (targetJobId) {
                // This sets the field back to null so the button turns RED
                await JobPost.findByIdAndUpdate(targetJobId, { reviewId: null });
                console.log("🗑️ Review unlinked from JobPost:", targetJobId);
            }
        }

        res.status(200).json({ success: true, msg: 'Review deleted successfully' });

    } catch (error) {
        console.error("Delete Review Error:", error);
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};
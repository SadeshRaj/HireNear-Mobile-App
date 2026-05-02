const Review = require('../models/Review');
const JobPost = require('../models/JobPost');
const Booking =require('../models/Booking');

// 1. CREATE REVIEW
exports.createReview = async (req, res) => {
    try {
        const { bookingId, clientId, workerId, rating, comment } = req.body;

        const images = req.files ? req.files.map(file => file.path) : (req.body.images || []);

        if (!bookingId || !clientId || !workerId || !rating || !comment) {
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }

        const newReview = new Review({
            bookingId,
            clientId,
            workerId,
            rating,
            comment,
            images
        });

        await newReview.save();

        const booking = await Booking.findById(req.body.bookingId);

        if (booking) {
            booking.reviewId = newReview._id;
            await booking.save();

            const jobId = booking.jobId || booking.job;
            if (jobId) {
                await JobPost.findByIdAndUpdate(jobId, { reviewId: newReview._id })
            }
        }

        res.status(201).json({
            success: true,
            msg: 'Review submitted successfully',
            review: newReview
        });

    } catch(err) {
        console.error("Create Review Error: ", err.message);
        res.status(500).json({ error: 'Server error while creating review' });
    }
};

// 2. GET WORKER REVIEWS
exports.getWorkerReviews = async (req, res) => {
    try {
        const { workerId } = req.params;
        const reviews = await Review.find({ workerId }).sort({ createdAt: -1 });

        // FIXED: Status 260 changed to 200 (OK)
        res.status(200).json({ reviews });

    } catch (err) {
        console.error("Fetch Review Error:", err.message);
        res.status(500).json({ error: 'Server error while fetching reviews' });
    }
};

exports.checkReviewStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const review = await Review.findOne({ bookingId });

        if (review) {
            return res.status(200).json({ exists: true, reviewId: review._id });
        }

        res.status(200).json({ exists: false });
    } catch (err) {
        console.error("Check Review Error:", err.message);
        res.status(500).json({ error: 'Server error while checking review' });
    }
};

exports.getSingleReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.reviewId);
        if (!review) {
            return res.status(404).json({ msg: "Review not found" });
        }
        res.status(200).json(review);
    } catch (err) {
        console.error("Get Single Review Error:", err.message);
        res.status(500).json({ error: 'Server error while fetching single review' });
    }
};

// 5. UPDATE REVIEW
exports.updateReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const reviewId = req.params.reviewId;

        // Find the review first to ensure it exists
        let review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ msg: 'Review not found' });
        }

        // Handle new images if Multer is used
        const newImages = req.files ? req.files.map(file => file.path) : [];
        const updatedImages = [...review.images, ...newImages];

        // Update the fields
        review.rating = rating || review.rating;
        review.comment = comment || review.comment;
        review.images = updatedImages;

        await review.save();

        res.status(200).json({
            msg: 'Review updated successfully',
            review
        });
    } catch (err) {
        console.error("Update Review Error:", err.message);
        res.status(500).json({ error: 'Server error while updating review' });
    }
};

// 6. DELETE REVIEW
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

        res.status(200).json({ success: true, msg: 'Review deleted and button reset' });

    } catch (error) {
        console.error("Delete Review Error:", error);
        res.status(500).json({ success: false, msg: 'Server error' });
    }
};
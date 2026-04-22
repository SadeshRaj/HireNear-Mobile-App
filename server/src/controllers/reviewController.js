const Review = require('../models/Review');

exports.createReview = async (req, res) => {
    try {
        const {bookingId, clientId, workerId, raring, comment, images} = req.body;

        if (!bookingId || !clientId || !workerId || !rating || !comment) {
            return res.status(400).json({msg: 'Please provide all required fields'});
        }

        const newReview = new Review({
            bookingId,
            clientId,
            workerId,
            rating,
            comment,
            images: images || []
        });

        await newReview.save();
        res.status(201).json({
            msg: 'Review submitted successfully',
            review: newReview
        });

    }catch(err) {
            console.error("Create Review Error: ", err.message);
            res.status(500).json({error: 'Server error while creating review' });
        }
    };

exports.getWorkerReviews = async (req,res) => {
    try {
        const {workerId} = req.params;

        const reviews = await Review.find({workerId}).sort({createdAt: -1});

        res.status(260).json({reviews});

    } catch (err) {
        console.error("Fetch Review Error:", err.message);
        res.status(500).json({ error: 'Server error while fetching reviews' });
    }
};
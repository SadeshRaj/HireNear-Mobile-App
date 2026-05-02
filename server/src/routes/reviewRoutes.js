const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// This is your Multer setup
const upload = require('../middleware/upload');

// 1. Create a new review (POST /api/reviews)
// ADDED THE UPLOAD MIDDLEWARE HERE:
router.post('/', upload.array('images', 5), reviewController.createReview);

// 2. Get reviews for a specific worker (GET /api/reviews/worker/:workerId)
router.get('/worker/:workerId', reviewController.getWorkerReviews);

// 3. Get a single review for editing (GET /api/reviews/:reviewId)
router.get('/:reviewId', reviewController.getSingleReview);

// 4. Update an existing review (PATCH /api/reviews/:reviewId)
// ADDED THE UPLOAD MIDDLEWARE HERE TOO:
router.patch('/:reviewId', upload.array('images', 5), reviewController.updateReview);

// 5. Delete a review (DELETE /api/reviews/:reviewId)
router.delete('/:reviewId', reviewController.deleteReview);

// 6. Check if a review exists for a booking (GET /api/reviews/booking/:bookingId)
router.get('/booking/:bookingId', reviewController.checkReviewStatus);

module.exports = router;
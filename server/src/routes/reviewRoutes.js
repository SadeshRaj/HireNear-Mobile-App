const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

// This is your Multer setup
const upload = require('../middleware/upload');
router.get('/worker/:workerId', reviewController.getWorkerReviews);

router.get('/booking/:bookingId', reviewController.checkReviewStatus);

router.post('/', upload.array('images', 5), reviewController.createReview);

router.get('/:reviewId', reviewController.getSingleReview);

router.patch('/:reviewId', upload.array('images', 5), reviewController.updateReview);

router.get('/booking/:bookingId', reviewController.checkReviewStatus);

router.delete('/:reviewId', reviewController.deleteReview);

module.exports = router;
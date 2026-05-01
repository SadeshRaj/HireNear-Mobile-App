const express = require ('express');
const router = express.Router();
const { createReview, getWorkerReviews } = require('../controllers/reviewController');

router.post('/', createReview);

router.get('/worker/workerId', getWorkerReviews);

module.exports = router;
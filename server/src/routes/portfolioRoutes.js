const express = require('express');
const router = express.Router();
const {
    createPortfolioItem,
    getWorkerPortfolio,
    updatePortfolioItem,
    deletePortfolioItem
} = require('../controllers/portfolioController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload'); // Uses the shared memoryStorage middleware

// Routes
router.post('/', protect, upload.array('images', 5), createPortfolioItem);
router.get('/', protect, getWorkerPortfolio);
router.get('/:workerId', protect, getWorkerPortfolio);
router.put('/:id', protect, upload.array('images', 5), updatePortfolioItem);
router.delete('/:id', protect, deletePortfolioItem);

module.exports = router;
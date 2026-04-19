const express = require('express');
const router = express.Router();
const { createPortfolioItem, getWorkerPortfolio, updatePortfolioItem, deletePortfolioItem } = require('../controllers/portfolioController');
const { protect } = require('../middleware/auth');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: { folder: 'hirenear_portfolio', allowedFormats: ['jpg', 'png', 'jpeg'] },
});
const upload = multer({ storage: storage });

router.post('/', protect, upload.array('images', 5), createPortfolioItem);
router.get('/', protect, getWorkerPortfolio);
router.get('/:workerId', protect, getWorkerPortfolio);
router.put('/:id', protect, upload.array('images', 5), updatePortfolioItem); // NEW EDIT ROUTE
router.delete('/:id', protect, deletePortfolioItem);

module.exports = router;
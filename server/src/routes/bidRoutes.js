const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { protect } = require('../middleware/authMiddleware');
const {
    submitBid,
    getBidsForJob,
    getMyBids,
    updateBid,
    withdrawBid,
    acceptBid,
    rejectBid
} = require('../controllers/bidController');

// ─── Multer Setup ────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads/bids');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|pdf|mp3|m4a|wav|webm/;
        const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
        if (allowed.test(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only images, PDFs, and audio files are allowed'));
        }
    }
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST   /api/bids            → Worker submits a bid (with optional file attachments)
router.post('/', protect, upload.array('attachments', 5), submitBid);

// GET    /api/bids/my         → Worker sees their own bids
router.get('/my', protect, getMyBids);

// GET    /api/bids/job/:jobId → Client sees all bids on their job
router.get('/job/:jobId', protect, getBidsForJob);

// PUT    /api/bids/:bidId     → Worker edits a pending bid
router.put('/:bidId', protect, upload.array('attachments', 5), updateBid);

// DELETE /api/bids/:bidId     → Worker withdraws their bid
router.delete('/:bidId', protect, withdrawBid);

// PATCH  /api/bids/:bidId/accept → Client accepts a bid
router.patch('/:bidId/accept', protect, acceptBid);

// PATCH  /api/bids/:bidId/reject → Client rejects a bid
router.patch('/:bidId/reject', protect, rejectBid);

module.exports = router;

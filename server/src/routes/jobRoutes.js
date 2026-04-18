const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { protect } = require('../middleware/auth');
const {
    createJob,
    getMyJobs,
    getOpenJobs,
    getNearbyJobs,
    getJobById,
    updateJob,
    updateJobStatus,
    deleteJob
} = require('../controllers/jobController');

// ─── Multer Setup (job images) ───────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads/jobs');
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
        const allowed = /jpeg|jpg|png|webp/;
        if (allowed.test(path.extname(file.originalname).toLowerCase().replace('.', ''))) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST   /api/jobs              → Client creates a job (with images)
router.post('/', protect, upload.array('images', 5), createJob);

// GET    /api/jobs              → Worker browses all open jobs (no location needed)
router.get('/', protect, getOpenJobs);

// GET    /api/jobs/my           → Client sees their own jobs (+ live bid count)
router.get('/my', protect, getMyJobs);

// GET    /api/jobs/nearby       → Worker finds jobs near them
router.get('/nearby', protect, getNearbyJobs);

// GET    /api/jobs/:id          → Get single job
router.get('/:id', protect, getJobById);

// PUT    /api/jobs/:id          → Client edits a job
router.put('/:id', protect, upload.array('images', 5), updateJob);

// PATCH  /api/jobs/:id/status   → Client opens/closes a job
router.patch('/:id/status', protect, updateJobStatus);

// DELETE /api/jobs/:id          → Client deletes a job
router.delete('/:id', protect, deleteJob);

module.exports = router;

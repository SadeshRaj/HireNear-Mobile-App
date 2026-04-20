const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const upload = require('../middleware/upload');

const { protect } = require('../middleware/auth');
const {
    createJob,
    getMyJobs,
    getMyJobsByUserId,
    getOpenJobs,
    getNearbyJobs,
    getJobById,
    updateJob,
    updateJobStatus,
    deleteJob
} = require('../controllers/jobController');

// ─── Routes ──────────────────────────────────────────────────────────────────

// POST   /api/jobs              → Client creates a job (with images)
router.post('/', protect, upload.array('images', 5), createJob);

// POST   /api/jobs/create  → Friend's CreateJobScreen alias (no auth header in that screen)
router.post('/create', upload.array('images', 5), createJob);

// GET    /api/jobs              → Worker browses all open jobs (no location needed)
router.get('/', protect, getOpenJobs);

// GET    /api/jobs/my           → Client sees their own jobs (+ live bid count)
router.get('/my', protect, getMyJobs);

// GET    /api/jobs/my-jobs/:userId → Friend's MyJobPostsScreen alias (no auth, userId in params)
router.get('/my-jobs/:userId', getMyJobsByUserId);

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

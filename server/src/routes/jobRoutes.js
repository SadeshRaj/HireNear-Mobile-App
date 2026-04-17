const express = require('express');
const router = express.Router();
const multer = require('multer');
const jobController = require('../controllers/jobController');

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// This route handles the POST request from your mobile app
// 'images' is the name of the field we will send from Frontend
router.post('/create', upload.array('images', 5), jobController.createJobPost);

module.exports = router;
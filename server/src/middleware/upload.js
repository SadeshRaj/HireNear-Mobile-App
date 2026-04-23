const multer = require('multer');

// We use memoryStorage so the file is held in RAM (buffer)
// instead of being saved to the local hard drive.
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
    fileFilter: (req, file, cb) => {
        // Optional: restrict file types
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    }
});

module.exports = upload;
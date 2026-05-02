const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const upload = require('../middleware/upload'); // adjust path if needed

const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});


/**
 * @route   PUT /api/messages/mark-read
 */
router.put('/mark-read', async (req, res) => {
    try {
        const { bookingId, userId } = req.body;

        if (!bookingId || !userId) {
            return res.status(400).json({ success: false, message: "IDs are required" });
        }

        if (!mongoose.Types.ObjectId.isValid(bookingId) || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid ID format" });
        }

        const result = await Message.updateMany(
            {
                bookingId: new mongoose.Types.ObjectId(bookingId),
                receiverId: new mongoose.Types.ObjectId(userId),
                isRead: false
            },
            { $set: { isRead: true } }
        );

        console.log(`📖 Success: Marked ${result.modifiedCount} messages as read`);
        res.json({ success: true, count: result.modifiedCount });
    } catch (error) {
        console.error("🔥 Backend Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// ✅ NEW: Upload chat image to Cloudinary
router.post('/upload-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: "No image provided" });

        const streamUpload = () => new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: 'hirenear_chat' },
                (error, result) => {
                    if (result) resolve(result.secure_url);
                    else reject(error);
                }
            );
            streamifier.createReadStream(req.file.buffer).pipe(stream);
        });

        const imageUrl = await streamUpload();
        res.json({ success: true, imageUrl });
    } catch (error) {
        console.error("Image upload error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});


/**
 * @route   GET /api/messages/conversations/:userId
 * ✅ MUST be above /:bookingId — otherwise Express treats "conversations" as a bookingId
 */
router.get('/conversations/:userId', async (req, res) => {
    try {
        console.log("🔍 userId received:", req.params.userId);
        const userId = new mongoose.Types.ObjectId(req.params.userId);

        const conversations = await Message.aggregate([
            // 1. Filter messages where the user is either sender or receiver
            {
                $match: {
                    $or: [{ senderId: userId }, { receiverId: userId }]
                }
            },

            // 2. Sort by newest first
            { $sort: { createdAt: -1 } },

            // 3. Group by bookingId
            {
                $group: {
                    _id: "$bookingId",
                    lastMessage: { $first: "$$ROOT" },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$receiverId", userId] },
                                        { $eq: ["$isRead", false] }
                                    ]
                                },
                                1, 0
                            ]
                        }
                    }
                }
            },

            // 4. Join with Bookings collection
            {
                $lookup: {
                    from: 'bookings',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'bookingInfo'
                }
            },
            { $unwind: "$bookingInfo" },

            // 4b. Join with JobPost to get the actual job title
            {
                $lookup: {
                    from: 'job_posts', // ✅ matches ref: 'JobPost' in your Booking model
                    localField: 'bookingInfo.jobId',
                    foreignField: '_id',
                    as: 'jobInfo'
                }
            },
            { $unwind: { path: "$jobInfo", preserveNullAndEmptyArrays: true } },

            // 5. Identify the other person
            {
                $addFields: {
                    otherPersonId: {
                        $cond: {
                            if: { $eq: ["$lastMessage.senderId", userId] },
                            then: "$lastMessage.receiverId",
                            else: "$lastMessage.senderId"
                        }
                    }
                }
            },

            // 6. Join with Users collection
            {
                $lookup: {
                    from: 'users',
                    localField: 'otherPersonId',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            { $unwind: "$userInfo" },

            // 7. Structure the final object
            {
                $project: {
                    _id: 1,
                    lastMessage: 1,
                    unreadCount: 1,
                    jobTitle: "$jobInfo.title",  // ✅ from jobInfo, not bookingInfo
                    otherUserName: "$userInfo.name",
                    otherUserId: "$userInfo._id"
                }
            },

            // 8. Final sort
            { $sort: { "lastMessage.createdAt": -1 } }
        ]);

        res.json({ success: true, conversations });

    } catch (error) {
        console.error("🔥 Conversation Fetch Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * @route   GET /api/messages/:bookingId
 * ✅ MUST be below /conversations/:userId
 */
router.get('/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(bookingId)) {
            return res.status(400).json({ success: false, message: "Invalid bookingId" });
        }

        const messages = await Message.find({ bookingId }).sort({ createdAt: 1 });
        res.json({ success: true, messages });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
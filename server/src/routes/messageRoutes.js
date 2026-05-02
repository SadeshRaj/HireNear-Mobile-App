const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

/**
 * @route   GET /api/messages/:bookingId
 * @desc    Get chat history for a specific job/booking
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

/**
 * @route   PUT /api/messages/mark-read
 * @desc    Mark all messages in a booking as read for the current user
 */
router.put('/mark-read', async (req, res) => {
    try {
        const { bookingId, userId } = req.body;

        // 1. Validate that we actually got strings
        if (!bookingId || !userId) {
            return res.status(400).json({ success: false, message: "IDs are required" });
        }

        // 2. Validate format before converting to ObjectId
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

/**
 * @route   GET /api/messages/conversations/:userId
 * @desc    Get the summary list of all chats (The "Messages" Tab)
 * Separates jobs even if they share the same worker/client.
 */
router.get('/conversations/:userId', async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.params.userId);

        const conversations = await Message.aggregate([
            // 1. Filter messages where the user is either sender or receiver
            {
                $match: {
                    $or: [{ senderId: userId }, { receiverId: userId }]
                }
            },

            // 2. Sort by newest first so the grouping grabs the most recent message
            { $sort: { createdAt: -1 } },

            // 3. Group by bookingId (Unique chat thread per job)
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

            // 4. Join with Bookings collection for Job Title
            {
                $lookup: {
                    from: 'bookings',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'bookingInfo'
                }
            },
            { $unwind: "$bookingInfo" },

            // 5. Identify the "Other Person" in the chat
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

            // 6. Join with Users collection for the Other Person's Name
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
                    _id: 1, // bookingId
                    lastMessage: 1,
                    unreadCount: 1,
                    jobTitle: "$bookingInfo.title",
                    otherUserName: "$userInfo.name",
                    otherUserId: "$userInfo._id"
                }
            },

            // 8. Final sort by latest activity
            { $sort: { "lastMessage.createdAt": -1 } }
        ]);

        res.json({ success: true, conversations });

    } catch (error) {
        console.error("🔥 Conversation Fetch Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
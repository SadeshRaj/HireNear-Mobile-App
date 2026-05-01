const SupportMessage = require('../models/SupportMessage');
const User = require('../models/user');

exports.getChatHistory = async (req, res) => {
    try {
        const userId = req.params.userId;
        const messages = await SupportMessage.find({
            $or: [
                { senderId: userId, receiverId: null },
                { senderId: null, receiverId: userId }
            ]
        }).sort({ createdAt: 1 });
        
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
};

exports.getAdminChatList = async (req, res) => {
    try {
        // Get unique users who have messaged support
        const messages = await SupportMessage.find().sort({ createdAt: -1 }).populate('senderId', 'name email profileImage').populate('receiverId', 'name email profileImage');
        
        const userMap = new Map();
        
        messages.forEach(msg => {
            const user = msg.isAdmin ? msg.receiverId : msg.senderId;
            if (user && user._id) {
                const userIdStr = user._id.toString();
                if (!userMap.has(userIdStr)) {
                    userMap.set(userIdStr, {
                        user,
                        lastMessage: msg.message || (msg.image ? '📷 Image' : ''),
                        timestamp: msg.createdAt,
                        unread: !msg.read && !msg.isAdmin ? 1 : 0
                    });
                } else if (!msg.read && !msg.isAdmin) {
                    userMap.get(userIdStr).unread += 1;
                }
            }
        });
        
        res.json(Array.from(userMap.values()));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch chat list' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { userId, isAdmin } = req.body;
        if (isAdmin) {
            await SupportMessage.updateMany({ senderId: userId, read: false }, { read: true });
        } else {
            await SupportMessage.updateMany({ receiverId: userId, isAdmin: true, read: false }, { read: true });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to mark as read' });
    }
};
exports.getUnreadCount = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isAdmin } = req.query;

        let query;
        if (isAdmin === 'true') {
            // Admin unread: messages sent by users (senderId exists, read is false)
            query = { receiverId: null, isAdmin: false, read: false };
        } else {
            // User unread: messages sent by admin to this user
            query = { receiverId: userId, isAdmin: true, read: false };
        }

        const count = await SupportMessage.countDocuments(query);
        res.json({ unreadCount: count });
    } catch (err) {
        console.error("Unread count error:", err);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
};

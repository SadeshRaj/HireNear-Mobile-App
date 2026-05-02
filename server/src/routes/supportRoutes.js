const express = require('express');
const router = express.Router();
const { getChatHistory, getAdminChatList, markAsRead, getUnreadCount } = require('../controllers/supportController');
const { protect, isAdmin } = require('../middleware/auth');

router.get('/history/:userId', protect, getChatHistory);
router.get('/admin/list', protect, isAdmin, getAdminChatList);
router.post('/read', protect, markAsRead);
// ADD THIS NEW ROUTE
router.get('/unread/:userId', protect, getUnreadCount);

module.exports = router;
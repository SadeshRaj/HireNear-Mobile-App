const mongoose = require('mongoose');

const SupportMessageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null means Admin sent it
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null means sending to Admin
    message: { type: String, default: '' },
    image: { type: String, default: null },
    isAdmin: { type: Boolean, default: false }, // true if sender is Admin
    read: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('SupportMessage', SupportMessageSchema);

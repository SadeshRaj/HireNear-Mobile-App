const Message = require('../models/Message');
const mongoose = require('mongoose');


const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('⚡ User connected:', socket.id);

        // Join a specific chat room based on bookingId
        socket.on('join_chat', (bookingId) => {
            socket.join(bookingId);
            console.log(`👤 User joined room: ${bookingId}`);
        });

        // Listen for new messages
        socket.on('send_message', async (data) => {
            try {
                const { bookingId, senderId, receiverId, message, image, location } = data;

                const newMessage = new Message({
                    bookingId,
                    senderId,
                    receiverId,
                    text: message || "",   // ✅ fallback prevents crash
                    image: image || null,
                    location: location || null
                });

                await newMessage.save();

                io.to(bookingId).emit('receive_message', newMessage);

            } catch (error) {
                console.error("Socket Error:", error);
            }
        });


        socket.on('mark_as_read', async ({ bookingId, userId }) => {
            try {
                await Message.updateMany(
                    {
                        bookingId: new mongoose.Types.ObjectId(bookingId),  // ✅ cast
                        receiverId: new mongoose.Types.ObjectId(userId),    // ✅ cast
                        isRead: false
                    },
                    { $set: { isRead: true } }
                );
                io.to(bookingId).emit('messages_marked_read', { bookingId, userId });
            } catch (error) {
                console.error("Read status error:", error);
            }
        });


        socket.on('disconnect', () => {
            console.log('👻 User disconnected');
        });
    });
};

module.exports = socketHandler;
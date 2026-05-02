const Message = require('../models/Message');

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
                // Update all messages in this booking where the current user is the receiver
                await Message.updateMany(
                    { bookingId, receiverId: userId, isRead: false },
                    { $set: { isRead: true } }
                );

                // Notify the room so the sender sees a "read" receipt (optional)
                io.to(bookingId).emit('messages_marked_read', { bookingId, userId });
                console.log(`📖 Messages marked read for user ${userId} in ${bookingId}`);
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
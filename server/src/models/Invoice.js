const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
    description: { type: String, required: true },
    amount: { type: Number, required: true }
});

const invoiceSchema = new mongoose.Schema({
    bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [invoiceItemSchema],
    totalAmount: { type: Number, required: true },
    paymentSlipUrl: { type: String, default: null },
    // ADDED: 'verifying' state for the two-step payment approval
    status: { type: String, enum: ['pending', 'verifying', 'paid'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
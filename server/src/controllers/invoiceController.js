const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const Job = require('../models/JobPost');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        let stream = cloudinary.uploader.upload_stream(
            { folder: 'hirenear_payments' },
            (error, result) => {
                if (result) resolve(result.secure_url);
                else reject(error);
            }
        );
        streamifier.createReadStream(fileBuffer).pipe(stream);
    });
};

exports.createInvoice = async (req, res) => {
    try {
        const { bookingId, items, totalAmount } = req.body;

        const existingInvoice = await Invoice.findOne({ bookingId });
        if (existingInvoice) return res.status(400).json({ success: false, msg: 'Invoice already exists.' });

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ success: false, msg: 'Booking not found' });

        const invoice = new Invoice({
            bookingId, workerId: req.user._id, clientId: booking.clientId, items, totalAmount
        });

        await invoice.save();
        res.status(201).json({ success: true, invoice });
    } catch (err) { res.status(500).json({ success: false, msg: err.message }); }
};

exports.getInvoiceByBooking = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ bookingId: req.params.bookingId })
            .populate('workerId', 'name phone')
            .populate('clientId', 'name');
        if (!invoice) return res.status(404).json({ success: false, msg: 'No invoice found' });
        res.json({ success: true, invoice });
    } catch (err) { res.status(500).json({ success: false, msg: err.message }); }
};

// CRUD: Update Invoice
exports.updateInvoice = async (req, res) => {
    try {
        const { items, totalAmount } = req.body;
        const invoice = await Invoice.findById(req.params.id).populate('workerId', 'name phone').populate('clientId', 'name');
        if (!invoice) return res.status(404).json({ success: false, msg: 'Not found' });
        if (invoice.status !== 'pending') return res.status(400).json({ success: false, msg: 'Cannot edit after payment process started' });

        invoice.items = items;
        invoice.totalAmount = totalAmount;
        invoice.isUpdated = true;
        await invoice.save();

        res.json({ success: true, invoice, msg: 'Invoice updated successfully' });
    } catch (err) { res.status(500).json({ success: false, msg: err.message }); }
};

// CRUD: Delete Invoice
exports.deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ success: false, msg: 'Not found' });
        if (invoice.status !== 'pending') return res.status(400).json({ success: false, msg: 'Cannot delete after payment process started' });

        await Invoice.findByIdAndDelete(req.params.id);
        res.json({ success: true, msg: 'Invoice deleted successfully' });
    } catch (err) { res.status(500).json({ success: false, msg: err.message }); }
};

exports.uploadPaymentSlip = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('workerId', 'name phone').populate('clientId', 'name');
        if (!invoice) return res.status(404).json({ success: false, msg: 'Invoice not found' });
        if (!req.file) return res.status(400).json({ success: false, msg: 'No image uploaded' });

        const slipUrl = await uploadToCloudinary(req.file.buffer);
        invoice.paymentSlipUrl = slipUrl;
        invoice.status = 'verifying';
        await invoice.save();
        res.json({ success: true, invoice, msg: 'Payment slip uploaded.' });
    } catch (err) { res.status(500).json({ success: false, msg: err.message }); }
};

exports.verifyPayment = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('workerId', 'name phone').populate('clientId', 'name');
        if (!invoice) return res.status(404).json({ success: false, msg: 'Invoice not found' });

        invoice.status = 'paid';
        await invoice.save();

        const booking = await Booking.findById(invoice.bookingId);
        if (booking && booking.jobId) await Job.findByIdAndUpdate(booking.jobId, { status: 'completed' });

        res.json({ success: true, invoice, msg: 'Payment verified.' });
    } catch (err) { res.status(500).json({ success: false, msg: err.message }); }
};

// NEW: Paid in Cash Flow
exports.markPaidInCash = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('workerId', 'name phone').populate('clientId', 'name');
        if (!invoice) return res.status(404).json({ success: false, msg: 'Invoice not found' });

        invoice.status = 'paid';
        invoice.paymentSlipUrl = 'CASH'; // Identifier for cash payments
        await invoice.save();

        const booking = await Booking.findById(invoice.bookingId);
        if (booking && booking.jobId) await Job.findByIdAndUpdate(booking.jobId, { status: 'completed' });

        res.json({ success: true, invoice, msg: 'Marked as paid in cash.' });
    } catch (err) { res.status(500).json({ success: false, msg: err.message }); }
};

exports.getWorkerEarnings = async (req, res) => {
    try {
        const invoices = await Invoice.find({ workerId: req.user._id, status: 'paid' }).populate('clientId', 'name').sort({ updatedAt: -1 });
        const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        res.json({ success: true, invoices, totalRevenue });
    } catch (err) { res.status(500).json({ success: false, msg: err.message }); }
};
const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const Job = require('../models/JobPost'); // IMPORTED JOB MODEL
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
        if (existingInvoice) {
            return res.status(400).json({ success: false, msg: 'An invoice already exists for this booking.' });
        }

        const booking = await Booking.findById(bookingId);
        if (!booking) return res.status(404).json({ success: false, msg: 'Booking not found' });

        const invoice = new Invoice({
            bookingId,
            workerId: req.user._id,
            clientId: booking.clientId,
            items,
            totalAmount
        });

        await invoice.save();
        res.status(201).json({ success: true, invoice });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};

exports.getInvoiceByBooking = async (req, res) => {
    try {
        const invoice = await Invoice.findOne({ bookingId: req.params.bookingId })
            .populate('workerId', 'name phone')
            .populate('clientId', 'name');

        if (!invoice) return res.status(404).json({ success: false, msg: 'No invoice found' });

        res.json({ success: true, invoice });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};

exports.uploadPaymentSlip = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ success: false, msg: 'Invoice not found' });

        if (!req.file) return res.status(400).json({ success: false, msg: 'No image uploaded' });

        const slipUrl = await uploadToCloudinary(req.file.buffer);

        invoice.paymentSlipUrl = slipUrl;
        invoice.status = 'verifying';
        await invoice.save();

        res.json({ success: true, invoice, msg: 'Payment slip uploaded, waiting for worker verification.' });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ success: false, msg: 'Invoice not found' });

        if (invoice.workerId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, msg: 'Not authorized to verify this payment.' });
        }

        invoice.status = 'paid';
        await invoice.save();

        // -> UPDATE JOB STATUS TO COMPLETED <-
        const booking = await Booking.findById(invoice.bookingId);
        if (booking && booking.jobId) {
            await Job.findByIdAndUpdate(booking.jobId, { status: 'completed' });
        }

        res.json({ success: true, invoice, msg: 'Payment verified and invoice closed.' });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};

exports.getWorkerEarnings = async (req, res) => {
    try {
        const invoices = await Invoice.find({ workerId: req.user._id, status: 'paid' })
            .populate('clientId', 'name')
            .sort({ updatedAt: -1 });

        const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        res.json({ success: true, invoices, totalRevenue });
    } catch (err) {
        res.status(500).json({ success: false, msg: err.message });
    }
};
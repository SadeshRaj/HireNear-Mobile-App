const express = require('express');
const router = express.Router();
const {
    createInvoice, getInvoiceByBooking, uploadPaymentSlip, getWorkerEarnings, verifyPayment, updateInvoice, deleteInvoice, markPaidInCash
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', protect, createInvoice);
router.get('/earnings', protect, getWorkerEarnings);
router.get('/booking/:bookingId', protect, getInvoiceByBooking);
router.post('/:id/pay', protect, upload.single('slip'), uploadPaymentSlip);
router.patch('/:id/verify', protect, verifyPayment);

// NEW CRUD & Cash Routes
router.patch('/:id', protect, updateInvoice);
router.delete('/:id', protect, deleteInvoice);
router.patch('/:id/cash', protect, markPaidInCash);

module.exports = router;
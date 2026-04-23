const express = require('express');
const router = express.Router();
const {
    createInvoice,
    getInvoiceByBooking,
    uploadPaymentSlip,
    getWorkerEarnings,
    verifyPayment
} = require('../controllers/invoiceController');
const { protect } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.post('/', protect, createInvoice);
router.get('/earnings', protect, getWorkerEarnings);
router.get('/booking/:bookingId', protect, getInvoiceByBooking);
router.post('/:id/pay', protect, upload.single('slip'), uploadPaymentSlip);
router.patch('/:id/verify', protect, verifyPayment);

module.exports = router;
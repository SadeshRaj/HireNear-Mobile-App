const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getAllJobs,
    getAllBids,
    getAllPortfolios,
    getAllInvoices,
    getUserById,
    updateUserStatus,
    deleteUser,
    deletePortfolio,
    getDashboardOverview // NEW: Imported the new function
} = require('../controllers/adminController');
const { protect, isAdmin } = require('../middleware/auth');

router.get('/overview', protect, isAdmin, getDashboardOverview); // NEW: The overview route

router.get('/users', protect, isAdmin, getAllUsers);
router.get('/users/:id', protect, isAdmin, getUserById);
router.put('/users/:id/status', protect, isAdmin, updateUserStatus);
router.delete('/users/:id', protect, isAdmin, deleteUser);
router.get('/jobs', protect, isAdmin, getAllJobs);
router.get('/bids', protect, isAdmin, getAllBids);
router.get('/portfolios', protect, isAdmin, getAllPortfolios);
router.delete('/portfolios/:id', protect, isAdmin, deletePortfolio);
router.get('/invoices', protect, isAdmin, getAllInvoices);

module.exports = router;
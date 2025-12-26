const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { authenticateToken, isAdmin } = require('../middleware');

// Admin only routes
router.get('/dashboard', authenticateToken, isAdmin, statisticsController.getDashboardStats);
router.get('/revenue/date-range', authenticateToken, isAdmin, statisticsController.getRevenueByDateRange);
router.get('/revenue/product', authenticateToken, isAdmin, statisticsController.getRevenueByProduct);
router.get('/revenue/report', authenticateToken, isAdmin, statisticsController.getRevenueReport);
router.get('/revenue/compare', authenticateToken, isAdmin, statisticsController.compareRevenue);

module.exports = router;


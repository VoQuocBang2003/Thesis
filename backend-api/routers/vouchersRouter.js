const express = require('express');
const router = express.Router();
const vouchersController = require('../controllers/vouchersController');
const { authenticateToken, isAdmin } = require('../middleware');

// Public routes
router.get('/active', vouchersController.getActiveVouchers);
router.get('/code/:code', vouchersController.getVoucherByCode);
router.post('/validate', vouchersController.validateVoucher);

// Admin routes
router.get('/', authenticateToken, isAdmin, vouchersController.getAllVouchers);
router.post('/', authenticateToken, isAdmin, vouchersController.createVoucher);
router.put('/:id', authenticateToken, isAdmin, vouchersController.updateVoucher);
router.delete('/:id', authenticateToken, isAdmin, vouchersController.deleteVoucher);

// Record usage (called when order is created)
router.post('/usage', vouchersController.recordVoucherUsage);

module.exports = router;


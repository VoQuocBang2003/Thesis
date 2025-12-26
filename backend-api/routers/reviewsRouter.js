const express = require('express');
const router = express.Router();
const reviewsController = require('../controllers/reviewsController');
const { authenticateToken, isAdmin } = require('../middleware');

// Public routes
router.get('/product/:bookId', reviewsController.getReviewsByProduct);
router.get('/user/:userId', reviewsController.getReviewsByUser);

// Admin routes (must be defined before generic routes to match correctly)
router.get('/', authenticateToken, isAdmin, reviewsController.getAllReviews);
router.put('/:id/approve', authenticateToken, isAdmin, reviewsController.approveReview);
router.delete('/:id/admin', authenticateToken, isAdmin, reviewsController.deleteReviewAdmin);

// Authenticated routes (generic routes after specific ones)
router.get('/order/:orderId/reviewable', authenticateToken, reviewsController.getReviewableProducts);
router.post('/', authenticateToken, reviewsController.createReview);
router.put('/:id', authenticateToken, reviewsController.updateReview);
router.delete('/:id', authenticateToken, reviewsController.deleteReview);

module.exports = router;


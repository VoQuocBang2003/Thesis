const router = require('express').Router();
const cartController = require('../controllers/cartController');

router.post('/', cartController.addToCart);
router.get('/:userId', cartController.getUserCart);
router.put('/', cartController.updateQuantity);
router.delete('/:userId/:bookId', cartController.removeFromCart);
router.delete('/:userId', cartController.clearCart);

module.exports = router;

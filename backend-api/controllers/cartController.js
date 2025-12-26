const cartService = require('../controllers/cartService');
const { createResponse } = require('../jsend');

exports.addToCart = async (req, res) => {
  const { user_id, book_id, quantity } = req.body;
  await cartService.addToCart(user_id, book_id, quantity);
  res.json(createResponse(true, null, 'Added to cart'));
};

exports.getUserCart = async (req, res) => {
  const { userId } = req.params;
  const cart = await cartService.getCartByUser(userId);
  res.json(createResponse(true, cart, 'Fetched cart'));
};

exports.updateQuantity = async (req, res) => {
  const { user_id, book_id, quantity } = req.body;
  await cartService.updateQuantity(user_id, book_id, quantity);
  res.json(createResponse(true, null, 'Updated quantity'));
};

exports.removeFromCart = async (req, res) => {
  const { userId, bookId } = req.params;
  await cartService.removeFromCart(userId, bookId);
  res.json(createResponse(true, null, 'Removed from cart'));
};

exports.clearCart = async (req, res) => {
  const { userId } = req.params;
  await cartService.clearCart(userId);
  res.json(createResponse(true, null, 'Cart cleared'));
};
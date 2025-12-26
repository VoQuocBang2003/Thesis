const db = require('../knexfile');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3100';

function formatBookImage(book) {
  if (!book.image) {
    return { ...book, image: '' };
  }
  return {
    ...book,
    image: book.image.startsWith("http") ? book.image : `${BASE_URL}${book.image}`
  };
}

exports.addToCart = async (userId, bookId, quantity) => {
  const existing = await db('carts')
    .where({ user_id: userId, book_id: bookId })
    .first();

  if (existing) {
    return db('carts')
      .where({ user_id: userId, book_id: bookId })
      .update({ quantity: existing.quantity + quantity });
  } else {
    return db('carts').insert({ user_id: userId, book_id: bookId, quantity });
  }
};

exports.getCartByUser = async (userId) => {
  const cartItems = await db('carts')
    .join('books', 'carts.book_id', 'books.id')
    .select('carts.*', 'books.title', 'books.image', 'books.price')
    .where('carts.user_id', userId);
  
  // Format image URLs
  return cartItems.map(item => ({
    ...item,
    book_id: item.book_id,
    image: item.image ? (item.image.startsWith("http") ? item.image : `${BASE_URL}${item.image}`) : ''
  }));
};

exports.updateQuantity = async (userId, bookId, quantity) => {
  return db('carts')
    .where({ user_id: userId, book_id: bookId })
    .update({ quantity });
};

exports.removeFromCart = async (userId, bookId) => {
  return db('carts')
    .where({ user_id: userId, book_id: bookId })
    .del();
};

exports.clearCart = async (userId) => {
  return db('carts').where({ user_id: userId }).del();
};

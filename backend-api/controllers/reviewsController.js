const db = require('../knexfile.js');
const { createResponse } = require('../jsend.js');

const reviewsController = {
  // Get reviews for a product
  getReviewsByProduct: async (req, res) => {
    try {
      const { bookId } = req.params;
      
      const reviews = await db('reviews')
        .select('reviews.*', 'users.username', 'users.image as user_image')
        .join('users', 'reviews.user_id', 'users.id')
        .where('reviews.book_id', bookId)
        .where('reviews.is_approved', true)
        .orderBy('reviews.created_at', 'desc');

      // Calculate average rating
      const avgRating = await db('reviews')
        .where('book_id', bookId)
        .where('is_approved', true)
        .avg('rating as avg')
        .first();

      res.status(200).json(createResponse(true, {
        reviews,
        averageRating: parseFloat(avgRating?.avg || 0),
        totalReviews: reviews.length
      }, 'Reviews retrieved successfully'));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, 'Error retrieving reviews'));
    }
  },

  // Get reviews by user
  getReviewsByUser: async (req, res) => {
    try {
      const { userId } = req.params;
      
      const reviews = await db('reviews')
        .select('reviews.*', 'books.title', 'books.image', 'books.price')
        .join('books', 'reviews.book_id', 'books.id')
        .where('reviews.user_id', userId)
        .orderBy('reviews.created_at', 'desc');

      res.status(200).json(createResponse(true, reviews, 'User reviews retrieved successfully'));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, 'Error retrieving user reviews'));
    }
  },

  // Get reviewable products from an order
  getReviewableProducts: async (req, res) => {
    try {
      const { orderId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json(createResponse(false, null, 'User ID is required'));
      }

      // Get order
      const order = await db('orders')
        .where('id', orderId)
        .where('user_id', userId)
        .first();

      if (!order) {
        return res.status(404).json(createResponse(false, null, 'Order not found'));
      }

      // Parse book_id to get list of books
      const bookIds = JSON.parse(order.book_id || '[]');
      const reviewableProducts = [];

      for (const item of bookIds) {
        let bookId, quantity;
        
        if (typeof item === 'object' && item.book_id && item.quantity) {
          bookId = item.book_id;
          quantity = item.quantity;
        } else if (typeof item === 'object' && item.id && item.quantity) {
          bookId = item.id;
          quantity = item.quantity;
        } else {
          bookId = item;
          quantity = 1;
        }

        const book = await db('books').where('id', bookId).first();
        if (book) {
          // Check if user has already reviewed this product for this order
          const existingReview = await db('reviews')
            .where('user_id', userId)
            .where('book_id', bookId)
            .where('order_id', orderId)
            .first();

          reviewableProducts.push({
            book: book,
            quantity: quantity,
            hasReviewed: !!existingReview,
            review: existingReview || null
          });
        }
      }

      res.status(200).json(createResponse(true, reviewableProducts, 'Reviewable products retrieved successfully'));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, 'Error retrieving reviewable products'));
    }
  },

  // Create review
  createReview: async (req, res) => {
    try {
      const { bookId, orderId, rating, comment } = req.body;
      const userId = req.user?.id;

      console.log('📝 Creating review:', { userId, bookId, orderId, rating, comment });
      console.log('👤 User from token:', req.user);

      // Validate required fields
      if (!userId) {
        console.error('❌ No userId from token');
        return res.status(401).json(createResponse(false, null, 'User authentication required'));
      }
      
      if (!bookId || !rating) {
        return res.status(400).json(createResponse(false, null, 'Book ID and rating are required'));
      }

      // Validate rating (1-5)
      if (rating < 1 || rating > 5) {
        return res.status(400).json(createResponse(false, null, 'Rating must be between 1 and 5'));
      }

      // Check if user has already reviewed this product for this order
      if (orderId) {
        const existing = await db('reviews')
          .where('user_id', userId)
          .where('book_id', bookId)
          .where('order_id', orderId)
          .first();

        if (existing) {
          return res.status(400).json(createResponse(false, null, 'You have already reviewed this product for this order'));
        }
      }

      // Check if user has purchased the product (verify order)
      if (orderId) {
        const order = await db('orders')
          .where('id', orderId)
          .where('user_id', userId)
          .first();

        if (!order) {
          return res.status(403).json(createResponse(false, null, 'You can only review products you have purchased'));
        }

        // Verify book is in the order
        const bookIds = JSON.parse(order.book_id || '[]');
        let bookInOrder = false;
        
        if (Array.isArray(bookIds)) {
          // Check if bookIds is array of numbers or array of objects
          bookInOrder = bookIds.some(item => {
            if (typeof item === 'number') {
              return item === parseInt(bookId);
            } else if (typeof item === 'object') {
              const itemBookId = item.book_id || item.id || item;
              return parseInt(itemBookId) === parseInt(bookId);
            }
            return false;
          });
        }
        
        if (!bookInOrder) {
          return res.status(403).json(createResponse(false, null, 'This product is not in your order'));
        }
      }

      const [id] = await db('reviews').insert({
        user_id: userId,
        book_id: bookId,
        order_id: orderId || null,
        rating,
        comment: comment || null,
        is_approved: true, // Auto-approve for now
      });

      // Update product average rating
      const avgRating = await db('reviews')
        .where('book_id', bookId)
        .where('is_approved', true)
        .avg('rating as avg')
        .first();

      const avg = parseFloat(avgRating?.avg || 0);
      const reviewCount = await db('reviews')
        .where('book_id', bookId)
        .where('is_approved', true)
        .count('id as count')
        .first();

      // Update book rating (if books table has rating fields)
      await db('books')
        .where('id', bookId)
        .update({
          rating: avg,
          ratingCount: parseInt(reviewCount?.count || 0)
        });

      const newReview = await db('reviews')
        .select('reviews.*', 'users.username', 'users.image as user_image')
        .join('users', 'reviews.user_id', 'users.id')
        .where('reviews.id', id)
        .first();

      res.status(201).json(createResponse(true, newReview, 'Review created successfully'));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, 'Error creating review'));
    }
  },

  // Update review
  updateReview: async (req, res) => {
    try {
      const { id } = req.params;
      const { rating, comment } = req.body;
      const userId = req.user?.id; // From auth middleware

      const review = await db('reviews').where('id', id).first();

      if (!review) {
        return res.status(404).json(createResponse(false, null, 'Review not found'));
      }

      // Check if user owns the review
      if (review.user_id !== userId) {
        return res.status(403).json(createResponse(false, null, 'You can only update your own reviews'));
      }

      const updateData = {};
      if (rating !== undefined) {
        if (rating < 1 || rating > 5) {
          return res.status(400).json(createResponse(false, null, 'Rating must be between 1 and 5'));
        }
        updateData.rating = rating;
      }
      if (comment !== undefined) {
        updateData.comment = comment;
      }

      await db('reviews').where('id', id).update(updateData);

      // Recalculate product rating
      const avgRating = await db('reviews')
        .where('book_id', review.book_id)
        .where('is_approved', true)
        .avg('rating as avg')
        .first();

      const avg = parseFloat(avgRating?.avg || 0);
      const reviewCount = await db('reviews')
        .where('book_id', review.book_id)
        .where('is_approved', true)
        .count('id as count')
        .first();

      await db('books')
        .where('id', review.book_id)
        .update({
          rating: avg,
          ratingCount: parseInt(reviewCount?.count || 0)
        });

      const updatedReview = await db('reviews')
        .select('reviews.*', 'users.username', 'users.image as user_image')
        .join('users', 'reviews.user_id', 'users.id')
        .where('reviews.id', id)
        .first();

      res.status(200).json(createResponse(true, updatedReview, 'Review updated successfully'));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, 'Error updating review'));
    }
  },

  // Delete review (user can delete own, admin can delete any)
  deleteReview: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id; // From auth middleware
      const userRole = req.user?.role; // From auth middleware

      const review = await db('reviews').where('id', id).first();

      if (!review) {
        return res.status(404).json(createResponse(false, null, 'Review not found'));
      }

      // Check if user owns the review or is admin
      const isAdmin = userRole === 'admin' || userRole === 'isAdmin';
      if (review.user_id !== userId && !isAdmin) {
        return res.status(403).json(createResponse(false, null, 'You can only delete your own reviews'));
      }

      const bookId = review.book_id;
      await db('reviews').where('id', id).del();

      // Recalculate product rating
      const avgRating = await db('reviews')
        .where('book_id', bookId)
        .where('is_approved', true)
        .avg('rating as avg')
        .first();

      const avg = parseFloat(avgRating?.avg || 0);
      const reviewCount = await db('reviews')
        .where('book_id', bookId)
        .where('is_approved', true)
        .count('id as count')
        .first();

      await db('books')
        .where('id', bookId)
        .update({
          rating: avg,
          ratingCount: parseInt(reviewCount?.count || 0)
        });

      res.status(200).json(createResponse(true, null, 'Review deleted successfully'));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, 'Error deleting review'));
    }
  },

  // Delete review (admin only - guaranteed admin access)
  deleteReviewAdmin: async (req, res) => {
    try {
      const { id } = req.params;

      const review = await db('reviews').where('id', id).first();

      if (!review) {
        return res.status(404).json(createResponse(false, null, 'Review not found'));
      }

      const bookId = review.book_id;
      await db('reviews').where('id', id).del();

      // Recalculate product rating
      const avgRating = await db('reviews')
        .where('book_id', bookId)
        .where('is_approved', true)
        .avg('rating as avg')
        .first();

      const avg = parseFloat(avgRating?.avg || 0);
      const reviewCount = await db('reviews')
        .where('book_id', bookId)
        .where('is_approved', true)
        .count('id as count')
        .first();

      await db('books')
        .where('id', bookId)
        .update({
          rating: avg,
          ratingCount: parseInt(reviewCount?.count || 0)
        });

      res.status(200).json(createResponse(true, null, 'Review deleted successfully'));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, 'Error deleting review'));
    }
  },

  // Get all reviews (admin)
  getAllReviews: async (req, res) => {
    try {
      const reviews = await db('reviews')
        .select('reviews.*', 'users.username', 'books.title as book_title')
        .join('users', 'reviews.user_id', 'users.id')
        .join('books', 'reviews.book_id', 'books.id')
        .orderBy('reviews.created_at', 'desc');

      res.status(200).json(createResponse(true, reviews, 'Reviews retrieved successfully'));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, 'Error retrieving reviews'));
    }
  },

  // Approve/Reject review (admin)
  approveReview: async (req, res) => {
    try {
      const { id } = req.params;
      const { is_approved } = req.body;

      const review = await db('reviews').where('id', id).first();

      if (!review) {
        return res.status(404).json(createResponse(false, null, 'Review not found'));
      }

      await db('reviews').where('id', id).update({ is_approved: is_approved === true || is_approved === 'true' });

      // Recalculate product rating
      const avgRating = await db('reviews')
        .where('book_id', review.book_id)
        .where('is_approved', true)
        .avg('rating as avg')
        .first();

      const avg = parseFloat(avgRating?.avg || 0);
      const reviewCount = await db('reviews')
        .where('book_id', review.book_id)
        .where('is_approved', true)
        .count('id as count')
        .first();

      await db('books')
        .where('id', review.book_id)
        .update({
          rating: avg,
          ratingCount: parseInt(reviewCount?.count || 0)
        });

      const updatedReview = await db('reviews')
        .select('reviews.*', 'users.username', 'books.title as book_title')
        .join('users', 'reviews.user_id', 'users.id')
        .join('books', 'reviews.book_id', 'books.id')
        .where('reviews.id', id)
        .first();

      res.status(200).json(createResponse(true, updatedReview, 'Review updated successfully'));
    } catch (err) {
      console.error(err);
      res.status(500).json(createResponse(false, null, 'Error updating review'));
    }
  },
};

module.exports = reviewsController;


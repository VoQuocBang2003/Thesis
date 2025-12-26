const express = require('express');
const router = express.Router();
const wishlistsController = require('../controllers/wishlistsController');

/**
 * @swagger
 * tags:
 *   name: Wishlists
 *   description: Wishlists management
 */

/**
 * @swagger
 * /api/wishlists:
 *   get:
 *     tags: [Wishlists]
 *     summary: Get all wishlists
 *     responses:
 *       200:
 *         description: A list of wishlists
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/wishlists/user/{user_id}:
 *   get:
 *     tags: [Wishlists]
 *     summary: Get wishlist by user ID
 *     parameters:
 *       - name: user_id
 *         in: path
 *         required: true
 *         description: The ID of the user
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of wishlists for the user
 *       404:
 *         description: No wishlists found for this user
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/wishlists:
 *   post:
 *     tags: [Wishlists]
 *     summary: Add a book to the wishlist
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               book_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Book added to wishlist successfully
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/wishlists/{id}:
 *   delete:
 *     tags: [Wishlists]
 *     summary: Remove a book from the wishlist
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the wishlist item
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Book removed from wishlist successfully
 *       404:
 *         description: Wishlist item not found
 *       500:
 *         description: Internal Server Error
 */

router.get('/user/:user_id', wishlistsController.getWishlistByUserId);
router.get('/', wishlistsController.getAllWishlists);
router.post('/', wishlistsController.addToWishlist);
router.post('/delete', wishlistsController.removeFromWishlist);

module.exports = router;

const express = require('express');
const router = express.Router();
const booksController = require('../controllers/booksController');
const { upload } = require('../middleware.js');

/**
 * @swagger
 * tags:
 *   name: Books
 *   description: Books management
 */

/**
 * @swagger
 * /api/books:
 *   get:
 *     tags: [Books]
 *     summary: Get all books
 *     responses:
 *       200:
 *         description: A list of books
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/books/{id}:
 *   get:
 *     tags: [Books]
 *     summary: Get book by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the book
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Book found
 *       404:
 *         description: Book not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/books:
 *   post:
 *     tags: [Books]
 *     summary: Create a new book
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               publisher:
 *                 type: string
 *               publicationYear:
 *                 type: integer
 *               genre:
 *                 type: string
 *               language:
 *                 type: string
 *               image:
 *                 type: string
 *               categories_id:
 *                 type: integer
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               StockQuantity:
 *                 type: integer
 *               Status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Book created successfully
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/books/{id}:
 *   put:
 *     tags: [Books]
 *     summary: Update book by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the book
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               author:
 *                 type: string
 *               publisher:
 *                 type: string
 *               publicationYear:
 *                 type: integer
 *               genre:
 *                 type: string
 *               language:
 *                 type: string
 *               image:
 *                 type: string
 *               categories_id:
 *                 type: integer
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               StockQuantity:
 *                 type: integer
 *               Status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Book updated successfully
 *       404:
 *         description: Book not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/books/{id}:
 *   delete:
 *     tags: [Books]
 *     summary: Delete book by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the book
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *       404:
 *         description: Book not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/books/search:
 *   get:
 *     tags: [Books]
 *     summary: Search books
 *     parameters:
 *       - name: query
 *         in: query
 *         required: true
 *         description: The search query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of books matching the search query
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/books/category/{categoryId}:
 *   get:
 *     tags: [Books]
 *     summary: Get books by category
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         description: The ID of the category
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Books retrieved by category successfully
 *       500:
 *         description: Internal Server Error
 */

router.get('/', booksController.getAllBooks);
router.get('/search', booksController.searchBooks);
router.get('/:id', booksController.getBookById);

router.put('/:id', upload.single('image'), booksController.updateBook);
router.post('/', upload.single('image'), booksController.createBook);
router.delete('/:id', booksController.deleteBook);

module.exports = router;


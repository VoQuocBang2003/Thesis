const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Orders management
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     tags: [Orders]
 *     summary: Get all orders
 *     responses:
 *       200:
 *         description: A list of orders
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get order by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the order
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order found
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags: [Orders]
 *     summary: Create a new order
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
 *               quantity:
 *                 type: integer
 *               total_price:
 *                 type: number
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created successfully
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/orders/{id}:
 *   put:
 *     tags: [Orders]
 *     summary: Update order by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the order
 *         schema:
 *           type: integer
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
 *               quantity:
 *                 type: integer
 *               total_price:
 *                 type: number
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order updated successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     tags: [Orders]
 *     summary: Delete order by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the order
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order deleted successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/orders/search:
 *   get:
 *     tags: [Orders]
 *     summary: Search orders
 *     parameters:
 *       - name: query
 *         in: query
 *         required: true
 *         description: The search query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of orders matching the search query
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/orders/user/{user_id}:
 *   get:
 *     tags: [Orders]
 *     summary: Get orders by user ID
 *     parameters:
 *       - name: user_id
 *         in: path
 *         required: true
 *         description: The ID of the user
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of orders for the user
 *       404:
 *         description: No orders found for this user
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/orders/cancel/{id}:
 *   put:
 *     tags: [Orders]
 *     summary: Cancel an order by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the order
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Order canceled successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal Server Error
 */

/**
 * @swagger
 * /api/orders/status/{id}:
 *   put:
 *     tags: [Orders]
 *     summary: Update order status by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the order
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       404:
 *         description: Order not found
 *       500:
 *         description: Internal Server Error
 */

// API cho frontend - lịch sử đơn hàng của user hiện tại
router.get('/my-orders', ordersController.getMyOrders);

router.put('/cancel/:id', ordersController.cancelOrder);
router.get('/user/:user_id', ordersController.getOrderByUserId);
router.get('/', ordersController.getAllOrders);
router.get('/search', ordersController.searchOrders);
router.get('/:id', ordersController.getOrderById);
router.post('/', ordersController.createOrder);
router.put('/:id', ordersController.updateOrder);
router.put('/status/:id', ordersController.updateOrderStatus);
router.delete('/:id', ordersController.deleteOrder);

module.exports = router;

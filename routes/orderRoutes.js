// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');
const { verifyToken, requireOwner, requireAdmin } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(verifyToken);

// Order management routes (Owner/Admin access)
router.get('/', requireAdmin, OrderController.getAllOrders);                    // Get all orders
router.get('/status/:status', requireAdmin, OrderController.getOrdersByStatus); // Get orders by status
router.get('/statistics', requireAdmin, OrderController.getOrderStatistics);    // Get order statistics
router.post('/', requireOwner, OrderController.createOrder);                    // Create new order
router.put('/:id/status', requireAdmin, OrderController.updateOrderStatus);     // Update order status
router.delete('/:id', requireOwner, OrderController.deleteOrder);               // Delete order

// Product routes
router.get('/products', requireAdmin, OrderController.getAllProducts);          // Get all products

module.exports = router;
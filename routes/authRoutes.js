const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const UserService = require('../services/UserService');

// Public routes
router.post('/login', AuthController.login);
router.post('/verify-token', AuthController.verifyToken);

// Protected routes
router.get('/profile', verifyToken, AuthController.getProfile);
router.post('/logout', verifyToken, AuthController.logout);

// Admin only routes
router.get('/users', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await UserService.getAllUsers();
    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users'
    });
  }
});

module.exports = router;
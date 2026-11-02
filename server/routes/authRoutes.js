const express = require('express');
const { register, login, logout, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);

// Dedicated role-protected test route for RBAC verification
router.get('/test-admin-only', protect, requireRole('ADMIN'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin access granted',
  });
});

module.exports = router;

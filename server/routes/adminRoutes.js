const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');

// All routes in this router require authentication and ADMIN role
router.use(protect);
router.use(requireRole('ADMIN'));

// Dashboard statistics
router.get('/dashboard/overview', adminController.getDashboardOverview);
router.get('/dashboard/user-growth', adminController.getUserGrowth);
router.get('/dashboard/project-stats', adminController.getProjectStats);
router.get('/dashboard/task-stats', adminController.getTaskStats);

// User management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.patch('/users/:id/status', adminController.updateUserStatus);
router.patch('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;

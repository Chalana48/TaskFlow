const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All notification routes require authentication
router.use(protect);

// 1. Static subpaths first (avoids conflict with :id)
router.get('/unread-count', (req, res) => notificationController.getUnreadCount(req, res));
router.get('/preferences', (req, res) => notificationController.getPreferences(req, res));
router.put('/preferences', (req, res) => notificationController.updatePreferences(req, res));
router.post('/check-deadlines', (req, res) => notificationController.checkDeadlines(req, res));
router.patch('/read-all', (req, res) => notificationController.markAllAsRead(req, res));

// 2. Collection root
router.get('/', (req, res) => notificationController.getNotifications(req, res));

// 3. Parameterized routes
router.patch('/:id/read', (req, res) => notificationController.markAsRead(req, res));
router.delete('/:id', (req, res) => notificationController.deleteNotification(req, res));

module.exports = router;

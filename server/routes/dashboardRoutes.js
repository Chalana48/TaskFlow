const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

// All dashboard endpoints require authentication
router.use(protect);

router.get('/overview', (req, res, next) => dashboardController.getOverview(req, res, next));
router.get('/projects', (req, res, next) => dashboardController.getProjectStatistics(req, res, next));
router.get('/tasks', (req, res, next) => dashboardController.getTaskStatistics(req, res, next));
router.get('/trends', (req, res, next) => dashboardController.getCompletionTrends(req, res, next));
router.get('/deadlines', (req, res, next) => dashboardController.getUpcomingDeadlines(req, res, next));
router.get('/activity', (req, res, next) => dashboardController.getRecentActivity(req, res, next));
router.get('/my-tasks', (req, res, next) => dashboardController.getMyTasks(req, res, next));

module.exports = router;

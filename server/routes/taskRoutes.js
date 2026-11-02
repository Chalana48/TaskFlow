const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// All task routes require authentication
router.use(protect);

// Tasks collection routes
router
  .route('/')
  .get((req, res, next) => taskController.getTasks(req, res, next))
  .post((req, res, next) => taskController.createTask(req, res, next));

// Single task entity routes
router
  .route('/:id')
  .get((req, res, next) => taskController.getTaskById(req, res, next))
  .put((req, res, next) => taskController.updateTask(req, res, next))
  .delete((req, res, next) => taskController.deleteTask(req, res, next));

// Status and assignee quick update endpoints
router.patch('/:id/status', (req, res, next) => taskController.updateTaskStatus(req, res, next));
router.patch('/:id/assignee', (req, res, next) => taskController.assignTask(req, res, next));

// Comments subresource endpoints
router.post('/:id/comments', (req, res, next) => taskController.addComment(req, res, next));
router.delete('/:id/comments/:commentId', (req, res, next) => taskController.deleteComment(req, res, next));

module.exports = router;

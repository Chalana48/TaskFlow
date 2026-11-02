const taskService = require('../services/taskService');

/**
 * Controller for Task Management endpoints
 */
class TaskController {
  /**
   * POST /api/tasks
   */
  async createTask(req, res, next) {
    try {
      const task = await taskService.createTask(req.body, req.user);
      return res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data: task,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/tasks
   */
  async getTasks(req, res, next) {
    try {
      const result = await taskService.getTasks(req.query, req.user);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/tasks/:id
   */
  async getTaskById(req, res, next) {
    try {
      const task = await taskService.getTaskById(req.params.id, req.user);
      return res.status(200).json({
        success: true,
        data: task,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/tasks/:id
   */
  async updateTask(req, res, next) {
    try {
      const task = await taskService.updateTask(req.params.id, req.body, req.user);
      return res.status(200).json({
        success: true,
        message: 'Task updated successfully',
        data: task,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/tasks/:id
   */
  async deleteTask(req, res, next) {
    try {
      await taskService.deleteTask(req.params.id, req.user);
      return res.status(200).json({
        success: true,
        message: 'Task deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/tasks/:id/assignee
   */
  async assignTask(req, res, next) {
    try {
      const { userId } = req.body;
      const task = await taskService.assignTask(req.params.id, userId, req.user);
      return res.status(200).json({
        success: true,
        message: 'Task assignee updated successfully',
        data: task,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/tasks/:id/status
   */
  async updateTaskStatus(req, res, next) {
    try {
      const { status } = req.body;
      const task = await taskService.updateTaskStatus(req.params.id, status, req.user);
      return res.status(200).json({
        success: true,
        message: 'Task status updated successfully',
        data: task,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/tasks/:id/comments
   */
  async addComment(req, res, next) {
    try {
      const { message } = req.body;
      const task = await taskService.addComment(req.params.id, message, req.user);
      return res.status(201).json({
        success: true,
        message: 'Comment added successfully',
        data: task,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/tasks/:id/comments/:commentId
   */
  async deleteComment(req, res, next) {
    try {
      const task = await taskService.deleteComment(req.params.id, req.params.commentId, req.user);
      return res.status(200).json({
        success: true,
        message: 'Comment deleted successfully',
        data: task,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TaskController();

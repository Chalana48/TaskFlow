const dashboardService = require('../services/dashboardService');

class DashboardController {
  /**
   * GET /api/dashboard/overview
   */
  async getOverview(req, res) {
    try {
      const data = await dashboardService.getOverview(req.user, req.query.projectId);
      return res.status(200).json({
        success: true,
        message: 'Dashboard overview retrieved successfully',
        data,
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: err.statusCode ? err.message : 'Unable to retrieve dashboard data',
      });
    }
  }

  /**
   * GET /api/dashboard/projects
   */
  async getProjectStatistics(req, res) {
    try {
      const data = await dashboardService.getProjectStatistics(req.user, req.query.projectId);
      return res.status(200).json({
        success: true,
        message: 'Project statistics retrieved successfully',
        data,
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: err.statusCode ? err.message : 'Unable to retrieve project statistics',
      });
    }
  }

  /**
   * GET /api/dashboard/tasks
   */
  async getTaskStatistics(req, res) {
    try {
      const data = await dashboardService.getTaskStatistics(req.user, req.query.projectId);
      return res.status(200).json({
        success: true,
        message: 'Task statistics retrieved successfully',
        data,
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: err.statusCode ? err.message : 'Unable to retrieve task statistics',
      });
    }
  }

  /**
   * GET /api/dashboard/trends
   */
  async getCompletionTrends(req, res) {
    try {
      const { period = 'weekly', projectId } = req.query;
      const data = await dashboardService.getCompletionTrend(req.user, period, projectId);
      return res.status(200).json({
        success: true,
        message: 'Completion trends retrieved successfully',
        data,
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: err.statusCode ? err.message : 'Unable to retrieve completion trends',
      });
    }
  }

  /**
   * GET /api/dashboard/deadlines
   */
  async getUpcomingDeadlines(req, res) {
    try {
      const { limit = 5, projectId } = req.query;
      const data = await dashboardService.getUpcomingDeadlines(req.user, limit, projectId);
      return res.status(200).json({
        success: true,
        message: 'Upcoming deadlines retrieved successfully',
        data,
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: err.statusCode ? err.message : 'Unable to retrieve upcoming deadlines',
      });
    }
  }

  /**
   * GET /api/dashboard/activity
   */
  async getRecentActivity(req, res) {
    try {
      const { limit = 10, projectId } = req.query;
      const data = await dashboardService.getRecentActivity(req.user, limit, projectId);
      return res.status(200).json({
        success: true,
        message: 'Recent activity retrieved successfully',
        data,
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: err.statusCode ? err.message : 'Unable to retrieve recent activity',
      });
    }
  }

  /**
   * GET /api/dashboard/my-tasks
   */
  async getMyTasks(req, res) {
    try {
      const { limit = 5, projectId } = req.query;
      const data = await dashboardService.getMyTasks(req.user, limit, projectId);
      return res.status(200).json({
        success: true,
        message: 'My tasks retrieved successfully',
        data,
      });
    } catch (err) {
      const statusCode = err.statusCode || 500;
      return res.status(statusCode).json({
        success: false,
        message: err.statusCode ? err.message : 'Unable to retrieve your tasks',
      });
    }
  }
}

module.exports = new DashboardController();

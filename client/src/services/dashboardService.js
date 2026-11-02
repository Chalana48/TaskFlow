import api from './api';

export const dashboardService = {
  /**
   * Get main overview statistics cards
   */
  async getOverview(projectId = '') {
    const params = projectId ? { projectId } : {};
    const res = await api.get('/dashboard/overview', { params });
    return res.data;
  },

  /**
   * Get project breakdown by status
   */
  async getProjectStatistics(projectId = '') {
    const params = projectId ? { projectId } : {};
    const res = await api.get('/dashboard/projects', { params });
    return res.data;
  },

  /**
   * Get task status and priority distribution
   */
  async getTaskStatistics(projectId = '') {
    const params = projectId ? { projectId } : {};
    const res = await api.get('/dashboard/tasks', { params });
    return res.data;
  },

  /**
   * Get task completion trend data
   */
  async getTrends(period = 'weekly', projectId = '') {
    const params = { period };
    if (projectId) params.projectId = projectId;
    const res = await api.get('/dashboard/trends', { params });
    return res.data;
  },

  /**
   * Get upcoming deadlines
   */
  async getUpcomingDeadlines(limit = 5, projectId = '') {
    const params = { limit };
    if (projectId) params.projectId = projectId;
    const res = await api.get('/dashboard/deadlines', { params });
    return res.data;
  },

  /**
   * Get recent system/project activities
   */
  async getRecentActivity(limit = 10, projectId = '') {
    const params = { limit };
    if (projectId) params.projectId = projectId;
    const res = await api.get('/dashboard/activity', { params });
    return res.data;
  },

  /**
   * Get my assigned active tasks
   */
  async getMyTasks(limit = 5, projectId = '') {
    const params = { limit };
    if (projectId) params.projectId = projectId;
    const res = await api.get('/dashboard/my-tasks', { params });
    return res.data;
  },
};

export default dashboardService;

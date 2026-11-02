import api from './api';

export const adminService = {
  /**
   * Get admin dashboard overview stats
   */
  async getOverview() {
    const res = await api.get('/admin/dashboard/overview');
    return res.data;
  },

  /**
   * Get user registration growth time-series data
   */
  async getUserGrowth(days = 30) {
    const res = await api.get('/admin/dashboard/user-growth', {
      params: { days },
    });
    return res.data;
  },

  /**
   * Get project breakdown by status and priority
   */
  async getProjectStats() {
    const res = await api.get('/admin/dashboard/project-stats');
    return res.data;
  },

  /**
   * Get task breakdown by status and priority
   */
  async getTaskStats() {
    const res = await api.get('/admin/dashboard/task-stats');
    return res.data;
  },

  /**
   * Search, filter and paginate all users
   */
  async getUsers(params = {}) {
    const res = await api.get('/admin/users', { params });
    return res.data;
  },

  /**
   * Get comprehensive details for a specific user
   */
  async getUserById(id) {
    const res = await api.get(`/admin/users/${id}`);
    return res.data;
  },

  /**
   * Change user role (USER, PROJECT_MANAGER, ADMIN)
   */
  async updateUserRole(id, role) {
    const res = await api.patch(`/admin/users/${id}/role`, { role });
    return res.data;
  },

  /**
   * Update user status (ACTIVE, SUSPENDED)
   */
  async updateUserStatus(id, status) {
    const res = await api.patch(`/admin/users/${id}/status`, { status });
    return res.data;
  },

  /**
   * Safely delete a user
   */
  async deleteUser(id) {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },
};

export default adminService;

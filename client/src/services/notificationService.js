import api from './api';

export const notificationService = {
  /**
   * Fetch authenticated user's notifications with pagination & filtering
   */
  async getNotifications(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.isRead !== undefined && params.isRead !== '') {
      query.append('isRead', params.isRead);
    }
    if (params.type) query.append('type', params.type);

    const queryString = query.toString();
    const endpoint = queryString ? `/notifications?${queryString}` : '/notifications';
    const response = await api.get(endpoint);
    return response.data;
  },

  /**
   * Fetch unread notification count
   */
  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(id) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  /**
   * Delete a single notification
   */
  async deleteNotification(id) {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  /**
   * Get user notification preferences
   */
  async getPreferences() {
    const response = await api.get('/notifications/preferences');
    return response.data;
  },

  /**
   * Update user notification preferences
   */
  async updatePreferences(preferences) {
    const response = await api.put('/notifications/preferences', preferences);
    return response.data;
  },
};

export default notificationService;

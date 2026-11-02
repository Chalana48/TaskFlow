import api from './api';

export const taskService = {
  /**
   * Fetch paginated & filtered tasks
   */
  async getTasks(params = {}) {
    const res = await api.get('/tasks', { params });
    return res.data;
  },

  /**
   * Fetch single task by ID
   */
  async getTaskById(id) {
    const res = await api.get(`/tasks/${id}`);
    return res.data;
  },

  /**
   * Create a new task
   */
  async createTask(data) {
    const res = await api.post('/tasks', data);
    return res.data;
  },

  /**
   * Update an existing task
   */
  async updateTask(id, data) {
    const res = await api.put(`/tasks/${id}`, data);
    return res.data;
  },

  /**
   * Delete a task
   */
  async deleteTask(id) {
    const res = await api.delete(`/tasks/${id}`);
    return res.data;
  },

  /**
   * Reassign a task to user
   */
  async assignTask(id, userId) {
    const res = await api.patch(`/tasks/${id}/assignee`, { userId });
    return res.data;
  },

  /**
   * Update task status (for Kanban drag & drop)
   */
  async updateTaskStatus(id, status) {
    const res = await api.patch(`/tasks/${id}/status`, { status });
    return res.data;
  },

  /**
   * Add a comment to task
   */
  async addComment(id, message) {
    const res = await api.post(`/tasks/${id}/comments`, { message });
    return res.data;
  },

  /**
   * Delete a comment from task
   */
  async deleteComment(id, commentId) {
    const res = await api.delete(`/tasks/${id}/comments/${commentId}`);
    return res.data;
  },
};

export default taskService;

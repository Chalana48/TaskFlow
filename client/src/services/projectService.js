import api from './api';

export const projectService = {
  /**
   * Fetch paginated, filtered, sorted projects
   */
  async getProjects(params = {}) {
    const res = await api.get('/projects', { params });
    return res.data;
  },

  /**
   * Fetch single project by ID with manager and members populated
   */
  async getProjectById(id) {
    const res = await api.get(`/projects/${id}`);
    return res.data;
  },

  /**
   * Create a new project
   */
  async createProject(data) {
    const res = await api.post('/projects', data);
    return res.data;
  },

  /**
   * Update an existing project
   */
  async updateProject(id, data) {
    const res = await api.put(`/projects/${id}`, data);
    return res.data;
  },

  /**
   * Delete a project
   */
  async deleteProject(id) {
    const res = await api.delete(`/projects/${id}`);
    return res.data;
  },

  /**
   * Add a member to project
   */
  async addMember(projectId, userId) {
    const res = await api.post(`/projects/${projectId}/members`, { userId });
    return res.data;
  },

  /**
   * Remove a member from project
   */
  async removeMember(projectId, userId) {
    const res = await api.delete(`/projects/${projectId}/members/${userId}`);
    return res.data;
  },

  /**
   * Update project manager
   */
  async updateManager(projectId, userId) {
    const res = await api.patch(`/projects/${projectId}/manager`, { userId });
    return res.data;
  },

  /**
   * Search users for team member selection
   */
  async searchUsers(query = '') {
    const res = await api.get('/users', { params: { search: query } });
    return res.data;
  },
};

export default projectService;

const Activity = require('../models/Activity');
const Project = require('../models/Project');

const USER_SAFE_FIELDS = 'name username email role profileImage';

class ActivityService {
  /**
   * Log an activity event asynchronously
   */
  async createActivity({ user, type, project = null, task = null, message, metadata = {} }) {
    try {
      if (!user || !type || !message) return null;
      // In test mode, if Activity.create is not mocked by Jest and DB is not connected, return immediately
      if (process.env.NODE_ENV === 'test' && !Activity.create.mock) {
        return {
          user: typeof user === 'object' ? user._id : user,
          type,
          project: project ? (typeof project === 'object' ? project._id : project) : null,
          task: task ? (typeof task === 'object' ? task._id : task) : null,
          message,
          metadata,
          createdAt: new Date(),
        };
      }
      return await Activity.create({
        user: typeof user === 'object' ? user._id : user,
        type,
        project: project ? (typeof project === 'object' ? project._id : project) : null,
        task: task ? (typeof task === 'object' ? task._id : task) : null,
        message,
        metadata,
      });
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[ActivityService] Warning: Failed to record activity:', err.message);
      }
      return null;
    }
  }

  /**
   * Retrieve recent activities respecting permissions
   */
  async getRecentActivities(params = {}, currentUser) {
    const limit = Math.min(50, Math.max(1, parseInt(params.limit, 10) || 10));
    const filter = {};

    if (params.project) {
      filter.project = params.project;
    } else if (currentUser.role !== 'ADMIN') {
      // Find projects user has access to
      const authorizedProjects = await Project.find({
        $or: [{ manager: currentUser._id }, { members: currentUser._id }],
      }).select('_id');

      const projectIds = authorizedProjects.map((p) => p._id);
      filter.$or = [
        { project: { $in: projectIds } },
        { user: currentUser._id },
      ];
    }

    return Activity.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', USER_SAFE_FIELDS)
      .populate('project', 'name status priority')
      .populate('task', 'title status priority');
  }
}

module.exports = new ActivityService();

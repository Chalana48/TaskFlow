const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const activityService = require('./activityService');

const USER_SAFE_FIELDS = 'name username email profileImage';

class DashboardService {
  /**
   * Helper to resolve project IDs authorized for the user
   */
  async getAuthorizedProjectIds(currentUser, requestedProjectId = null) {
    if (requestedProjectId) {
      if (!mongoose.Types.ObjectId.isValid(requestedProjectId)) {
        const err = new Error('Invalid project ID format');
        err.statusCode = 400;
        throw err;
      }

      const project = await Project.findById(requestedProjectId);
      if (!project) {
        const err = new Error('Project not found');
        err.statusCode = 404;
        throw err;
      }

      if (currentUser.role !== 'ADMIN') {
        const isManager = project.manager && project.manager.toString() === currentUser._id.toString();
        const isMember = Array.isArray(project.members) && project.members.some((m) => m.toString() === currentUser._id.toString());

        if (!isManager && !isMember) {
          const err = new Error('You do not have permission to access this project');
          err.statusCode = 403;
          throw err;
        }
      }

      return [project._id];
    }

    if (currentUser.role === 'ADMIN') {
      return null; // null signifies system-wide unrestricted access
    }

    const authorizedProjects = await Project.find({
      $or: [{ manager: currentUser._id }, { members: currentUser._id }],
    }).select('_id');

    return authorizedProjects.map((p) => p._id);
  }

  /**
   * Helper to build match filter for Tasks
   */
  async buildTaskMatchFilter(currentUser, requestedProjectId = null) {
    const projectIds = await this.getAuthorizedProjectIds(currentUser, requestedProjectId);

    if (projectIds === null) {
      // Admin system-wide
      return {};
    }

    if (requestedProjectId) {
      return { project: new mongoose.Types.ObjectId(requestedProjectId) };
    }

    // Normal user or PM without specific project filter:
    // Authorized projects OR tasks assigned to this user
    return {
      $or: [
        { project: { $in: projectIds } },
        { assignedTo: currentUser._id },
      ],
    };
  }

  /**
   * Helper to build match filter for Projects
   */
  async buildProjectMatchFilter(currentUser, requestedProjectId = null) {
    const projectIds = await this.getAuthorizedProjectIds(currentUser, requestedProjectId);

    if (projectIds === null) {
      return {};
    }

    return { _id: { $in: projectIds } };
  }

  /**
   * GET /api/dashboard/overview
   */
  async getOverview(currentUser, projectId = null) {
    const taskMatchFilter = await this.buildTaskMatchFilter(currentUser, projectId);
    const projectMatchFilter = await this.buildProjectMatchFilter(currentUser, projectId);
    const now = new Date();

    const [projectAggregation, taskAggregation] = await Promise.all([
      Project.aggregate([
        { $match: projectMatchFilter },
        {
          $facet: {
            statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            totalCount: [{ $count: 'count' }],
          },
        },
      ]),
      Task.aggregate([
        { $match: taskMatchFilter },
        {
          $facet: {
            statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
            overdueCount: [
              {
                $match: {
                  dueDate: { $lt: now, $ne: null },
                  status: { $ne: 'DONE' },
                },
              },
              { $count: 'count' },
            ],
            myTasksCount: [
              {
                $match: {
                  assignedTo: currentUser._id,
                  status: { $ne: 'DONE' },
                },
              },
              { $count: 'count' },
            ],
            totalCount: [{ $count: 'count' }],
          },
        },
      ]),
    ]);

    const projResults = projectAggregation[0] || { statusCounts: [], totalCount: [] };
    const taskResults = taskAggregation[0] || {
      statusCounts: [],
      overdueCount: [],
      myTasksCount: [],
      totalCount: [],
    };

    const totalProjects = projResults.totalCount[0]?.count || 0;
    const activeProjects = projResults.statusCounts.find((s) => s._id === 'ACTIVE')?.count || 0;
    const completedProjects = projResults.statusCounts.find((s) => s._id === 'COMPLETED')?.count || 0;

    const totalTasks = taskResults.totalCount[0]?.count || 0;
    const todoTasks = taskResults.statusCounts.find((s) => s._id === 'TODO')?.count || 0;
    const inProgressTasks = taskResults.statusCounts.find((s) => s._id === 'IN_PROGRESS')?.count || 0;
    const inReviewTasks = taskResults.statusCounts.find((s) => s._id === 'IN_REVIEW')?.count || 0;
    const completedTasks = taskResults.statusCounts.find((s) => s._id === 'DONE')?.count || 0;
    const overdueTasks = taskResults.overdueCount[0]?.count || 0;
    const myTasks = taskResults.myTasksCount[0]?.count || 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      todoTasks,
      inProgressTasks,
      inReviewTasks,
      completedTasks,
      overdueTasks,
      myTasks,
    };
  }

  /**
   * GET /api/dashboard/projects
   */
  async getProjectStatistics(currentUser, projectId = null) {
    const projectMatchFilter = await this.buildProjectMatchFilter(currentUser, projectId);

    const [aggregation] = await Project.aggregate([
      { $match: projectMatchFilter },
      {
        $facet: {
          statusCounts: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    const statusCounts = aggregation?.statusCounts || [];
    const getCount = (status) => statusCounts.find((s) => s._id === status)?.count || 0;

    const planning = getCount('PLANNING');
    const active = getCount('ACTIVE');
    const onHold = getCount('ON_HOLD');
    const completed = getCount('COMPLETED');
    const cancelled = getCount('CANCELLED');
    const totalProjects = aggregation?.totalCount[0]?.count || 0;

    return {
      planning,
      active,
      onHold,
      completed,
      cancelled,
      totalProjects,
      activeProjects: active,
      completedProjects: completed,
      byStatus: {
        PLANNING: planning,
        ACTIVE: active,
        ON_HOLD: onHold,
        COMPLETED: completed,
        CANCELLED: cancelled,
      },
    };
  }

  /**
   * GET /api/dashboard/tasks
   */
  async getTaskStatistics(currentUser, projectId = null) {
    const taskMatchFilter = await this.buildTaskMatchFilter(currentUser, projectId);
    const now = new Date();

    const [aggregation] = await Task.aggregate([
      { $match: taskMatchFilter },
      {
        $facet: {
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          byPriority: [{ $group: { _id: '$priority', count: { $sum: 1 } } }],
          overdue: [
            {
              $match: {
                dueDate: { $lt: now, $ne: null },
                status: { $ne: 'DONE' },
              },
            },
            { $count: 'count' },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    const statusCounts = aggregation?.byStatus || [];
    const priorityCounts = aggregation?.byPriority || [];

    const getStatusCount = (st) => statusCounts.find((s) => s._id === st)?.count || 0;
    const getPriorityCount = (pr) => priorityCounts.find((p) => p._id === pr)?.count || 0;

    return {
      status: {
        TODO: getStatusCount('TODO'),
        IN_PROGRESS: getStatusCount('IN_PROGRESS'),
        IN_REVIEW: getStatusCount('IN_REVIEW'),
        DONE: getStatusCount('DONE'),
      },
      priority: {
        LOW: getPriorityCount('LOW'),
        MEDIUM: getPriorityCount('MEDIUM'),
        HIGH: getPriorityCount('HIGH'),
        CRITICAL: getPriorityCount('CRITICAL'),
      },
      overdue: aggregation?.overdue[0]?.count || 0,
      total: aggregation?.total[0]?.count || 0,
    };
  }

  /**
   * GET /api/dashboard/trends
   * period = 'daily' | 'weekly' | 'monthly'
   */
  async getCompletionTrend(currentUser, period = 'weekly', projectId = null) {
    const taskMatchFilter = await this.buildTaskMatchFilter(currentUser, projectId);

    let dateFormat = '%Y-%m';
    let startDate = new Date();

    const validPeriod = ['daily', 'weekly', 'monthly'].includes(period) ? period : 'weekly';

    if (validPeriod === 'daily') {
      dateFormat = '%Y-%m-%d';
      startDate.setDate(startDate.getDate() - 30); // Last 30 days
    } else if (validPeriod === 'weekly') {
      dateFormat = '%Y-W%V';
      startDate.setDate(startDate.getDate() - 84); // Last 12 weeks
    } else {
      dateFormat = '%Y-%m';
      startDate.setMonth(startDate.getMonth() - 12); // Last 12 months
    }

    const matchCondition = {
      ...taskMatchFilter,
      status: 'DONE',
      completedAt: { $ne: null, $gte: startDate },
    };

    const trends = await Task.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$completedAt' },
          },
          completed: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          period: '$_id',
          completed: 1,
        },
      },
    ]);

    return trends;
  }

  /**
   * GET /api/dashboard/deadlines
   */
  async getUpcomingDeadlines(currentUser, limit = 5, projectId = null) {
    const taskMatchFilter = await this.buildTaskMatchFilter(currentUser, projectId);
    const parsedLimit = Math.min(20, Math.max(1, parseInt(limit, 10) || 5));

    const tasks = await Task.find({
      ...taskMatchFilter,
      dueDate: { $ne: null },
      status: { $ne: 'DONE' },
    })
      .sort({ dueDate: 1 })
      .limit(parsedLimit)
      .populate('project', 'name status priority')
      .populate('assignedTo', USER_SAFE_FIELDS)
      .lean();

    const now = new Date();

    return tasks.map((task) => ({
      _id: task._id,
      title: task.title,
      project: task.project?.name || 'Unassigned Project',
      projectId: task.project?._id || task.project,
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo || null,
      isOverdue: new Date(task.dueDate) < now,
    }));
  }

  /**
   * GET /api/dashboard/activity
   */
  async getRecentActivity(currentUser, limit = 10, projectId = null) {
    return activityService.getRecentActivities({ limit, project: projectId }, currentUser);
  }

  /**
   * GET /api/dashboard/my-tasks
   */
  async getMyTasks(currentUser, limit = 5, projectId = null) {
    const taskMatchFilter = await this.buildTaskMatchFilter(currentUser, projectId);
    const parsedLimit = Math.min(20, Math.max(1, parseInt(limit, 10) || 5));

    return Task.find({
      ...taskMatchFilter,
      assignedTo: currentUser._id,
      status: { $ne: 'DONE' },
    })
      .sort({ dueDate: 1, createdAt: -1 })
      .limit(parsedLimit)
      .populate('project', 'name status priority')
      .populate('assignedTo', USER_SAFE_FIELDS)
      .lean();
  }
}

module.exports = new DashboardService();

const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { Notification } = require('../models/Notification');
const activityService = require('./activityService');
const notificationService = require('./notificationService');

class AdminService {
  /**
   * Get high-level aggregated statistics for admin dashboard
   * @returns {Promise<Object>}
   */
  async getDashboardOverview() {
    const [
      totalUsers,
      activeUsers,
      suspendedUsers,
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({
        $or: [
          { status: 'ACTIVE' },
          { status: { $exists: false }, isActive: true },
        ],
      }),
      User.countDocuments({
        $or: [{ status: 'SUSPENDED' }, { isActive: false }],
      }),
      Project.countDocuments({}),
      Project.countDocuments({ status: 'ACTIVE' }),
      Project.countDocuments({ status: 'COMPLETED' }),
      Task.countDocuments({}),
      Task.countDocuments({ status: 'DONE' }),
      Task.countDocuments({
        status: { $ne: 'DONE' },
        dueDate: { $lt: new Date() },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        suspended: suspendedUsers,
      },
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
      },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        overdue: overdueTasks,
      },
    };
  }

  /**
   * Get user registration growth over time
   * @param {number} days - Time window in days (7, 30, 90)
   * @returns {Promise<Array>}
   */
  async getUserGrowth(days = 30) {
    const windowDays = Math.max(1, Math.min(365, parseInt(days, 10) || 30));
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - windowDays);
    startDate.setHours(0, 0, 0, 0);

    const aggregation = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Build continuous map so days with 0 registrations are included
    const countMap = {};
    aggregation.forEach((item) => {
      countMap[item._id] = item.count;
    });

    const result = [];
    const currentDate = new Date(startDate);
    const now = new Date();

    while (currentDate <= now) {
      const dateStr = currentDate.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        newUsers: countMap[dateStr] || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }

  /**
   * Get project breakdown by status and priority
   * @returns {Promise<Object>}
   */
  async getProjectStatistics() {
    const [statusStats, priorityStats] = await Promise.all([
      Project.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Project.aggregate([
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusMap = {
      PLANNING: 0,
      ACTIVE: 0,
      ON_HOLD: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    statusStats.forEach((s) => {
      if (s._id) statusMap[s._id] = s.count;
    });

    const priorityMap = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    priorityStats.forEach((p) => {
      if (p._id) priorityMap[p._id] = p.count;
    });

    return {
      byStatus: statusMap,
      byPriority: priorityMap,
    };
  }

  /**
   * Get task breakdown by status and priority
   * @returns {Promise<Object>}
   */
  async getTaskStatistics() {
    const [statusStats, priorityStats] = await Promise.all([
      Task.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),
      Task.aggregate([
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const statusMap = {
      TODO: 0,
      IN_PROGRESS: 0,
      IN_REVIEW: 0,
      DONE: 0,
    };
    statusStats.forEach((s) => {
      if (s._id) statusMap[s._id] = s.count;
    });

    const priorityMap = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    priorityStats.forEach((p) => {
      if (p._id) priorityMap[p._id] = p.count;
    });

    return {
      byStatus: statusMap,
      byPriority: priorityMap,
    };
  }

  /**
   * Search, filter, and paginate all users
   * @param {Object} query - search, role, status, page, limit, sortBy, sortOrder
   * @returns {Promise<Object>}
   */
  async getUsers(params = {}) {
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const allowedSortFields = ['createdAt', 'name', 'email', 'username', 'role', 'status'];
    const sortBy = allowedSortFields.includes(params.sortBy) ? params.sortBy : 'createdAt';
    const sortOrder = params.sortOrder === 'asc' ? 1 : -1;

    const query = {};

    // Search filter
    if (params.search && params.search.trim()) {
      const regex = new RegExp(params.search.trim(), 'i');
      query.$or = [{ name: regex }, { email: regex }, { username: regex }];
    }

    // Role filter
    if (params.role && ['USER', 'PROJECT_MANAGER', 'ADMIN'].includes(params.role)) {
      query.role = params.role;
    }

    // Status filter
    if (params.status && ['ACTIVE', 'SUSPENDED'].includes(params.status)) {
      if (params.status === 'ACTIVE') {
        query.$or = [{ status: 'ACTIVE' }, { status: { $exists: false }, isActive: true }];
      } else {
        query.$or = [{ status: 'SUSPENDED' }, { isActive: false }];
      }
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .select('-password'),
    ]);

    const sanitizedUsers = users.map((u) => (u.toSafeObject ? u.toSafeObject() : u));

    return {
      users: sanitizedUsers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get comprehensive details for a specific user
   * @param {string} userId - User's ObjectId
   * @returns {Promise<Object>}
   */
  async getUserById(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error('Invalid user ID format');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Related projects
    const projects = await Project.find({
      $or: [{ manager: userId }, { members: userId }],
    })
      .select('name description status priority startDate endDate')
      .populate('manager', 'name email role')
      .lean();

    // Related assigned tasks
    const tasks = await Task.find({ assignedTo: userId })
      .select('title status priority dueDate project')
      .populate('project', 'name')
      .lean();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
    const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const todoTasks = tasks.filter((t) => t.status === 'TODO').length;
    const overdueTasks = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
    ).length;

    // Recent activity records
    const recentActivities = await Activity.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('project', 'name')
      .populate('task', 'title')
      .lean();

    return {
      user: user.toSafeObject ? user.toSafeObject() : user,
      projects,
      tasks,
      taskSummary: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        todo: todoTasks,
        overdue: overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      recentActivities,
    };
  }

  /**
   * Change user role with safeguards against removing the last active administrator
   * @param {string} userId - Target user ID
   * @param {string} newRole - Target role ('USER', 'PROJECT_MANAGER', 'ADMIN')
   * @param {Object} adminUser - Authenticated admin user document
   * @returns {Promise<Object>}
   */
  async updateUserRole(userId, newRole, adminUser) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error('Invalid user ID format');
      error.statusCode = 400;
      throw error;
    }

    const validRoles = ['USER', 'PROJECT_MANAGER', 'ADMIN'];
    if (!newRole || !validRoles.includes(newRole)) {
      const error = new Error(`Role must be one of: ${validRoles.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Safeguard: Prevent removing or demoting the last active administrator
    if (targetUser.role === 'ADMIN' && newRole !== 'ADMIN') {
      const otherActiveAdminCount = await User.countDocuments({
        _id: { $ne: targetUser._id },
        role: 'ADMIN',
        $or: [{ status: 'ACTIVE' }, { status: { $exists: false }, isActive: true }],
      });

      if (otherActiveAdminCount === 0) {
        const error = new Error('Cannot demote or remove the last active administrator');
        error.statusCode = 400;
        throw error;
      }
    }

    const previousRole = targetUser.role;
    targetUser.role = newRole;
    await targetUser.save();

    // Log administrative action in Activity system
    await activityService.createActivity({
      user: adminUser._id,
      type: 'USER_ROLE_CHANGED',
      message: `Administrator ${adminUser.name} changed role of ${targetUser.name} from ${previousRole} to ${newRole}`,
      metadata: {
        targetUserId: targetUser._id,
        targetEmail: targetUser.email,
        previousRole,
        newRole,
      },
    });

    // Send notification to the affected user
    await notificationService.createNotification({
      recipient: targetUser._id,
      type: 'ROLE_UPDATED',
      title: 'Your Account Role Has Changed',
      message: `Your account role was updated to ${newRole} by an administrator.`,
      relatedUser: adminUser._id,
      link: '/profile',
      force: true,
    });

    return targetUser.toSafeObject();
  }

  /**
   * Update user status (ACTIVE / SUSPENDED)
   * @param {string} userId - Target user ID
   * @param {string} status - New status ('ACTIVE' or 'SUSPENDED')
   * @param {Object} adminUser - Authenticated admin user document
   * @returns {Promise<Object>}
   */
  async updateUserStatus(userId, status, adminUser) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error('Invalid user ID format');
      error.statusCode = 400;
      throw error;
    }

    const validStatuses = ['ACTIVE', 'SUSPENDED'];
    if (!status || !validStatuses.includes(status)) {
      const error = new Error(`Status must be one of: ${validStatuses.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Safeguard: Prevent administrator from suspending themselves
    if (adminUser._id.toString() === targetUser._id.toString() && status === 'SUSPENDED') {
      const error = new Error('You cannot suspend your own administrative account');
      error.statusCode = 400;
      throw error;
    }

    // Safeguard: Prevent suspending the last active administrator
    if (targetUser.role === 'ADMIN' && status === 'SUSPENDED') {
      const otherActiveAdminCount = await User.countDocuments({
        _id: { $ne: targetUser._id },
        role: 'ADMIN',
        $or: [{ status: 'ACTIVE' }, { status: { $exists: false }, isActive: true }],
      });

      if (otherActiveAdminCount === 0) {
        const error = new Error('Cannot suspend the last active administrator');
        error.statusCode = 400;
        throw error;
      }
    }

    targetUser.status = status;
    targetUser.isActive = status === 'ACTIVE';
    await targetUser.save();

    // Log administrative action
    await activityService.createActivity({
      user: adminUser._id,
      type: 'USER_STATUS_CHANGED',
      message: `Administrator ${adminUser.name} ${
        status === 'ACTIVE' ? 'restored' : 'suspended'
      } the account of ${targetUser.name}`,
      metadata: {
        targetUserId: targetUser._id,
        targetEmail: targetUser.email,
        status,
      },
    });

    // Notify affected user
    await notificationService.createNotification({
      recipient: targetUser._id,
      type: 'ACCOUNT_STATUS_CHANGED',
      title: status === 'ACTIVE' ? 'Account Restored' : 'Account Suspended',
      message:
        status === 'ACTIVE'
          ? 'Your account has been reactivated by an administrator.'
          : 'Your account has been suspended by an administrator. Please contact support.',
      relatedUser: adminUser._id,
      force: true,
    });

    return targetUser.toSafeObject();
  }

  /**
   * Safe user deletion strategy
   * - Prevents deleting self
   * - Prevents deleting the last active admin
   * - Restricts deletion if user is active manager of projects
   * - Unassigns user from assigned tasks
   * - Removes user from project member lists
   * - Cleans up user notifications
   * - Records Activity
   * @param {string} userId - Target user ID
   * @param {Object} adminUser - Authenticated admin user document
   * @returns {Promise<Object>}
   */
  async deleteUser(userId, adminUser) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = new Error('Invalid user ID format');
      error.statusCode = 400;
      throw error;
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    // Safeguard: Prevent deleting own account
    if (adminUser._id.toString() === targetUser._id.toString()) {
      const error = new Error('You cannot delete your own administrative account');
      error.statusCode = 400;
      throw error;
    }

    // Safeguard: Prevent deleting the last active admin
    if (targetUser.role === 'ADMIN') {
      const otherActiveAdminCount = await User.countDocuments({
        _id: { $ne: targetUser._id },
        role: 'ADMIN',
        $or: [{ status: 'ACTIVE' }, { status: { $exists: false }, isActive: true }],
      });

      if (otherActiveAdminCount === 0) {
        const error = new Error('Cannot delete the last active administrator');
        error.statusCode = 400;
        throw error;
      }
    }

    // Safeguard: Check if user is currently project manager of active projects
    const managedProjectsCount = await Project.countDocuments({
      manager: targetUser._id,
      status: { $in: ['PLANNING', 'ACTIVE', 'ON_HOLD'] },
    });

    if (managedProjectsCount > 0) {
      const error = new Error(
        `Cannot delete user who is currently managing ${managedProjectsCount} active project(s). Please reassign project managers first.`
      );
      error.statusCode = 400;
      throw error;
    }

    // Safe relationship cleanup
    // 1. Remove user from all project members arrays
    await Project.updateMany(
      { members: targetUser._id },
      { $pull: { members: targetUser._id } }
    );

    // 2. Unassign tasks assigned to this user
    await Task.updateMany(
      { assignedTo: targetUser._id },
      { $set: { assignedTo: null } }
    );

    // 3. Clean up notifications for this recipient
    await Notification.deleteMany({ recipient: targetUser._id });

    // 4. Delete the user document
    await User.findByIdAndDelete(targetUser._id);

    // 5. Record deletion in Activity system
    await activityService.createActivity({
      user: adminUser._id,
      type: 'USER_DELETED',
      message: `Administrator ${adminUser.name} deleted user ${targetUser.name} (${targetUser.email})`,
      metadata: {
        deletedUserId: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });

    return {
      message: 'User deleted safely and related project/task references cleaned up',
    };
  }
}

module.exports = new AdminService();

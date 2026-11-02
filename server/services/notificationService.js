const mongoose = require('mongoose');
const { Notification, NOTIFICATION_TYPES } = require('../models/Notification');
const User = require('../models/User');
const Task = require('../models/Task');
const Project = require('../models/Project');

const USER_SAFE_FIELDS = 'name username email profileImage role';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

class NotificationService {
  /**
   * Helper: check if a user wants to receive this category of notification
   */
  shouldSendNotification(user, type) {
    if (!user) return false;
    const prefs = user.notificationPreferences || {};

    switch (type) {
      case 'TASK_ASSIGNED':
        return prefs.taskAssigned !== false;
      case 'TASK_STATUS_CHANGED':
        return prefs.taskStatusChanged !== false;
      case 'TASK_COMPLETED':
        return prefs.taskCompleted !== false;
      case 'COMMENT_ADDED':
        return prefs.comments !== false;
      case 'PROJECT_ADDED':
      case 'PROJECT_UPDATED':
      case 'PROJECT_MANAGER_CHANGED':
        return prefs.projectUpdates !== false;
      case 'TASK_DUE_SOON':
      case 'TASK_OVERDUE':
        return prefs.deadlineReminders !== false;
      case 'SYSTEM':
      default:
        return true;
    }
  }

  /**
   * Create a single in-app notification
   */
  async createNotification({
    recipient,
    type,
    title,
    message,
    relatedProject = null,
    relatedTask = null,
    relatedUser = null,
    link = null,
    force = false,
  }) {
    try {
      if (!recipient || !type || !title || !message) {
        return null;
      }

      const recipientId = typeof recipient === 'object' ? recipient._id : recipient;
      const actingUserId = relatedUser ? (typeof relatedUser === 'object' ? relatedUser._id : relatedUser) : null;

      // Do not notify a user of their own actions unless explicitly forced
      if (!force && actingUserId && String(recipientId) === String(actingUserId)) {
        return null;
      }

      // Check recipient user existence and preferences
      let recipientDoc = null;
      if (typeof recipient === 'object' && recipient.notificationPreferences) {
        recipientDoc = recipient;
      } else if (isValidObjectId(recipientId)) {
        recipientDoc = await User.findById(recipientId);
      }

      if (recipientDoc) {
        if (!recipientDoc.isActive && !force) return null;
        if (!force && !this.shouldSendNotification(recipientDoc, type)) {
          return null;
        }
      }

      // Deduplication: prevent identical unread notification within last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const duplicateFilter = {
        recipient: recipientId,
        type,
        isRead: false,
        createdAt: { $gte: fiveMinutesAgo },
      };
      if (relatedTask) duplicateFilter.relatedTask = typeof relatedTask === 'object' ? relatedTask._id : relatedTask;
      if (relatedProject) duplicateFilter.relatedProject = typeof relatedProject === 'object' ? relatedProject._id : relatedProject;

      const existing = await Notification.findOne(duplicateFilter);
      if (existing) {
        return existing;
      }

      // Construct notification payload
      const notificationData = {
        recipient: recipientId,
        type,
        title: title.trim(),
        message: message.trim(),
        relatedProject: relatedProject ? (typeof relatedProject === 'object' ? relatedProject._id : relatedProject) : null,
        relatedTask: relatedTask ? (typeof relatedTask === 'object' ? relatedTask._id : relatedTask) : null,
        relatedUser: actingUserId,
        link: link ? link.trim() : null,
        isRead: false,
      };

      return await Notification.create(notificationData);
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[NotificationService] Warning: Failed to create notification:', err.message);
      }
      return null;
    }
  }

  /**
   * Bulk dispatch notifications to multiple recipients
   */
  async createNotificationsForUsers(recipients = [], notificationData = {}) {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return [];
    }

    // Deduplicate recipient IDs
    const seen = new Set();
    const uniqueRecipients = [];
    for (const r of recipients) {
      const idStr = String(typeof r === 'object' ? r._id : r);
      if (!seen.has(idStr)) {
        seen.add(idStr);
        uniqueRecipients.push(r);
      }
    }

    const createdList = [];
    for (const recipient of uniqueRecipients) {
      const notification = await this.createNotification({
        ...notificationData,
        recipient,
      });
      if (notification) {
        createdList.push(notification);
      }
    }

    return createdList;
  }

  /**
   * Retrieve paginated notifications for the authenticated user
   */
  async getUserNotifications(userId, params = {}) {
    if (!isValidObjectId(userId)) {
      const err = new Error('Invalid user ID format');
      err.statusCode = 400;
      throw err;
    }

    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(params.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = { recipient: userId };

    // Read/Unread filter
    if (params.isRead !== undefined && params.isRead !== '') {
      if (params.isRead === true || params.isRead === 'true') {
        filter.isRead = true;
      } else if (params.isRead === false || params.isRead === 'false') {
        filter.isRead = false;
      }
    }

    // Type filter
    if (params.type && NOTIFICATION_TYPES.includes(params.type)) {
      filter.type = params.type;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('relatedUser', USER_SAFE_FIELDS)
        .populate('relatedProject', 'name status priority')
        .populate('relatedTask', 'title status priority'),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get unread notification count for authenticated user
   */
  async getUnreadNotificationCount(userId) {
    if (!isValidObjectId(userId)) {
      const err = new Error('Invalid user ID format');
      err.statusCode = 400;
      throw err;
    }

    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return { count };
  }

  /**
   * Mark a single notification as read (ensuring ownership)
   */
  async markNotificationAsRead(notificationId, userId) {
    if (!isValidObjectId(notificationId) || !isValidObjectId(userId)) {
      const err = new Error('Invalid notification or user ID format');
      err.statusCode = 400;
      throw err;
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      const err = new Error('Notification not found or access denied');
      err.statusCode = 404;
      throw err;
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return notification;
  }

  /**
   * Mark all notifications as read for the authenticated user
   */
  async markAllNotificationsAsRead(userId) {
    if (!isValidObjectId(userId)) {
      const err = new Error('Invalid user ID format');
      err.statusCode = 400;
      throw err;
    }

    const now = new Date();
    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true, readAt: now } }
    );

    const count = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    return {
      success: true,
      modifiedCount: result.modifiedCount || 0,
      unreadCount: count,
    };
  }

  /**
   * Delete a single notification (ensuring ownership)
   */
  async deleteNotification(notificationId, userId) {
    if (!isValidObjectId(notificationId) || !isValidObjectId(userId)) {
      const err = new Error('Invalid notification or user ID format');
      err.statusCode = 400;
      throw err;
    }

    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId,
    });

    if (!notification) {
      const err = new Error('Notification not found or access denied');
      err.statusCode = 404;
      throw err;
    }

    await Notification.findByIdAndDelete(notificationId);
    return { success: true, id: notificationId };
  }

  /**
   * Retrieve notification preferences for a user
   */
  async getUserPreferences(userId) {
    if (!isValidObjectId(userId)) {
      const err = new Error('Invalid user ID format');
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    return user.notificationPreferences || {
      taskAssigned: true,
      taskStatusChanged: true,
      taskCompleted: true,
      comments: true,
      projectUpdates: true,
      deadlineReminders: true,
    };
  }

  /**
   * Update notification preferences for a user
   */
  async updateUserPreferences(userId, preferences = {}) {
    if (!isValidObjectId(userId)) {
      const err = new Error('Invalid user ID format');
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const current = user.notificationPreferences || {};
    const validKeys = [
      'taskAssigned',
      'taskStatusChanged',
      'taskCompleted',
      'comments',
      'projectUpdates',
      'deadlineReminders',
    ];

    validKeys.forEach((key) => {
      if (preferences[key] !== undefined && typeof preferences[key] === 'boolean') {
        current[key] = preferences[key];
      }
    });

    user.notificationPreferences = current;
    await user.save();

    return user.notificationPreferences;
  }

  /**
   * Check for due soon and overdue tasks and generate notifications (scheduled or on-demand)
   */
  async checkDeadlineNotifications() {
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Find non-completed tasks with a dueDate assigned to a user
      const candidateTasks = await Task.find({
        status: { $ne: 'DONE' },
        dueDate: { $ne: null },
        assignedTo: { $ne: null },
      }).populate('project', 'name');

      let generatedCount = 0;

      for (const task of candidateTasks) {
        if (!task.dueDate || !task.assignedTo) continue;

        const isOverdue = task.dueDate < now;
        const isDueSoon = task.dueDate >= now && task.dueDate <= in24Hours;

        if (!isOverdue && !isDueSoon) continue;

        const type = isOverdue ? 'TASK_OVERDUE' : 'TASK_DUE_SOON';
        const title = isOverdue ? 'Task Overdue' : 'Task Due Soon';
        const message = isOverdue
          ? `Task "${task.title}" is overdue (was due on ${new Date(task.dueDate).toLocaleDateString()})`
          : `Task "${task.title}" is due soon on ${new Date(task.dueDate).toLocaleDateString()}`;

        // Check if notification of this type was already sent in the last 24h for this task
        const existing = await Notification.findOne({
          recipient: task.assignedTo,
          relatedTask: task._id,
          type,
          createdAt: { $gte: twentyFourHoursAgo },
        });

        if (!existing) {
          const created = await this.createNotification({
            recipient: task.assignedTo,
            type,
            title,
            message,
            relatedProject: task.project?._id || task.project,
            relatedTask: task._id,
            link: `/tasks/${task._id}`,
            force: true, // system reminder
          });
          if (created) generatedCount++;
        }
      }

      return { success: true, generatedCount };
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[NotificationService] Warning: Deadline check failed:', err.message);
      }
      return { success: false, error: err.message };
    }
  }
}

module.exports = new NotificationService();

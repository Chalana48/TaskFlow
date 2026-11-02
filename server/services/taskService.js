const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const activityService = require('./activityService');
const notificationService = require('./notificationService');
const {
  validateCreateTask,
  validateUpdateTask,
  VALID_TASK_STATUSES,
} = require('../utils/validators');

/**
 * Helper to check if string is valid MongoDB ObjectId
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Safe projection for populated users
 */
const USER_SAFE_FIELDS = 'name username email role profileImage isActive';

class TaskService {
  /**
   * Helper: check if a user is project manager or admin
   */
  isProjectManagerOrAdmin(user, project) {
    if (!user || !project) return false;
    if (user.role === 'ADMIN') return true;
    const managerId = typeof project.manager === 'object' ? project.manager._id : project.manager;
    return String(managerId) === String(user._id);
  }

  /**
   * Helper: check if a user belongs to project (manager or member)
   */
  isProjectParticipant(user, project) {
    if (!user || !project) return false;
    if (user.role === 'ADMIN') return true;
    const managerId = typeof project.manager === 'object' ? project.manager._id : project.manager;
    if (String(managerId) === String(user._id)) return true;

    if (Array.isArray(project.members)) {
      return project.members.some((m) => {
        const mId = typeof m === 'object' ? m._id : m;
        return String(mId) === String(user._id);
      });
    }
    return false;
  }

  /**
   * Create a new task
   */
  async createTask(taskData, currentUser) {
    const { isValid, errors } = validateCreateTask(taskData);
    if (!isValid) {
      const err = new Error(errors.join(', '));
      err.statusCode = 400;
      throw err;
    }

    if (!isValidObjectId(taskData.project)) {
      const err = new Error('Invalid project ID format');
      err.statusCode = 400;
      throw err;
    }

    const project = await Project.findById(taskData.project);
    if (!project) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      throw err;
    }

    // Permission: User must belong to project or be ADMIN
    if (!this.isProjectParticipant(currentUser, project)) {
      const err = new Error('You do not have permission to create tasks in this project');
      err.statusCode = 403;
      throw err;
    }

    // Validate assigned user if provided
    let assignedUserId = null;
    if (taskData.assignedTo) {
      if (!isValidObjectId(taskData.assignedTo)) {
        const err = new Error('Invalid assigned user ID format');
        err.statusCode = 400;
        throw err;
      }

      const assignedUser = await User.findById(taskData.assignedTo);
      if (!assignedUser || !assignedUser.isActive) {
        const err = new Error('Assigned user not found or inactive');
        err.statusCode = 400;
        throw err;
      }

      // Verify that assigned user belongs to the project
      if (!this.isProjectParticipant(assignedUser, project)) {
        const err = new Error('Assigned user must be a member or manager of the project');
        err.statusCode = 400;
        throw err;
      }

      assignedUserId = assignedUser._id;
    }

    const isCompleted = (taskData.status || 'TODO') === 'DONE';
    const task = await Task.create({
      title: taskData.title.trim(),
      description: taskData.description ? taskData.description.trim() : '',
      project: project._id,
      assignedTo: assignedUserId,
      createdBy: currentUser._id,
      status: taskData.status || 'TODO',
      priority: taskData.priority || 'MEDIUM',
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      completedAt: isCompleted ? new Date() : null,
      estimatedHours: taskData.estimatedHours !== undefined && taskData.estimatedHours !== '' ? Number(taskData.estimatedHours) : 0,
      labels: Array.isArray(taskData.labels) ? taskData.labels.map((l) => String(l).trim()).filter(Boolean) : [],
    });

    activityService.createActivity({
      user: currentUser,
      type: isCompleted ? 'TASK_COMPLETED' : 'TASK_CREATED',
      project: project._id,
      task: task._id,
      message: `${currentUser.name || 'User'} created task "${task.title}"`,
    });

    if (task.assignedTo && String(task.assignedTo) !== String(currentUser._id)) {
      notificationService.createNotification({
        recipient: task.assignedTo,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: `${currentUser.name || 'User'} assigned you to task "${task.title}"`,
        relatedProject: project._id,
        relatedTask: task._id,
        relatedUser: currentUser._id,
        link: `/tasks/${task._id}`,
      });
    }

    return Task.findById(task._id)
      .populate('project', 'name status priority')
      .populate('assignedTo', USER_SAFE_FIELDS)
      .populate('createdBy', USER_SAFE_FIELDS);
  }

  /**
   * Get paginated & filtered tasks with access control
   */
  async getTasks(params = {}, currentUser) {
    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const filter = {};

    // Project filtering & visibility check
    if (params.project) {
      if (!isValidObjectId(params.project)) {
        const err = new Error('Invalid project ID format');
        err.statusCode = 400;
        throw err;
      }

      const project = await Project.findById(params.project);
      if (!project) {
        const err = new Error('Project not found');
        err.statusCode = 404;
        throw err;
      }

      // Check visibility for this project
      if (!this.isProjectParticipant(currentUser, project)) {
        const err = new Error('You do not have permission to view tasks for this project');
        err.statusCode = 403;
        throw err;
      }

      filter.project = project._id;
    } else if (currentUser.role !== 'ADMIN') {
      // Normal user query without specific project:
      // Restrict to projects the user is manager/member of, OR tasks assigned to them
      const userProjects = await Project.find({
        $or: [{ manager: currentUser._id }, { members: currentUser._id }],
      }).select('_id');

      const userProjectIds = userProjects.map((p) => p._id);
      filter.$or = [
        { project: { $in: userProjectIds } },
        { assignedTo: currentUser._id },
      ];
    }

    // AssignedTo filter
    if (params.assignedTo) {
      if (params.assignedTo === 'unassigned') {
        filter.assignedTo = null;
      } else if (isValidObjectId(params.assignedTo)) {
        filter.assignedTo = params.assignedTo;
      }
    }

    // Status filter
    if (params.status && VALID_TASK_STATUSES.includes(params.status)) {
      filter.status = params.status;
    }

    // Priority filter
    if (params.priority) {
      filter.priority = params.priority;
    }

    // Due date filter (overdue / today / upcoming)
    if (params.dueDate) {
      const date = new Date(params.dueDate);
      if (!isNaN(date)) {
        filter.dueDate = { $lte: date };
      }
    }

    // Search filter (title, description, or labels)
    if (params.search && typeof params.search === 'string') {
      const searchRegex = new RegExp(params.search.trim(), 'i');
      const searchCondition = {
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { labels: searchRegex },
        ],
      };

      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, searchCondition];
        delete filter.$or;
      } else {
        filter.$or = searchCondition.$or;
      }
    }

    // Sorting
    const sortField = ['createdAt', 'dueDate', 'priority', 'title', 'status'].includes(params.sortBy)
      ? params.sortBy
      : 'createdAt';
    const sortDirection = params.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortDirection };

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('project', 'name status priority')
        .populate('assignedTo', USER_SAFE_FIELDS)
        .populate('createdBy', USER_SAFE_FIELDS)
        .populate('comments.user', USER_SAFE_FIELDS),
      Task.countDocuments(filter),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Get single task by ID with authorization check
   */
  async getTaskById(taskId, currentUser) {
    if (!isValidObjectId(taskId)) {
      const err = new Error('Invalid task ID format');
      err.statusCode = 400;
      throw err;
    }

    const task = await Task.findById(taskId)
      .populate('project')
      .populate('assignedTo', USER_SAFE_FIELDS)
      .populate('createdBy', USER_SAFE_FIELDS)
      .populate('comments.user', USER_SAFE_FIELDS);

    if (!task) {
      const err = new Error('Task not found');
      err.statusCode = 404;
      throw err;
    }

    // Check visibility
    const isParticipant = this.isProjectParticipant(currentUser, task.project);
    const isAssignee = task.assignedTo && String(task.assignedTo._id) === String(currentUser._id);

    if (!isParticipant && !isAssignee && currentUser.role !== 'ADMIN') {
      const err = new Error('You are not authorized to view this task');
      err.statusCode = 403;
      throw err;
    }

    return task;
  }

  /**
   * Update task fields
   */
  async updateTask(taskId, updateData, currentUser) {
    if (!isValidObjectId(taskId)) {
      const err = new Error('Invalid task ID format');
      err.statusCode = 400;
      throw err;
    }

    const { isValid, errors } = validateUpdateTask(updateData);
    if (!isValid) {
      const err = new Error(errors.join(', '));
      err.statusCode = 400;
      throw err;
    }

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      const err = new Error('Task not found');
      err.statusCode = 404;
      throw err;
    }

    const isManagerOrAdmin = this.isProjectManagerOrAdmin(currentUser, task.project);
    const isAssignee = task.assignedTo && String(task.assignedTo) === String(currentUser._id);
    const isParticipant = this.isProjectParticipant(currentUser, task.project);

    // If user is neither manager, admin, nor participant, deny completely
    if (!isParticipant && !isAssignee && currentUser.role !== 'ADMIN') {
      const err = new Error('You do not have permission to update this task');
      err.statusCode = 403;
      throw err;
    }

    // Only Manager or Admin can update metadata (title, description, priority, assignee, due date, hours, labels)
    if (!isManagerOrAdmin) {
      // Normal participant / assignee can only change status
      const metadataFields = ['title', 'description', 'priority', 'assignedTo', 'dueDate', 'estimatedHours', 'labels'];
      const attemptedMetadata = metadataFields.some((f) => updateData[f] !== undefined);
      if (attemptedMetadata) {
        const err = new Error('Only the project manager or an administrator can modify task metadata');
        err.statusCode = 403;
        throw err;
      }
    }

    // Validate assigned user if changed by manager/admin
    if (updateData.assignedTo !== undefined) {
      if (updateData.assignedTo === null || updateData.assignedTo === '') {
        task.assignedTo = null;
      } else {
        if (!isValidObjectId(updateData.assignedTo)) {
          const err = new Error('Invalid assigned user ID format');
          err.statusCode = 400;
          throw err;
        }

        const candidate = await User.findById(updateData.assignedTo);
        if (!candidate || !candidate.isActive) {
          const err = new Error('Assigned user not found or inactive');
          err.statusCode = 400;
          throw err;
        }

        if (!this.isProjectParticipant(candidate, task.project)) {
          const err = new Error('Assigned user must be a member or manager of the project');
          err.statusCode = 400;
          throw err;
        }

        task.assignedTo = candidate._id;
      }
    }

    const oldStatus = task.status;
    if (updateData.title !== undefined) task.title = updateData.title.trim();
    if (updateData.description !== undefined) task.description = updateData.description.trim();
    if (updateData.status !== undefined) {
      task.status = updateData.status;
      if (updateData.status === 'DONE' && oldStatus !== 'DONE') {
        task.completedAt = new Date();
      } else if (updateData.status !== 'DONE' && oldStatus === 'DONE') {
        task.completedAt = null;
      }
    }
    if (updateData.priority !== undefined) task.priority = updateData.priority;
    if (updateData.dueDate !== undefined) task.dueDate = updateData.dueDate ? new Date(updateData.dueDate) : null;
    if (updateData.estimatedHours !== undefined) task.estimatedHours = Number(updateData.estimatedHours) || 0;
    if (updateData.labels !== undefined) task.labels = updateData.labels.map((l) => String(l).trim()).filter(Boolean);

    await task.save();

    // Log Activity
    if (updateData.status && updateData.status !== oldStatus) {
      activityService.createActivity({
        user: currentUser,
        type: updateData.status === 'DONE' ? 'TASK_COMPLETED' : 'TASK_STATUS_CHANGED',
        project: task.project._id,
        task: task._id,
        message: `${currentUser.name || 'User'} changed status of "${task.title}" to ${task.status}`,
      });

      // Notify project manager and task assignee
      const isCompleted = updateData.status === 'DONE';
      const notifType = isCompleted ? 'TASK_COMPLETED' : 'TASK_STATUS_CHANGED';
      const notifTitle = isCompleted ? 'Task Completed' : 'Task Status Changed';
      const notifMessage = `${currentUser.name || 'User'} ${isCompleted ? 'completed task' : 'changed status of'} "${task.title}"${isCompleted ? '' : ' to ' + updateData.status}`;

      const recipients = new Set();
      const managerId = task.project?.manager?._id || task.project?.manager;
      if (managerId && String(managerId) !== String(currentUser._id)) {
        recipients.add(String(managerId));
      }
      if (task.assignedTo && String(task.assignedTo) !== String(currentUser._id)) {
        recipients.add(String(task.assignedTo));
      }

      for (const rId of recipients) {
        notificationService.createNotification({
          recipient: rId,
          type: notifType,
          title: notifTitle,
          message: notifMessage,
          relatedProject: task.project?._id || task.project,
          relatedTask: task._id,
          relatedUser: currentUser._id,
          link: `/tasks/${task._id}`,
        });
      }
    } else {
      activityService.createActivity({
        user: currentUser,
        type: 'TASK_UPDATED',
        project: task.project._id,
        task: task._id,
        message: `${currentUser.name || 'User'} updated task "${task.title}"`,
      });
    }

    if (updateData.assignedTo && String(task.assignedTo) !== String(currentUser._id)) {
      notificationService.createNotification({
        recipient: task.assignedTo,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned',
        message: `${currentUser.name || 'User'} assigned you to task "${task.title}"`,
        relatedProject: task.project?._id || task.project,
        relatedTask: task._id,
        relatedUser: currentUser._id,
        link: `/tasks/${task._id}`,
      });
    }

    return Task.findById(task._id)
      .populate('project', 'name status priority')
      .populate('assignedTo', USER_SAFE_FIELDS)
      .populate('createdBy', USER_SAFE_FIELDS)
      .populate('comments.user', USER_SAFE_FIELDS);
  }

  /**
   * Delete task
   */
  async deleteTask(taskId, currentUser) {
    if (!isValidObjectId(taskId)) {
      const err = new Error('Invalid task ID format');
      err.statusCode = 400;
      throw err;
    }

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      const err = new Error('Task not found');
      err.statusCode = 404;
      throw err;
    }

    if (!this.isProjectManagerOrAdmin(currentUser, task.project)) {
      const err = new Error('Only the project manager or an administrator can delete tasks');
      err.statusCode = 403;
      throw err;
    }

    await Task.findByIdAndDelete(taskId);
    return { success: true };
  }

  /**
   * Assign task to user
   */
  async assignTask(taskId, userId, currentUser) {
    if (!isValidObjectId(taskId)) {
      const err = new Error('Invalid task ID format');
      err.statusCode = 400;
      throw err;
    }

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      const err = new Error('Task not found');
      err.statusCode = 404;
      throw err;
    }

    if (!this.isProjectManagerOrAdmin(currentUser, task.project)) {
      const err = new Error('Only the project manager or an administrator can assign tasks');
      err.statusCode = 403;
      throw err;
    }

    if (!userId) {
      task.assignedTo = null;
    } else {
      if (!isValidObjectId(userId)) {
        const err = new Error('Invalid user ID format');
        err.statusCode = 400;
        throw err;
      }

      const user = await User.findById(userId);
      if (!user || !user.isActive) {
        const err = new Error('User not found or inactive');
        err.statusCode = 400;
        throw err;
      }

      if (!this.isProjectParticipant(user, task.project)) {
        const err = new Error('Assigned user must be a member or manager of the project');
        err.statusCode = 400;
        throw err;
      }

      task.assignedTo = user._id;
    }

    await task.save();

    activityService.createActivity({
      user: currentUser,
      type: 'TASK_ASSIGNED',
      project: task.project._id,
      task: task._id,
      message: `${currentUser.name || 'User'} assigned task "${task.title}"`,
    });

    if (userId && String(userId) !== String(currentUser._id)) {
      notificationService.createNotification({
        recipient: userId,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned',
        message: `${currentUser.name || 'User'} assigned you to task "${task.title}"`,
        relatedProject: task.project?._id || task.project,
        relatedTask: task._id,
        relatedUser: currentUser._id,
        link: `/tasks/${task._id}`,
      });
    }

    return Task.findById(task._id)
      .populate('project', 'name status priority')
      .populate('assignedTo', USER_SAFE_FIELDS)
      .populate('createdBy', USER_SAFE_FIELDS);
  }

  /**
   * Update task status (for Kanban drag & drop and quick changes)
   */
  async updateTaskStatus(taskId, status, currentUser) {
    if (!isValidObjectId(taskId)) {
      const err = new Error('Invalid task ID format');
      err.statusCode = 400;
      throw err;
    }

    if (!VALID_TASK_STATUSES.includes(status)) {
      const err = new Error(`Status must be one of: ${VALID_TASK_STATUSES.join(', ')}`);
      err.statusCode = 400;
      throw err;
    }

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      const err = new Error('Task not found');
      err.statusCode = 404;
      throw err;
    }

    // Permission: Manager, Admin, Assignee, or Project Member
    const isParticipant = this.isProjectParticipant(currentUser, task.project);
    const isAssignee = task.assignedTo && String(task.assignedTo) === String(currentUser._id);

    if (!isParticipant && !isAssignee && currentUser.role !== 'ADMIN') {
      const err = new Error('You do not have permission to update the status of this task');
      err.statusCode = 403;
      throw err;
    }

    const oldStatus = task.status;
    task.status = status;
    if (status === 'DONE' && oldStatus !== 'DONE') {
      task.completedAt = new Date();
    } else if (status !== 'DONE' && oldStatus === 'DONE') {
      task.completedAt = null;
    }
    await task.save();

    activityService.createActivity({
      user: currentUser,
      type: status === 'DONE' ? 'TASK_COMPLETED' : 'TASK_STATUS_CHANGED',
      project: task.project._id,
      task: task._id,
      message: `${currentUser.name || 'User'} changed status of "${task.title}" to ${status}`,
    });

    // Notify project manager and task assignee
    const isCompletedStatus = status === 'DONE';
    const notifType = isCompletedStatus ? 'TASK_COMPLETED' : 'TASK_STATUS_CHANGED';
    const notifTitle = isCompletedStatus ? 'Task Completed' : 'Task Status Changed';
    const notifMessage = `${currentUser.name || 'User'} ${isCompletedStatus ? 'completed task' : 'changed status of'} "${task.title}"${isCompletedStatus ? '' : ' to ' + status}`;

    const recipients = new Set();
    const managerId = task.project?.manager?._id || task.project?.manager;
    if (managerId && String(managerId) !== String(currentUser._id)) {
      recipients.add(String(managerId));
    }
    if (task.assignedTo && String(task.assignedTo) !== String(currentUser._id)) {
      recipients.add(String(task.assignedTo));
    }

    for (const rId of recipients) {
      notificationService.createNotification({
        recipient: rId,
        type: notifType,
        title: notifTitle,
        message: notifMessage,
        relatedProject: task.project?._id || task.project,
        relatedTask: task._id,
        relatedUser: currentUser._id,
        link: `/tasks/${task._id}`,
      });
    }

    return Task.findById(task._id)
      .populate('project', 'name status priority')
      .populate('assignedTo', USER_SAFE_FIELDS)
      .populate('createdBy', USER_SAFE_FIELDS);
  }

  /**
   * Add a comment to task
   */
  async addComment(taskId, message, currentUser) {
    if (!isValidObjectId(taskId)) {
      const err = new Error('Invalid task ID format');
      err.statusCode = 400;
      throw err;
    }

    if (!message || typeof message !== 'string' || !message.trim()) {
      const err = new Error('Comment message cannot be empty');
      err.statusCode = 400;
      throw err;
    }

    if (message.trim().length > 1000) {
      const err = new Error('Comment cannot exceed 1000 characters');
      err.statusCode = 400;
      throw err;
    }

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      const err = new Error('Task not found');
      err.statusCode = 404;
      throw err;
    }

    // Check participation
    const isParticipant = this.isProjectParticipant(currentUser, task.project);
    const isAssignee = task.assignedTo && String(task.assignedTo) === String(currentUser._id);

    if (!isParticipant && !isAssignee && currentUser.role !== 'ADMIN') {
      const err = new Error('You do not have permission to comment on this task');
      err.statusCode = 403;
      throw err;
    }

    task.comments.push({
      user: currentUser._id,
      message: message.trim(),
      createdAt: new Date(),
    });

    await task.save();

    activityService.createActivity({
      user: currentUser,
      type: 'COMMENT_ADDED',
      project: task.project._id,
      task: task._id,
      message: `${currentUser.name || 'User'} commented on "${task.title}"`,
    });

    // Notify assignee and creator (excluding the commenting user)
    const commentRecipients = new Set();
    if (task.assignedTo && String(task.assignedTo) !== String(currentUser._id)) {
      commentRecipients.add(String(task.assignedTo));
    }
    const creatorId = task.createdBy?._id || task.createdBy;
    if (creatorId && String(creatorId) !== String(currentUser._id)) {
      commentRecipients.add(String(creatorId));
    }

    for (const rId of commentRecipients) {
      notificationService.createNotification({
        recipient: rId,
        type: 'COMMENT_ADDED',
        title: 'New Comment on Task',
        message: `${currentUser.name || 'User'} commented on "${task.title}"`,
        relatedProject: task.project?._id || task.project,
        relatedTask: task._id,
        relatedUser: currentUser._id,
        link: `/tasks/${task._id}`,
      });
    }

    return Task.findById(task._id)
      .populate('project', 'name status priority')
      .populate('assignedTo', USER_SAFE_FIELDS)
      .populate('createdBy', USER_SAFE_FIELDS)
      .populate('comments.user', USER_SAFE_FIELDS);
  }

  /**
   * Delete a comment from task
   */
  async deleteComment(taskId, commentId, currentUser) {
    if (!isValidObjectId(taskId) || !isValidObjectId(commentId)) {
      const err = new Error('Invalid ID format');
      err.statusCode = 400;
      throw err;
    }

    const task = await Task.findById(taskId).populate('project');
    if (!task) {
      const err = new Error('Task not found');
      err.statusCode = 404;
      throw err;
    }

    const comment = task.comments.id(commentId);
    if (!comment) {
      const err = new Error('Comment not found');
      err.statusCode = 404;
      throw err;
    }

    // Only comment author, project manager, or admin can delete
    const isAuthor = String(comment.user) === String(currentUser._id);
    const isManagerOrAdmin = this.isProjectManagerOrAdmin(currentUser, task.project);

    if (!isAuthor && !isManagerOrAdmin) {
      const err = new Error('You are not authorized to delete this comment');
      err.statusCode = 403;
      throw err;
    }

    comment.deleteOne();
    await task.save();

    return Task.findById(task._id)
      .populate('project', 'name status priority')
      .populate('assignedTo', USER_SAFE_FIELDS)
      .populate('createdBy', USER_SAFE_FIELDS)
      .populate('comments.user', USER_SAFE_FIELDS);
  }
}

module.exports = new TaskService();

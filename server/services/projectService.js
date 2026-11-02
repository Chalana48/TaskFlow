const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');
const activityService = require('./activityService');
const notificationService = require('./notificationService');

/**
 * Check if a user has management permissions over a specific project
 */
const canManageProject = (user, project) => {
  if (user.role === 'ADMIN') return true;
  const managerId = project.manager?._id || project.manager;
  return String(managerId) === String(user._id);
};

/**
 * Check if a user has view access to a specific project
 */
const canViewProject = (user, project) => {
  if (user.role === 'ADMIN') return true;
  const managerId = project.manager?._id || project.manager;
  if (String(managerId) === String(user._id)) return true;

  const memberIds = (project.members || []).map((m) => String(m._id || m));
  return memberIds.includes(String(user._id));
};

/**
 * Create a new project
 */
const createProject = async (user, projectData) => {
  const { name, description, status, priority, startDate, endDate, image } = projectData;

  const project = await Project.create({
    name: name.trim(),
    description: description.trim(),
    status: status || 'PLANNING',
    priority: priority || 'MEDIUM',
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    image: image || null,
    manager: user._id,
    members: [user._id], // Creator is also the first member
  });

  // Populate creator/manager details before returning
  const populated = await Project.findById(project._id)
    .populate('manager', 'name username email profileImage role')
    .populate('members', 'name username email profileImage role');

  activityService.createActivity({
    user,
    type: 'PROJECT_CREATED',
    project: project._id,
    message: `${user.name || 'User'} created project "${project.name}"`,
  });

  return populated;
};

/**
 * Retrieve projects with pagination, search, status/priority filters, and sorting
 */
const getProjects = async (user, queryParams = {}) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = '',
    priority = '',
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = queryParams;

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (parsedPage - 1) * parsedLimit;

  // 1. Build Base Visibility Query
  const query = {};
  if (user.role !== 'ADMIN') {
    query.$or = [{ manager: user._id }, { members: user._id }];
  }

  // 2. Search Filter (matches name or description)
  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$and = query.$and || [];
    query.$and.push({
      $or: [{ name: searchRegex }, { description: searchRegex }],
    });
  }

  // 3. Status Filter
  if (status && status.trim()) {
    query.status = status.toUpperCase().trim();
  }

  // 4. Priority Filter
  if (priority && priority.trim()) {
    query.priority = priority.toUpperCase().trim();
  }

  // 5. Sorting
  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const sortOptions = {};
  const allowedSortFields = ['name', 'status', 'priority', 'startDate', 'endDate', 'createdAt'];
  if (allowedSortFields.includes(sortBy)) {
    sortOptions[sortBy] = sortDirection;
  } else {
    sortOptions.createdAt = -1;
  }

  const [projects, total] = await Promise.all([
    Project.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parsedLimit)
      .populate('manager', 'name username email profileImage role')
      .populate('members', 'name username email profileImage role')
      .lean(),
    Project.countDocuments(query),
  ]);

  return {
    projects,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit) || 1,
    },
  };
};

/**
 * Retrieve single project by ID (with authorization check)
 */
const getProjectById = async (user, projectId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    const error = new Error('Invalid project identifier format');
    error.statusCode = 400;
    throw error;
  }

  const project = await Project.findById(projectId)
    .populate('manager', 'name username email profileImage role')
    .populate('members', 'name username email profileImage role');

  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization Check
  if (!canViewProject(user, project)) {
    const error = new Error('You do not have permission to view this project');
    error.statusCode = 403;
    throw error;
  }

  return project;
};

/**
 * Update project information (Manager or Admin only)
 */
const updateProject = async (user, projectId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    const error = new Error('Invalid project identifier format');
    error.statusCode = 400;
    throw error;
  }

  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization Check
  if (!canManageProject(user, project)) {
    const error = new Error('Forbidden: Only the project manager or an administrator can update this project');
    error.statusCode = 403;
    throw error;
  }

  const allowedUpdates = ['name', 'description', 'status', 'priority', 'startDate', 'endDate', 'image'];
  allowedUpdates.forEach((field) => {
    if (updateData[field] !== undefined) {
      if (field === 'startDate' || field === 'endDate') {
        project[field] = new Date(updateData[field]);
      } else if (typeof updateData[field] === 'string') {
        project[field] = updateData[field].trim();
      } else {
        project[field] = updateData[field];
      }
    }
  });

  // Re-verify date consistency
  if (project.endDate < project.startDate) {
    const error = new Error('Project end date cannot be earlier than start date');
    error.statusCode = 400;
    throw error;
  }

  await project.save();

  activityService.createActivity({
    user,
    type: 'PROJECT_UPDATED',
    project: project._id,
    message: `${user.name || 'User'} updated project "${project.name}"`,
  });

  // Notify project members (excluding the actor)
  const memberRecipients = (project.members || [])
    .map((m) => String(m._id || m))
    .filter((id) => id !== String(user._id));
  if (memberRecipients.length > 0) {
    notificationService.createNotificationsForUsers(memberRecipients, {
      type: 'PROJECT_UPDATED',
      title: 'Project Updated',
      message: `${user.name || 'User'} updated project "${project.name}"`,
      relatedProject: project._id,
      relatedUser: user._id,
      link: `/projects/${project._id}`,
    });
  }

  return await Project.findById(project._id)
    .populate('manager', 'name username email profileImage role')
    .populate('members', 'name username email profileImage role');
};

/**
 * Delete project (Manager or Admin only)
 */
const deleteProject = async (user, projectId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    const error = new Error('Invalid project identifier format');
    error.statusCode = 400;
    throw error;
  }

  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization Check
  if (!canManageProject(user, project)) {
    const error = new Error('Forbidden: Only the project manager or an administrator can delete this project');
    error.statusCode = 403;
    throw error;
  }

  await Project.findByIdAndDelete(projectId);
  return { id: projectId, name: project.name };
};

/**
 * Add member to project (Manager or Admin only)
 */
const addMember = async (user, projectId, memberUserId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(memberUserId)) {
    const error = new Error('Invalid project or user identifier');
    error.statusCode = 400;
    throw error;
  }

  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization Check
  if (!canManageProject(user, project)) {
    const error = new Error('Forbidden: Only the project manager or an administrator can add members');
    error.statusCode = 403;
    throw error;
  }

  // Check target user exists
  const targetUser = await User.findById(memberUserId);
  if (!targetUser) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (!targetUser.isActive) {
    const error = new Error('Cannot add inactive or suspended user to project');
    error.statusCode = 400;
    throw error;
  }

  // Prevent duplicate member
  const isAlreadyMember = project.members.some((m) => String(m) === String(memberUserId));
  if (isAlreadyMember) {
    const error = new Error('This user is already a member of the project');
    error.statusCode = 409;
    throw error;
  }

  project.members.push(memberUserId);
  await project.save();

  activityService.createActivity({
    user,
    type: 'PROJECT_UPDATED',
    project: project._id,
    message: `${user.name || 'User'} added ${targetUser.name} to project "${project.name}"`,
  });

  notificationService.createNotification({
    recipient: memberUserId,
    type: 'PROJECT_ADDED',
    title: 'Added to Project',
    message: `${user.name || 'User'} added you to project "${project.name}"`,
    relatedProject: project._id,
    relatedUser: user._id,
    link: `/projects/${project._id}`,
  });

  return await Project.findById(projectId)
    .populate('manager', 'name username email profileImage role')
    .populate('members', 'name username email profileImage role');
};

/**
 * Remove member from project (Manager or Admin only)
 */
const removeMember = async (user, projectId, memberUserId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(memberUserId)) {
    const error = new Error('Invalid project or user identifier');
    error.statusCode = 400;
    throw error;
  }

  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization Check
  if (!canManageProject(user, project)) {
    const error = new Error('Forbidden: Only the project manager or an administrator can remove members');
    error.statusCode = 403;
    throw error;
  }

  // Cannot remove assigned project manager
  if (String(project.manager) === String(memberUserId)) {
    const error = new Error('Cannot remove the project manager. Reassign the manager first.');
    error.statusCode = 400;
    throw error;
  }

  const memberIndex = project.members.findIndex((m) => String(m) === String(memberUserId));
  if (memberIndex === -1) {
    const error = new Error('User is not a member of this project');
    error.statusCode = 404;
    throw error;
  }

  project.members.splice(memberIndex, 1);
  await project.save();

  return await Project.findById(projectId)
    .populate('manager', 'name username email profileImage role')
    .populate('members', 'name username email profileImage role');
};

/**
 * Update project manager (Current Manager or Admin only)
 */
const updateProjectManager = async (user, projectId, newManagerUserId) => {
  if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(newManagerUserId)) {
    const error = new Error('Invalid project or user identifier');
    error.statusCode = 400;
    throw error;
  }

  const project = await Project.findById(projectId);
  if (!project) {
    const error = new Error('Project not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization Check
  if (!canManageProject(user, project)) {
    const error = new Error('Forbidden: Only the project manager or an administrator can reassign managers');
    error.statusCode = 403;
    throw error;
  }

  const newManager = await User.findById(newManagerUserId);
  if (!newManager) {
    const error = new Error('New manager user not found');
    error.statusCode = 404;
    throw error;
  }

  if (!newManager.isActive) {
    const error = new Error('Cannot assign an inactive or suspended user as project manager');
    error.statusCode = 400;
    throw error;
  }

  project.manager = newManager._id;

  // Ensure new manager is in members list
  const hasMember = project.members.some((m) => String(m) === String(newManager._id));
  if (!hasMember) {
    project.members.push(newManager._id);
  }

  await project.save();

  activityService.createActivity({
    user,
    type: 'PROJECT_UPDATED',
    project: project._id,
    message: `${user.name || 'User'} assigned ${newManager.name} as manager of "${project.name}"`,
  });

  if (String(newManager._id) !== String(user._id)) {
    notificationService.createNotification({
      recipient: newManager._id,
      type: 'PROJECT_MANAGER_CHANGED',
      title: 'Assigned as Project Manager',
      message: `${user.name || 'User'} assigned you as project manager of "${project.name}"`,
      relatedProject: project._id,
      relatedUser: user._id,
      link: `/projects/${project._id}`,
    });
  }

  return await Project.findById(projectId)
    .populate('manager', 'name username email profileImage role')
    .populate('members', 'name username email profileImage role');
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateProjectManager,
  canManageProject,
  canViewProject,
};

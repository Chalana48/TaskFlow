/**
 * Validation utility for Auth and User management endpoints
 */

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email.trim());
};

const validateUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return typeof username === 'string' && usernameRegex.test(username.trim());
};

const validateRegister = (data = {}) => {
  const errors = [];
  const { name, username, email, password } = data;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters long');
  } else if (name.trim().length > 50) {
    errors.push('Full name cannot exceed 50 characters');
  }

  if (!username || !validateUsername(username)) {
    errors.push('Username must be 3-30 characters long and contain only letters, numbers, and underscores');
  }

  if (!email || !validateEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateLogin = (data = {}) => {
  const errors = [];
  const { email, password } = data;

  if (!email || !validateEmail(email)) {
    errors.push('Please provide a valid email address');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateUpdateProfile = (data = {}) => {
  const errors = [];
  const { name, username } = data;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long');
    } else if (name.trim().length > 50) {
      errors.push('Full name cannot exceed 50 characters');
    }
  }

  if (username !== undefined) {
    if (!validateUsername(username)) {
      errors.push('Username must be 3-30 characters long and contain only letters, numbers, and underscores');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateChangePassword = (data = {}) => {
  const errors = [];
  const { currentPassword, newPassword } = data;

  if (!currentPassword || typeof currentPassword !== 'string') {
    errors.push('Current password is required');
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    errors.push('New password must be at least 6 characters long');
  }

  if (currentPassword && newPassword && currentPassword === newPassword) {
    errors.push('New password must be different from current password');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const VALID_STATUSES = ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED'];
const VALID_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const validateCreateProject = (data = {}) => {
  const errors = [];
  const { name, description, status, priority, startDate, endDate } = data;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Project name must be at least 2 characters long');
  } else if (name.trim().length > 100) {
    errors.push('Project name cannot exceed 100 characters');
  }

  if (!description || typeof description !== 'string' || description.trim().length < 5) {
    errors.push('Project description must be at least 5 characters long');
  } else if (description.trim().length > 1000) {
    errors.push('Project description cannot exceed 1000 characters');
  }

  if (status && !VALID_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  if (!startDate) {
    errors.push('Project start date is required');
  } else if (isNaN(Date.parse(startDate))) {
    errors.push('Start date must be a valid date format');
  }

  if (!endDate) {
    errors.push('Project end date is required');
  } else if (isNaN(Date.parse(endDate))) {
    errors.push('End date must be a valid date format');
  }

  if (startDate && endDate && !isNaN(Date.parse(startDate)) && !isNaN(Date.parse(endDate))) {
    if (new Date(endDate) < new Date(startDate)) {
      errors.push('Project end date cannot be earlier than start date');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateUpdateProject = (data = {}) => {
  const errors = [];
  const { name, description, status, priority, startDate, endDate } = data;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Project name must be at least 2 characters long');
    } else if (name.trim().length > 100) {
      errors.push('Project name cannot exceed 100 characters');
    }
  }

  if (description !== undefined) {
    if (typeof description !== 'string' || description.trim().length < 5) {
      errors.push('Project description must be at least 5 characters long');
    } else if (description.trim().length > 1000) {
      errors.push('Project description cannot exceed 1000 characters');
    }
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    errors.push(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  if (startDate !== undefined && isNaN(Date.parse(startDate))) {
    errors.push('Start date must be a valid date format');
  }

  if (endDate !== undefined && isNaN(Date.parse(endDate))) {
    errors.push('End date must be a valid date format');
  }

  if (startDate && endDate && !isNaN(Date.parse(startDate)) && !isNaN(Date.parse(endDate))) {
    if (new Date(endDate) < new Date(startDate)) {
      errors.push('Project end date cannot be earlier than start date');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const VALID_TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const VALID_TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const validateCreateTask = (data = {}) => {
  const errors = [];
  const { title, description, project, assignedTo, status, priority, dueDate, estimatedHours, labels } = data;

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    errors.push('Task title must be at least 2 characters long');
  } else if (title.trim().length > 150) {
    errors.push('Task title cannot exceed 150 characters');
  }

  if (description !== undefined && typeof description === 'string' && description.trim().length > 2000) {
    errors.push('Task description cannot exceed 2000 characters');
  }

  if (!project) {
    errors.push('Project reference is required');
  }

  if (status && !VALID_TASK_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${VALID_TASK_STATUSES.join(', ')}`);
  }

  if (priority && !VALID_TASK_PRIORITIES.includes(priority)) {
    errors.push(`Priority must be one of: ${VALID_TASK_PRIORITIES.join(', ')}`);
  }

  if (dueDate && isNaN(Date.parse(dueDate))) {
    errors.push('Due date must be a valid date format');
  }

  if (estimatedHours !== undefined && estimatedHours !== null && estimatedHours !== '') {
    const num = Number(estimatedHours);
    if (isNaN(num) || num < 0 || num > 1000) {
      errors.push('Estimated hours must be a number between 0 and 1000');
    }
  }

  if (labels !== undefined && !Array.isArray(labels)) {
    errors.push('Labels must be an array of strings');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateUpdateTask = (data = {}) => {
  const errors = [];
  const { title, description, assignedTo, status, priority, dueDate, estimatedHours, labels } = data;

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length < 2) {
      errors.push('Task title must be at least 2 characters long');
    } else if (title.trim().length > 150) {
      errors.push('Task title cannot exceed 150 characters');
    }
  }

  if (description !== undefined && typeof description === 'string' && description.trim().length > 2000) {
    errors.push('Task description cannot exceed 2000 characters');
  }

  if (status !== undefined && !VALID_TASK_STATUSES.includes(status)) {
    errors.push(`Status must be one of: ${VALID_TASK_STATUSES.join(', ')}`);
  }

  if (priority !== undefined && !VALID_TASK_PRIORITIES.includes(priority)) {
    errors.push(`Priority must be one of: ${VALID_TASK_PRIORITIES.join(', ')}`);
  }

  if (dueDate !== undefined && dueDate !== null && dueDate !== '' && isNaN(Date.parse(dueDate))) {
    errors.push('Due date must be a valid date format');
  }

  if (estimatedHours !== undefined && estimatedHours !== null && estimatedHours !== '') {
    const num = Number(estimatedHours);
    if (isNaN(num) || num < 0 || num > 1000) {
      errors.push('Estimated hours must be a number between 0 and 1000');
    }
  }

  if (labels !== undefined && !Array.isArray(labels)) {
    errors.push('Labels must be an array of strings');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateNotificationQuery = (query = {}) => {
  const errors = [];
  const { page, limit, isRead } = query;

  if (page !== undefined && page !== '') {
    const p = parseInt(page, 10);
    if (isNaN(p) || p < 1) {
      errors.push('Page must be a positive integer');
    }
  }

  if (limit !== undefined && limit !== '') {
    const l = parseInt(limit, 10);
    if (isNaN(l) || l < 1 || l > 100) {
      errors.push('Limit must be between 1 and 100');
    }
  }

  if (isRead !== undefined && isRead !== '' && isRead !== 'true' && isRead !== 'false' && typeof isRead !== 'boolean') {
    errors.push('isRead filter must be boolean (true or false)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const validateNotificationPreferences = (prefs = {}) => {
  const errors = [];
  const validKeys = [
    'taskAssigned',
    'taskStatusChanged',
    'taskCompleted',
    'comments',
    'projectUpdates',
    'deadlineReminders',
  ];

  if (typeof prefs !== 'object' || prefs === null || Array.isArray(prefs)) {
    return {
      isValid: false,
      errors: ['Preferences must be an object'],
    };
  }

  Object.entries(prefs).forEach(([key, val]) => {
    if (!validKeys.includes(key)) {
      errors.push(`Invalid preference category: ${key}`);
    } else if (typeof val !== 'boolean') {
      errors.push(`Preference ${key} must be a boolean value`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  validateEmail,
  validateUsername,
  validateRegister,
  validateLogin,
  validateUpdateProfile,
  validateChangePassword,
  validateCreateProject,
  validateUpdateProject,
  validateCreateTask,
  validateUpdateTask,
  validateNotificationQuery,
  validateNotificationPreferences,
  VALID_STATUSES,
  VALID_PRIORITIES,
  VALID_TASK_STATUSES,
  VALID_TASK_PRIORITIES,
};



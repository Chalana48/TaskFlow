const User = require('../models/User');

/**
 * Get profile details of authenticated user
 * @param {string} userId - User's ObjectId
 * @returns {Promise<Object>} Sanitized user profile object
 */
const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user.toSafeObject();
};

/**
 * Update authenticated user's profile
 * @param {string} userId - User's ObjectId
 * @param {Object} updateData - Fields to update (name, username, profileImage)
 * @returns {Promise<Object>} Updated sanitized user profile
 */
const updateProfile = async (userId, { name, username, profileImage }) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Check username uniqueness if changed
  if (username && username.toLowerCase().trim() !== user.username) {
    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) {
      const error = new Error('Username is already taken by another account');
      error.statusCode = 409;
      throw error;
    }
    user.username = username.toLowerCase().trim();
  }

  if (name && name.trim()) {
    user.name = name.trim();
  }

  if (profileImage !== undefined) {
    user.profileImage = profileImage;
  }

  // Security: Prevent normal users from altering their role or status through profile endpoint
  await user.save();
  return user.toSafeObject();
};

/**
 * Change authenticated user's password
 * @param {string} userId - User's ObjectId
 * @param {string} currentPassword - Existing plain-text password
 * @param {string} newPassword - New plain-text password
 * @returns {Promise<boolean>} True upon success
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    const error = new Error('Current password does not match our records');
    error.statusCode = 400;
    throw error;
  }

  // Assign new password (pre('save') hook will automatically hash it with a new salt)
  user.password = newPassword;
  await user.save();

  return true;
};

/**
 * Search active users for project member invitations
 * @param {string} currentUserId - Current user ID to exclude
 * @param {string} searchQuery - Search query string
 * @returns {Promise<Array>} List of matching active users
 */
const searchUsers = async (currentUserId, searchQuery = '') => {
  const query = { isActive: true };
  if (currentUserId) {
    query._id = { $ne: currentUserId };
  }
  if (searchQuery && searchQuery.trim()) {
    const regex = new RegExp(searchQuery.trim(), 'i');
    query.$or = [{ name: regex }, { username: regex }, { email: regex }];
  }
  const users = await User.find(query).limit(20).select('name username email role profileImage');
  return users;
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  searchUsers,
};


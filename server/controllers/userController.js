const userService = require('../services/userService');
const { validateUpdateProfile, validateChangePassword } = require('../utils/validators');

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.user._id);
    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile details
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { isValid, errors } = validateUpdateProfile(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    const updatedProfile = await userService.updateProfile(req.user._id, req.body);
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change user password
 * @route   PUT /api/users/password
 * @access  Private
 */
const changePassword = async (req, res, next) => {
  try {
    const { isValid, errors } = validateChangePassword(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    const { currentPassword, newPassword } = req.body;
    await userService.changePassword(req.user._id, currentPassword, newPassword);

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please keep your new credentials safe.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search active users (for team member selection)
 * @route   GET /api/users
 * @access  Private
 */
const searchUsers = async (req, res, next) => {
  try {
    const users = await userService.searchUsers(req.user._id, req.query.search);
    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  searchUsers,
};


const adminService = require('../services/adminService');

/**
 * @desc    Get admin dashboard aggregated summary statistics
 * @route   GET /api/admin/dashboard/overview
 * @access  Private (Admin only)
 */
const getDashboardOverview = async (req, res, next) => {
  try {
    const overview = await adminService.getDashboardOverview();
    return res.status(200).json({
      success: true,
      data: overview,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user registration trends over time
 * @route   GET /api/admin/dashboard/user-growth
 * @access  Private (Admin only)
 */
const getUserGrowth = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const growth = await adminService.getUserGrowth(days);
    return res.status(200).json({
      success: true,
      data: growth,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get project status and priority statistics
 * @route   GET /api/admin/dashboard/project-stats
 * @access  Private (Admin only)
 */
const getProjectStats = async (req, res, next) => {
  try {
    const stats = await adminService.getProjectStatistics();
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get task status, priority, and velocity statistics
 * @route   GET /api/admin/dashboard/task-stats
 * @access  Private (Admin only)
 */
const getTaskStats = async (req, res, next) => {
  try {
    const stats = await adminService.getTaskStatistics();
    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Search, filter, and paginate users
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
const getUsers = async (req, res, next) => {
  try {
    const result = await adminService.getUsers(req.query);
    return res.status(200).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user details, projects, assigned tasks, and recent activity
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin only)
 */
const getUserById = async (req, res, next) => {
  try {
    const details = await adminService.getUserById(req.params.id);
    return res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user status (ACTIVE / SUSPENDED)
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private (Admin only)
 */
const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Account status is required (ACTIVE or SUSPENDED)',
      });
    }

    const updatedUser = await adminService.updateUserStatus(
      req.params.id,
      status,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: `User account status successfully updated to ${status}`,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user role
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private (Admin only)
 */
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required (USER, PROJECT_MANAGER, or ADMIN)',
      });
    }

    const updatedUser = await adminService.updateUserRole(
      req.params.id,
      role,
      req.user
    );

    return res.status(200).json({
      success: true,
      message: `User role successfully updated to ${role}`,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Safely delete user and clean up project/task dependencies
 * @route   DELETE /api/admin/users/:id
 * @access  Private (Admin only)
 */
const deleteUser = async (req, res, next) => {
  try {
    const result = await adminService.deleteUser(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardOverview,
  getUserGrowth,
  getProjectStats,
  getTaskStats,
  getUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
};

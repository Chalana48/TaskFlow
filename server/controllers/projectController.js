const projectService = require('../services/projectService');
const { validateCreateProject, validateUpdateProject } = require('../utils/validators');

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Private
 */
const createProject = async (req, res, next) => {
  try {
    const { isValid, errors } = validateCreateProject(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    const project = await projectService.createProject(req.user, req.body);

    return res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all accessible projects (with search, filter, sort, pagination)
 * @route   GET /api/projects
 * @access  Private
 */
const getProjects = async (req, res, next) => {
  try {
    const result = await projectService.getProjects(req.user, req.query);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single project details by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProject = async (req, res, next) => {
  try {
    const project = await projectService.getProjectById(req.user, req.params.id);

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project information
 * @route   PUT /api/projects/:id
 * @access  Private (Manager or Admin)
 */
const updateProject = async (req, res, next) => {
  try {
    const { isValid, errors } = validateUpdateProject(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    const updated = await projectService.updateProject(req.user, req.params.id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private (Manager or Admin)
 */
const deleteProject = async (req, res, next) => {
  try {
    const result = await projectService.deleteProject(req.user, req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add member to project
 * @route   POST /api/projects/:id/members
 * @access  Private (Manager or Admin)
 */
const addMember = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the user ID to add as a member',
      });
    }

    const updated = await projectService.addMember(req.user, req.params.id, userId);

    return res.status(200).json({
      success: true,
      message: 'Member added to project successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove member from project
 * @route   DELETE /api/projects/:id/members/:userId
 * @access  Private (Manager or Admin)
 */
const removeMember = async (req, res, next) => {
  try {
    const updated = await projectService.removeMember(req.user, req.params.id, req.params.userId);

    return res.status(200).json({
      success: true,
      message: 'Member removed from project successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update project manager
 * @route   PATCH /api/projects/:id/manager
 * @access  Private (Manager or Admin)
 */
const updateManager = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide the user ID for the new project manager',
      });
    }

    const updated = await projectService.updateProjectManager(req.user, req.params.id, userId);

    return res.status(200).json({
      success: true,
      message: 'Project manager updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateManager,
};

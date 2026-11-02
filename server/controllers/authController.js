const authService = require('../services/authService');
const { validateRegister, validateLogin } = require('../utils/validators');
const { sendTokenResponse, clearTokenCookie } = require('../utils/generateToken');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    // 1. Validate request body
    const { isValid, errors } = validateRegister(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    // 2. Delegate to service
    const user = await authService.registerUser(req.body);

    // 3. Set cookie and send tokenized response
    return sendTokenResponse(user, 201, res, 'User registered successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    // 1. Validate request body
    const { isValid, errors } = validateLogin(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    // 2. Delegate to service
    const user = await authService.loginUser(req.body);

    // 3. Set cookie and send tokenized response
    return sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Log out current user & clear authentication cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = async (req, res) => {
  clearTokenCookie(res);
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

/**
 * @desc    Get currently authenticated user
 * @route   GET /api/auth/me
 * @access  Private (Requires valid JWT)
 */
const getMe = async (req, res, next) => {
  try {
    // User is already attached by authMiddleware protect()
    return res.status(200).json({
      success: true,
      data: req.user.toSafeObject ? req.user.toSafeObject() : req.user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
};

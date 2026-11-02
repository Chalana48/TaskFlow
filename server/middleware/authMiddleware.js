const jwt = require('jsonwebtoken');
const config = require('../config/env');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Validates JWT from HTTP-only cookie or Authorization Bearer header,
 * verifies user existence & active status, and attaches user to req.user.
 */
const protect = async (req, res, next) => {
  let token = null;

  // 1. Check HTTP-only cookie first (preferred browser approach)
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Fall back to Authorization Header (for API clients, Postman, automated tests)
  else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // If no token was found
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to continue.',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Fetch user from database
    const user = await User.findById(decoded.id).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account not found or has been removed.',
      });
    }

    // Check if account is active or suspended
    if (!user.isActive || user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated or suspended. Please contact administrator.',
      });
    }

    // Attach sanitized user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid authentication token. Authorization denied.',
    });
  }
};

module.exports = {
  protect,
};

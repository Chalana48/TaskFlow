const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Generate signed JSON Web Token
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} role - User's system role
 * @returns {string} Signed JWT string
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    {
      id: userId,
      role: role,
    },
    config.jwtSecret,
    {
      expiresIn: config.jwtExpiresIn,
    }
  );
};

/**
 * Generate token, set secure HTTP-only cookie, and send JSON response
 * @param {Object} user - User document instance
 * @param {number} statusCode - HTTP status code
 * @param {Object} res - Express response object
 * @param {string} message - Response message
 */
const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id, user.role);

  const cookieOptions = {
    httpOnly: true, // Prevents client-side JS from reading cookie (XSS defense)
    secure: config.nodeEnv === 'production', // Only send over HTTPS in production
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax', // CSRF defense
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  };

  res.cookie('token', token, cookieOptions);

  return res.status(statusCode).json({
    success: true,
    message,
    token, // Also returned in body for non-browser clients (Postman/mobile)
    data: user.toSafeObject ? user.toSafeObject() : user,
  });
};

/**
 * Clear authentication cookie
 * @param {Object} res - Express response object
 */
const clearTokenCookie = (res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'none' : 'lax',
  });
};

module.exports = {
  generateToken,
  sendTokenResponse,
  clearTokenCookie,
};

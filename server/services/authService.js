const User = require('../models/User');

/**
 * Register a new user account
 * @param {Object} userData - User registration payload
 * @returns {Promise<User>} Newly created user document
 */
const registerUser = async ({ name, username, email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedUsername = username.toLowerCase().trim();

  // 1. Check for existing email
  const existingEmail = await User.findOne({ email: normalizedEmail });
  if (existingEmail) {
    const error = new Error('An account with this email address already exists');
    error.statusCode = 409;
    throw error;
  }

  // 2. Check for existing username
  const existingUsername = await User.findOne({ username: normalizedUsername });
  if (existingUsername) {
    const error = new Error('This username is already taken. Please choose another');
    error.statusCode = 409;
    throw error;
  }

  // 3. Create user (explicitly enforce USER role for public signups)
  const user = await User.create({
    name: name.trim(),
    username: normalizedUsername,
    email: normalizedEmail,
    password,
    role: 'USER', // Security: strictly prevent public role escalation
    isActive: true,
  });

  return user;
};

/**
 * Authenticate existing user with credentials
 * @param {Object} credentials - Email and password
 * @returns {Promise<User>} Authenticated user document
 */
const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Find user by email, explicitly including password field
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  // Generic message for security (prevents user enumeration)
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // 2. Verify account is active and not suspended
  if (!user.isActive || user.status === 'SUSPENDED') {
    const error = new Error('Account has been deactivated or suspended. Please contact support.');
    error.statusCode = 403;
    throw error;
  }

  // 3. Verify password match via bcrypt instance method
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  return user;
};

/**
 * Retrieve user by ID
 * @param {string} userId - User's ObjectId
 * @returns {Promise<Object>} Sanitized user object
 */
const getUserById = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user.toSafeObject();
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
};

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [
        /^[a-zA-Z0-9_]+$/,
        'Username can only contain letters, numbers, and underscores',
      ],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Ensures password hash is excluded from query results by default
    },
    role: {
      type: String,
      enum: {
        values: ['USER', 'PROJECT_MANAGER', 'ADMIN'],
        message: '{VALUE} is not a supported role',
      },
      default: 'USER',
    },
    profileImage: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: {
        values: ['ACTIVE', 'SUSPENDED'],
        message: '{VALUE} is not a valid account status',
      },
      default: 'ACTIVE',
    },
    notificationPreferences: {
      taskAssigned: { type: Boolean, default: true },
      taskStatusChanged: { type: Boolean, default: true },
      taskCompleted: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      projectUpdates: { type: Boolean, default: true },
      deadlineReminders: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/**
 * Pre-save middleware to hash password before saving to MongoDB
 */
userSchema.pre('save', async function (next) {
  // Only hash password if it has been modified or is new
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare plain-text password with stored hashed password
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Helper to return sanitized safe user object
 */
userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    username: this.username,
    email: this.email,
    role: this.role,
    profileImage: this.profileImage,
    isActive: this.isActive,
    status: this.status || (this.isActive ? 'ACTIVE' : 'SUSPENDED'),
    notificationPreferences: this.notificationPreferences || {
      taskAssigned: true,
      taskStatusChanged: true,
      taskCompleted: true,
      comments: true,
      projectUpdates: true,
      deadlineReminders: true,
    },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Database indexes for fast querying, filtering and sorting
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User;

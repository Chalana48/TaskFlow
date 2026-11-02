const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Activity must be linked to a user'],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: [
          'PROJECT_CREATED',
          'PROJECT_UPDATED',
          'TASK_CREATED',
          'TASK_UPDATED',
          'TASK_ASSIGNED',
          'TASK_COMPLETED',
          'TASK_STATUS_CHANGED',
          'COMMENT_ADDED',
          'USER_ROLE_CHANGED',
          'USER_STATUS_CHANGED',
          'USER_DELETED',
        ],
        message: '{VALUE} is not a valid activity type',
      },
      required: [true, 'Activity type is required'],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
      index: true,
    },
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Activity message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for high-performance timeline retrieval
activitySchema.index({ createdAt: -1 });
activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);

module.exports = Activity;

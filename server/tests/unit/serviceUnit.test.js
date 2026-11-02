const mongoose = require('mongoose');
const User = require('../../models/User');
const Project = require('../../models/Project');
const Task = require('../../models/Task');
const Activity = require('../../models/Activity');
const { Notification } = require('../../models/Notification');
const authService = require('../../services/authService');
const projectService = require('../../services/projectService');
const taskService = require('../../services/taskService');
const dashboardService = require('../../services/dashboardService');
const notificationService = require('../../services/notificationService');
const adminService = require('../../services/adminService');
const validators = require('../../utils/validators');

describe('TaskFlow Phase 8: Service-Level Unit Testing Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('1. Input Validators Unit Tests', () => {
    it('validates email formats correctly', () => {
      expect(validators.validateEmail('valid.user@taskflow.dev')).toBe(true);
      expect(validators.validateEmail('invalid-email')).toBe(false);
      expect(validators.validateEmail('')).toBe(false);
      expect(validators.validateEmail(null)).toBe(false);
    });

    it('validates username alphanumeric requirements and length constraints', () => {
      expect(validators.validateUsername('john_doe_99')).toBe(true);
      expect(validators.validateUsername('ab')).toBe(false); // too short
      expect(validators.validateUsername('user!invalid')).toBe(false); // special char
      expect(validators.validateUsername('a'.repeat(35))).toBe(false); // too long
    });

    it('validates user registration payload', () => {
      const valid = validators.validateRegister({
        name: 'Alex Johnson',
        username: 'alex_j',
        email: 'alex@taskflow.dev',
        password: 'Password123',
      });
      expect(valid.isValid).toBe(true);
      expect(valid.errors.length).toBe(0);

      const invalid = validators.validateRegister({
        name: 'A',
        username: 'a',
        email: 'bademail',
        password: '123',
      });
      expect(invalid.isValid).toBe(false);
      expect(invalid.errors.length).toBeGreaterThanOrEqual(4);
    });

    it('validates project dates and bounds', () => {
      const invalidDates = validators.validateCreateProject({
        name: 'Beta Project',
        description: 'Testing invalid dates',
        startDate: '2026-10-15',
        endDate: '2026-10-10', // before start date
      });
      expect(invalidDates.isValid).toBe(false);
      expect(invalidDates.errors.some((e) => e.includes('earlier than start date'))).toBe(true);
    });

    it('validates task priority and status boundaries', () => {
      const invalidTask = validators.validateCreateTask({
        title: 'Task Title',
        project: new mongoose.Types.ObjectId().toString(),
        status: 'NON_EXISTENT_STATUS',
        priority: 'IMPOSSIBLE_PRIORITY',
        estimatedHours: 9999,
      });
      expect(invalidTask.isValid).toBe(false);
      expect(invalidTask.errors.length).toBeGreaterThanOrEqual(3);
    });

    it('validates notification preference schemas', () => {
      const validPrefs = validators.validateNotificationPreferences({
        taskAssigned: true,
        taskCompleted: false,
      });
      expect(validPrefs.isValid).toBe(true);

      const invalidPrefs = validators.validateNotificationPreferences({
        unknownKey: true,
      });
      expect(invalidPrefs.isValid).toBe(false);
    });
  });

  describe('2. Authentication & Password Logic Unit Tests', () => {
    it('throws error when user does not exist in login', async () => {
      jest.spyOn(User, 'findOne').mockReturnValue({
        select: () => Promise.resolve(null),
      });

      await expect(
        authService.loginUser({ email: 'nonexistent@taskflow.dev', password: 'password' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('throws 403 when user is suspended or inactive', async () => {
      const suspendedUser = {
        _id: new mongoose.Types.ObjectId().toString(),
        email: 'suspended@taskflow.dev',
        isActive: false,
        status: 'SUSPENDED',
      };

      jest.spyOn(User, 'findOne').mockReturnValue({
        select: () => Promise.resolve(suspendedUser),
      });

      await expect(
        authService.loginUser({ email: 'suspended@taskflow.dev', password: 'password' })
      ).rejects.toThrow('Account has been deactivated or suspended');
    });

    it('validates password mismatch during login', async () => {
      const activeUser = {
        _id: new mongoose.Types.ObjectId().toString(),
        email: 'active@taskflow.dev',
        isActive: true,
        status: 'ACTIVE',
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      jest.spyOn(User, 'findOne').mockReturnValue({
        select: () => Promise.resolve(activeUser),
      });

      await expect(
        authService.loginUser({ email: 'active@taskflow.dev', password: 'wrongpassword' })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('3. Notification Service Logic Unit Tests', () => {
    it('respects user notification preferences', () => {
      const user = {
        notificationPreferences: {
          taskAssigned: false,
          taskCompleted: true,
        },
      };

      expect(notificationService.shouldSendNotification(user, 'TASK_ASSIGNED')).toBe(false);
      expect(notificationService.shouldSendNotification(user, 'TASK_COMPLETED')).toBe(true);
      expect(notificationService.shouldSendNotification(user, 'SYSTEM')).toBe(true);
    });

    it('does not send self-directed notifications unless forced', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const res = await notificationService.createNotification({
        recipient: userId,
        relatedUser: userId,
        type: 'COMMENT_ADDED',
        title: 'New comment',
        message: 'You commented',
        force: false,
      });

      expect(res).toBeNull();
    });

    it('marks all recipient notifications as read', async () => {
      const recipientId = new mongoose.Types.ObjectId().toString();
      jest.spyOn(Notification, 'updateMany').mockResolvedValue({ modifiedCount: 5 });
      jest.spyOn(Notification, 'countDocuments').mockResolvedValue(0);

      const res = await notificationService.markAllNotificationsAsRead(recipientId);
      expect(res.modifiedCount).toBe(5);
    });
  });

  describe('4. Dashboard Analytics & Aggregation Logic Unit Tests', () => {
    it('aggregates overdue tasks when dueDate is in the past', async () => {
      const userId = new mongoose.Types.ObjectId().toString();
      const user = { _id: userId, role: 'USER' };

      jest.spyOn(Project, 'find').mockReturnValue({
        select: () => Promise.resolve([{ _id: 'proj1' }]),
      });

      jest.spyOn(Project, 'aggregate').mockResolvedValue([
        {
          statusCounts: [{ _id: 'ACTIVE', count: 3 }],
          totalCount: [{ count: 3 }],
        },
      ]);

      jest.spyOn(Task, 'aggregate').mockResolvedValue([
        {
          statusCounts: [{ _id: 'DONE', count: 7 }],
          overdueCount: [{ count: 4 }],
          myTasksCount: [{ count: 3 }],
          totalCount: [{ count: 15 }],
        },
      ]);

      const overview = await dashboardService.getOverview(user);
      expect(overview.totalTasks).toBe(15);
      expect(overview.completedTasks).toBe(7);
      expect(overview.overdueTasks).toBe(4);
    });
  });

  describe('5. Administration & Governance Logic Unit Tests', () => {
    it('prevents demoting an admin when there is only one active administrator', async () => {
      const targetAdmin = {
        _id: new mongoose.Types.ObjectId().toString(),
        name: 'Single Admin',
        role: 'ADMIN',
        status: 'ACTIVE',
      };

      jest.spyOn(User, 'findById').mockResolvedValue(targetAdmin);
      jest.spyOn(User, 'countDocuments').mockResolvedValue(0); // 0 other active admins

      await expect(
        adminService.updateUserRole(targetAdmin._id, 'USER', targetAdmin)
      ).rejects.toThrow('Cannot demote or remove the last active administrator');
    });

    it('prevents deleting a user who manages active projects', async () => {
      const targetUser = {
        _id: new mongoose.Types.ObjectId().toString(),
        name: 'Active PM',
        role: 'PROJECT_MANAGER',
      };
      const callerAdmin = {
        _id: new mongoose.Types.ObjectId().toString(),
        name: 'Admin Caller',
        role: 'ADMIN',
      };

      jest.spyOn(User, 'findById').mockResolvedValue(targetUser);
      jest.spyOn(Project, 'countDocuments').mockResolvedValue(2); // Manages 2 projects

      await expect(
        adminService.deleteUser(targetUser._id, callerAdmin)
      ).rejects.toThrow('managing 2 active project(s)');
    });
  });
});

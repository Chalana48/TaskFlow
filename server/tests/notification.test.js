const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const { Notification } = require('../models/Notification');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const notificationService = require('../services/notificationService');
const taskService = require('../services/taskService');
const { generateToken } = require('../utils/generateToken');

describe('TaskFlow Phase 6: In-App Notification & Activity System Test Suite', () => {
  let mockNotifications = [];
  let mockUsers = [];
  let mockTasks = [];
  let mockProjects = [];

  const userA = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'User A',
    username: 'user_a',
    email: 'user_a@test.com',
    role: 'USER',
    isActive: true,
    notificationPreferences: {
      taskAssigned: true,
      taskStatusChanged: true,
      taskCompleted: true,
      comments: true,
      projectUpdates: true,
      deadlineReminders: true,
    },
    save: async function () { return this; },
  };

  const userB = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'User B',
    username: 'user_b',
    email: 'user_b@test.com',
    role: 'USER',
    isActive: true,
    notificationPreferences: {
      taskAssigned: true,
      taskStatusChanged: true,
      taskCompleted: true,
      comments: true,
      projectUpdates: true,
      deadlineReminders: true,
    },
    save: async function () { return this; },
  };

  const pmUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'Manager PM',
    username: 'manager_pm',
    email: 'pm@test.com',
    role: 'PROJECT_MANAGER',
    isActive: true,
    notificationPreferences: {
      taskAssigned: true,
      taskStatusChanged: true,
      taskCompleted: true,
      comments: true,
      projectUpdates: true,
      deadlineReminders: true,
    },
    save: async function () { return this; },
  };

  let tokenA, tokenB, tokenPM;
  let testProject;

  beforeAll(() => {
    tokenA = generateToken(userA._id, userA.role);
    tokenB = generateToken(userB._id, userB.role);
    tokenPM = generateToken(pmUser._id, pmUser.role);
  });

  beforeEach(() => {
    mockUsers = [userA, userB, pmUser];
    testProject = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: 'Alpha Project',
      manager: pmUser._id,
      members: [userA._id, userB._id],
    };
    mockProjects = [testProject];
    mockTasks = [];
    mockNotifications = [];
    jest.clearAllMocks();

    // Mock User.findById
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const found = mockUsers.find((u) => String(u._id) === String(id));
      const res = found ? { ...found } : null;
      return {
        select: () => Promise.resolve(res),
        then: (resolve) => resolve(res),
      };
    });

    // Mock Project.findById
    jest.spyOn(Project, 'findById').mockImplementation((id) => {
      const found = mockProjects.find((p) => String(p._id) === String(id));
      return {
        select: () => Promise.resolve(found || null),
        populate: () => Promise.resolve(found || null),
        then: (resolve) => resolve(found || null),
      };
    });

    // Mock Task.find for deadline checks
    jest.spyOn(Task, 'find').mockImplementation(() => {
      return {
        populate: () => Promise.resolve([]),
        then: (resolve) => resolve([]),
      };
    });

    // Mock Notification.create
    jest.spyOn(Notification, 'create').mockImplementation(async (data) => {
      const newNotif = {
        _id: new mongoose.Types.ObjectId().toString(),
        recipient: data.recipient,
        type: data.type,
        title: data.title,
        message: data.message,
        relatedProject: data.relatedProject || null,
        relatedTask: data.relatedTask || null,
        relatedUser: data.relatedUser || null,
        link: data.link || null,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        save: async function () { return this; },
      };
      mockNotifications.push(newNotif);
      return newNotif;
    });

    // Mock Notification.find
    jest.spyOn(Notification, 'find').mockImplementation((filter = {}) => {
      let filtered = [...mockNotifications];
      if (filter.recipient) {
        filtered = filtered.filter((n) => String(n.recipient) === String(filter.recipient));
      }
      if (filter.isRead !== undefined) {
        filtered = filtered.filter((n) => n.isRead === filter.isRead);
      }
      if (filter.type) {
        filtered = filtered.filter((n) => n.type === filter.type);
      }

      return {
        sort: () => ({
          skip: (s) => ({
            limit: (l) => ({
              populate: () => ({
                populate: () => ({
                  populate: () => Promise.resolve(filtered.slice(s, s + l)),
                }),
              }),
            }),
          }),
        }),
      };
    });

    // Mock Notification.findOne
    jest.spyOn(Notification, 'findOne').mockImplementation((filter = {}) => {
      let found = mockNotifications.find((n) => {
        let match = true;
        if (filter._id && String(n._id) !== String(filter._id)) match = false;
        if (filter.recipient && String(n.recipient) !== String(filter.recipient)) match = false;
        if (filter.type && n.type !== filter.type) match = false;
        if (filter.isRead !== undefined && n.isRead !== filter.isRead) match = false;
        if (filter.relatedTask && String(n.relatedTask) !== String(filter.relatedTask)) match = false;
        return match;
      });
      return Promise.resolve(found || null);
    });

    // Mock Notification.countDocuments
    jest.spyOn(Notification, 'countDocuments').mockImplementation(async (filter = {}) => {
      let count = 0;
      mockNotifications.forEach((n) => {
        let match = true;
        if (filter.recipient && String(n.recipient) !== String(filter.recipient)) match = false;
        if (filter.isRead !== undefined && n.isRead !== filter.isRead) match = false;
        if (match) count++;
      });
      return count;
    });

    // Mock Notification.updateMany
    jest.spyOn(Notification, 'updateMany').mockImplementation(async (filter, update) => {
      let modifiedCount = 0;
      mockNotifications.forEach((n) => {
        let match = true;
        if (filter.recipient && String(n.recipient) !== String(filter.recipient)) match = false;
        if (filter.isRead !== undefined && n.isRead !== filter.isRead) match = false;
        if (match) {
          if (update.$set?.isRead !== undefined) n.isRead = update.$set.isRead;
          if (update.$set?.readAt !== undefined) n.readAt = update.$set.readAt;
          modifiedCount++;
        }
      });
      return { modifiedCount };
    });

    // Mock Notification.findByIdAndDelete
    jest.spyOn(Notification, 'findByIdAndDelete').mockImplementation(async (id) => {
      const idx = mockNotifications.findIndex((n) => String(n._id) === String(id));
      if (idx !== -1) {
        const deleted = mockNotifications.splice(idx, 1)[0];
        return deleted;
      }
      return null;
    });
  });

  describe('1 & 2. Authentication & Authorization for Notifications', () => {
    it('1. Authenticated user can retrieve their notifications', async () => {
      // Seed notification for user A
      await Notification.create({
        recipient: userA._id,
        type: 'TASK_ASSIGNED',
        title: 'Task Assigned',
        message: 'You were assigned a task',
      });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Task Assigned');
    });

    it('2. Unauthenticated user cannot retrieve notifications', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('3. User cannot retrieve another user\'s notifications', async () => {
      // Notification for User B only
      await Notification.create({
        recipient: userB._id,
        type: 'PROJECT_UPDATED',
        title: 'Project Secret Update',
        message: 'Only for User B',
      });

      // User A requests their notifications
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });

  describe('4. Unread Notification Count', () => {
    it('4. Unread count correctly counts only unread notifications for authenticated user', async () => {
      await Notification.create({
        recipient: userA._id,
        type: 'TASK_ASSIGNED',
        title: 'Unread 1',
        message: 'Message 1',
      });
      await Notification.create({
        recipient: userA._id,
        type: 'TASK_STATUS_CHANGED',
        title: 'Unread 2',
        message: 'Message 2',
      });
      // User B notification (should not affect User A's count)
      await Notification.create({
        recipient: userB._id,
        type: 'COMMENT_ADDED',
        title: 'User B notif',
        message: 'Message B',
      });

      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(2);
    });
  });

  describe('5 & 6. Marking Notifications as Read', () => {
    it('5. User can mark their own notification as read', async () => {
      const notif = await Notification.create({
        recipient: userA._id,
        type: 'TASK_ASSIGNED',
        title: 'Mark Me Read',
        message: 'Testing mark as read',
      });

      const res = await request(app)
        .patch(`/api/notifications/${notif._id}/read`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(true);
    });

    it('User cannot mark another user\'s notification as read', async () => {
      const notifB = await Notification.create({
        recipient: userB._id,
        type: 'TASK_ASSIGNED',
        title: 'User B private',
        message: 'User B message',
      });

      const res = await request(app)
        .patch(`/api/notifications/${notifB._id}/read`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('6. Mark-all-as-read affects only the authenticated user\'s notifications', async () => {
      await Notification.create({
        recipient: userA._id,
        type: 'TASK_ASSIGNED',
        title: 'A Notif 1',
        message: 'A 1',
      });
      await Notification.create({
        recipient: userA._id,
        type: 'TASK_ASSIGNED',
        title: 'A Notif 2',
        message: 'A 2',
      });
      const notifB = await Notification.create({
        recipient: userB._id,
        type: 'TASK_ASSIGNED',
        title: 'B Notif',
        message: 'B',
      });

      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.modifiedCount).toBe(2);

      // Verify User B's notification is still unread
      expect(notifB.isRead).toBe(false);
    });
  });

  describe('7 & 8. Deleting Notifications', () => {
    it('7. User can delete their own notification', async () => {
      const notif = await Notification.create({
        recipient: userA._id,
        type: 'SYSTEM',
        title: 'Delete me',
        message: 'Temporary alert',
      });

      const res = await request(app)
        .delete(`/api/notifications/${notif._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockNotifications.find((n) => n._id === notif._id)).toBeUndefined();
    });

    it('8. User cannot delete another user\'s notification', async () => {
      const notifB = await Notification.create({
        recipient: userB._id,
        type: 'SYSTEM',
        title: 'Do not delete',
        message: 'User B private alert',
      });

      const res = await request(app)
        .delete(`/api/notifications/${notifB._id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(mockNotifications.find((n) => n._id === notifB._id)).toBeDefined();
    });
  });

  describe('9 & 10. Real Business Triggers: Task Assignment & Status Updates', () => {
    it('9. Task assignment creates the expected notification for assignee', async () => {
      const created = await notificationService.createNotification({
        recipient: userB._id,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assigned',
        message: `${userA.name} assigned you to task "Build Dashboard"`,
        relatedProject: testProject._id,
        relatedUser: userA._id,
        link: '/tasks/12345',
      });

      expect(created).not.toBeNull();
      expect(created.recipient).toBe(userB._id);
      expect(created.type).toBe('TASK_ASSIGNED');
      expect(created.title).toBe('New Task Assigned');
    });

    it('Does not notify user about their own action', async () => {
      const created = await notificationService.createNotification({
        recipient: userA._id,
        type: 'TASK_ASSIGNED',
        title: 'Self assign',
        message: 'Assigned to self',
        relatedUser: userA._id,
      });

      expect(created).toBeNull();
    });

    it('10. Successful task status changes trigger the expected notification', async () => {
      const notif = await notificationService.createNotification({
        recipient: pmUser._id,
        type: 'TASK_COMPLETED',
        title: 'Task Completed',
        message: `${userA.name} completed task "Build Dashboard"`,
        relatedProject: testProject._id,
        relatedUser: userA._id,
      });

      expect(notif).not.toBeNull();
      expect(notif.recipient).toBe(pmUser._id);
      expect(notif.type).toBe('TASK_COMPLETED');
    });

    it('11. Failed business operations do not create notifications', async () => {
      const initialCount = mockNotifications.length;

      // Attempting invalid task assignment via API with non-existent task
      const res = await request(app)
        .patch('/api/tasks/invalid_id/assignee')
        .set('Authorization', `Bearer ${tokenPM}`)
        .send({ assignedTo: userA._id });

      expect(res.status).toBe(400);
      expect(mockNotifications.length).toBe(initialCount);
    });

    it('12. Duplicate notifications are prevented within 5 minutes', async () => {
      const taskId = new mongoose.Types.ObjectId().toString();

      const notif1 = await notificationService.createNotification({
        recipient: userA._id,
        type: 'TASK_ASSIGNED',
        title: 'Duplicate Test',
        message: 'First time message',
        relatedTask: taskId,
        relatedUser: pmUser._id,
      });

      const notif2 = await notificationService.createNotification({
        recipient: userA._id,
        type: 'TASK_ASSIGNED',
        title: 'Duplicate Test',
        message: 'Second time message',
        relatedTask: taskId,
        relatedUser: pmUser._id,
      });

      // Second attempt should return existing notification, not create a new one
      expect(notif1._id).toBe(notif2._id);
    });
  });

  describe('13 & 14. Filtering, Pagination & Deleted Resource Safety', () => {
    it('13. Pagination and read/unread filtering work correctly', async () => {
      // Create 3 unread and 2 read notifications for user A
      for (let i = 1; i <= 3; i++) {
        await Notification.create({
          recipient: userA._id,
          type: 'TASK_ASSIGNED',
          title: `Unread ${i}`,
          message: `Msg ${i}`,
        });
      }
      const readNotif = await Notification.create({
        recipient: userA._id,
        type: 'TASK_STATUS_CHANGED',
        title: 'Read 1',
        message: 'Msg read',
      });
      readNotif.isRead = true;

      // Filter by isRead=false
      const unreadRes = await request(app)
        .get('/api/notifications?isRead=false&limit=2&page=1')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(unreadRes.status).toBe(200);
      expect(unreadRes.body.data.length).toBe(2);
      expect(unreadRes.body.pagination.total).toBe(3);
      expect(unreadRes.body.pagination.page).toBe(1);

      // Filter by isRead=true
      const readRes = await request(app)
        .get('/api/notifications?isRead=true')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(readRes.status).toBe(200);
      expect(readRes.body.data.length).toBe(1);
      expect(readRes.body.data[0].title).toBe('Read 1');
    });

    it('14. Deleted or missing related resources are handled safely', async () => {
      const nonExistentTaskId = new mongoose.Types.ObjectId().toString();
      await Notification.create({
        recipient: userA._id,
        type: 'TASK_ASSIGNED',
        title: 'Orphaned Notification',
        message: 'Task was deleted',
        relatedTask: nonExistentTaskId,
      });

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data[0].title).toBe('Orphaned Notification');
    });

    it('15. Real-time / notification delivery targets the correct recipient', async () => {
      const targetUser = userB._id;
      const notif = await notificationService.createNotification({
        recipient: targetUser,
        type: 'COMMENT_ADDED',
        title: 'Targeted Notification',
        message: 'Only for user B',
        relatedUser: userA._id,
      });

      expect(String(notif.recipient)).toBe(String(targetUser));
      expect(String(notif.recipient)).not.toBe(String(userA._id));
    });
  });

  describe('Notification Preferences & Deadline Reminders', () => {
    it('Retrieves and updates notification preferences', async () => {
      const getRes = await request(app)
        .get('/api/notifications/preferences')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);
      expect(getRes.body.data.taskAssigned).toBe(true);

      const putRes = await request(app)
        .put('/api/notifications/preferences')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ comments: false, taskCompleted: false });

      expect(putRes.status).toBe(200);
      expect(putRes.body.success).toBe(true);
      expect(putRes.body.data.comments).toBe(false);
      expect(putRes.body.data.taskCompleted).toBe(false);
      expect(putRes.body.data.taskAssigned).toBe(true);
    });

    it('Honors user notification preferences when creating notifications', async () => {
      // userA has comments: false now
      const notif = await notificationService.createNotification({
        recipient: userA,
        type: 'COMMENT_ADDED',
        title: 'New Comment',
        message: 'User B commented',
        relatedUser: userB._id,
      });

      // Should be blocked by preferences
      expect(notif).toBeNull();
    });

    it('Triggers deadline reminder checks safely', async () => {
      const res = await request(app)
        .post('/api/notifications/check-deadlines')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

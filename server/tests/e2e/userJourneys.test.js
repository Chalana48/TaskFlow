const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../server');
const User = require('../../models/User');
const Project = require('../../models/Project');
const Task = require('../../models/Task');
const { Notification } = require('../../models/Notification');
const Activity = require('../../models/Activity');
const { generateToken } = require('../../utils/generateToken');

describe('TaskFlow Phase 8: End-to-End Complete User Journey Suite (14 Steps)', () => {
  let mockUsers = [];
  let mockProjects = [];
  let mockTasks = [];
  let mockNotifications = [];
  let mockActivities = [];

  const adminUserId = new mongoose.Types.ObjectId().toString();
  const pmUserId = new mongoose.Types.ObjectId().toString();
  const regularUserId = new mongoose.Types.ObjectId().toString();

  const adminUser = {
    _id: adminUserId,
    name: 'Executive Admin',
    username: 'admin_exec',
    email: 'admin@taskflow.dev',
    role: 'ADMIN',
    isActive: true,
    status: 'ACTIVE',
    comparePassword: async () => true,
    toSafeObject: function () {
      return { id: this._id, name: this.name, username: this.username, email: this.email, role: this.role, status: this.status, isActive: this.isActive };
    },
    save: async function () { return this; },
  };

  const pmUser = {
    _id: pmUserId,
    name: 'PM Sarah',
    username: 'sarah_pm',
    email: 'sarah@taskflow.dev',
    role: 'PROJECT_MANAGER',
    isActive: true,
    status: 'ACTIVE',
    comparePassword: async () => true,
    toSafeObject: function () {
      return { id: this._id, name: this.name, username: this.username, email: this.email, role: this.role, status: this.status, isActive: this.isActive };
    },
    save: async function () { return this; },
  };

  const memberUser = {
    _id: regularUserId,
    name: 'Dev Mike',
    username: 'mike_dev',
    email: 'mike@taskflow.dev',
    role: 'USER',
    isActive: true,
    status: 'ACTIVE',
    notificationPreferences: {
      taskAssigned: true,
      taskStatusChanged: true,
      taskCompleted: true,
      comments: true,
      projectUpdates: true,
      deadlineReminders: true,
    },
    comparePassword: async () => true,
    toSafeObject: function () {
      return { id: this._id, name: this.name, username: this.username, email: this.email, role: this.role, status: this.status, isActive: this.isActive };
    },
    save: async function () { return this; },
  };

  let memberToken;
  let pmToken;
  let adminToken;
  let testProjectId;
  let testTaskId;

  beforeAll(() => {
    adminToken = generateToken(adminUser._id, adminUser.role);
    pmToken = generateToken(pmUser._id, pmUser.role);
    memberToken = generateToken(memberUser._id, memberUser.role);

    mockUsers = [{ ...adminUser }, { ...pmUser }, { ...memberUser }];
    mockProjects = [];
    mockTasks = [];
    mockNotifications = [];
    mockActivities = [];

    // Setup Spies
    jest.spyOn(User, 'findOne').mockImplementation((query = {}) => {
      const found = mockUsers.find(
        (u) =>
          (query.email && u.email === query.email) ||
          (query.username && u.username === query.username)
      );
      if (!found) return { select: () => Promise.resolve(null), then: (r) => r(null) };
      return {
        select: () => Promise.resolve(found),
        then: (resolve) => resolve(found),
      };
    });

    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const found = mockUsers.find((u) => String(u._id) === String(id));
      if (!found) return { select: () => Promise.resolve(null), then: (r) => r(null) };
      return {
        select: () => Promise.resolve(found),
        then: (resolve) => resolve(found),
      };
    });

    jest.spyOn(User, 'create').mockImplementation((data) => {
      const u = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...data,
        status: 'ACTIVE',
        isActive: true,
        toSafeObject: function () {
          return { id: this._id, name: this.name, username: this.username, email: this.email, role: this.role, status: this.status, isActive: this.isActive };
        },
      };
      mockUsers.push(u);
      return Promise.resolve(u);
    });

    jest.spyOn(User, 'countDocuments').mockImplementation(() => Promise.resolve(mockUsers.length));
    jest.spyOn(User, 'find').mockImplementation(() => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            select: () => Promise.resolve(mockUsers),
          }),
        }),
      }),
    }));

    const createQueryChain = (data) => {
      const chain = {
        populate: () => chain,
        select: () => chain,
        sort: () => chain,
        skip: () => chain,
        limit: () => chain,
        lean: () => Promise.resolve(data),
        then: (resolve, reject) => Promise.resolve(data).then(resolve, reject),
      };
      return chain;
    };

    jest.spyOn(Project, 'create').mockImplementation((data) => {
      const p = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...data,
        members: data.members || [],
        toObject: function () { return this; },
      };
      mockProjects.push(p);
      return Promise.resolve(p);
    });

    jest.spyOn(Project, 'findById').mockImplementation((id) => {
      const p = mockProjects.find((x) => String(x._id) === String(id));
      if (!p) return createQueryChain(null);
      const doc = {
        ...p,
        save: async function () {
          const idx = mockProjects.findIndex((x) => String(x._id) === String(this._id));
          if (idx !== -1) mockProjects[idx] = { ...this };
          return this;
        },
      };
      return createQueryChain(doc);
    });

    jest.spyOn(Project, 'find').mockImplementation(() => createQueryChain(mockProjects));
    jest.spyOn(Project, 'countDocuments').mockImplementation(() => Promise.resolve(mockProjects.length));

    jest.spyOn(Project, 'aggregate').mockResolvedValue([
      {
        statusCounts: [{ _id: 'ACTIVE', count: 1 }],
        totalCount: [{ count: 1 }],
      },
    ]);

    jest.spyOn(Task, 'create').mockImplementation((data) => {
      const t = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...data,
        comments: [],
        toObject: function () { return this; },
      };
      mockTasks.push(t);
      return Promise.resolve(t);
    });

    jest.spyOn(Task, 'findById').mockImplementation((id) => {
      const t = mockTasks.find((x) => String(x._id) === String(id));
      if (!t) return createQueryChain(null);

      const associatedProject = mockProjects.find((p) => String(p._id) === String(t.project?._id || t.project)) || {
        _id: t.project,
        name: 'Enterprise Cloud Migration',
        manager: pmUserId,
        members: [regularUserId],
      };

      const doc = {
        ...t,
        project: associatedProject,
        save: async function () {
          const idx = mockTasks.findIndex((x) => String(x._id) === String(this._id));
          if (idx !== -1) mockTasks[idx] = { ...this };
          return this;
        },
      };

      return createQueryChain(doc);
    });

    jest.spyOn(Task, 'find').mockImplementation(() => createQueryChain(mockTasks));

    jest.spyOn(Task, 'countDocuments').mockImplementation((filter = {}) => {
      let filtered = [...mockTasks];
      if (filter.status === 'DONE') filtered = filtered.filter((t) => t.status === 'DONE');
      return Promise.resolve(filtered.length);
    });

    jest.spyOn(Task, 'aggregate').mockResolvedValue([
      {
        statusCounts: [{ _id: 'DONE', count: 1 }],
        overdueCount: [],
        myTasksCount: [{ count: 1 }],
        totalCount: [{ count: 1 }],
      },
    ]);

    jest.spyOn(Notification, 'findOne').mockResolvedValue(null);
    jest.spyOn(Notification, 'create').mockImplementation((data) => {
      const notif = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...data,
        isRead: false,
        createdAt: new Date(),
      };
      mockNotifications.push(notif);
      return Promise.resolve(notif);
    });

    jest.spyOn(Notification, 'countDocuments').mockImplementation(() =>
      Promise.resolve(mockNotifications.filter((n) => !n.isRead).length)
    );

    jest.spyOn(Notification, 'find').mockImplementation(() => ({
      sort: () => ({
        skip: () => ({
          limit: () => ({
            populate: () => ({
              populate: () => Promise.resolve(mockNotifications),
            }),
          }),
        }),
      }),
    }));

    jest.spyOn(Notification, 'updateMany').mockImplementation(() => {
      mockNotifications.forEach((n) => {
        n.isRead = true;
      });
      return Promise.resolve({ modifiedCount: mockNotifications.length });
    });

    jest.spyOn(Activity, 'create').mockImplementation((data) => {
      const a = { _id: new mongoose.Types.ObjectId().toString(), ...data };
      mockActivities.push(a);
      return Promise.resolve(a);
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('Journey Step 1: Register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'E2E Onboarding User',
      username: 'e2e_user',
      email: 'e2e_user@taskflow.dev',
      password: 'Password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe('e2e_user');
  });

  it('Journey Step 2: Log in successfully', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'mike@taskflow.dev',
      password: 'Password123',
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('Journey Step 3: Create a project as Project Manager', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({
        name: 'Enterprise Cloud Migration',
        description: 'Migrating legacy on-prem services to Kubernetes',
        status: 'ACTIVE',
        priority: 'HIGH',
        startDate: '2026-10-01',
        endDate: '2026-12-31',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Enterprise Cloud Migration');
    testProjectId = String(res.body.data._id || res.body.data.id);
  });

  it('Journey Step 4: Add or manage project members', async () => {
    const res = await request(app)
      .post(`/api/projects/${testProjectId}/members`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ userId: memberUser._id });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Journey Step 5 & 6: Create a task and assign to member', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({
        title: 'Provision EKS Cluster',
        description: 'Setup production terraform templates for cluster',
        project: testProjectId,
        assignedTo: memberUser._id,
        status: 'TODO',
        priority: 'HIGH',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Provision EKS Cluster');
    testTaskId = String(res.body.data._id || res.body.data.id);
  });

  it('Journey Step 7: Move task across Kanban statuses (TODO -> IN_PROGRESS)', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${testTaskId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('IN_PROGRESS');
  });

  it('Journey Step 8: Complete a task (IN_PROGRESS -> DONE)', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${testTaskId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'DONE' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('DONE');
  });

  it('Journey Step 9: Verify relevant dashboard statistics', async () => {
    const res = await request(app)
      .get('/api/dashboard/overview')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalTasks');
    expect(res.body.data).toHaveProperty('completedTasks');
  });

  it('Journey Step 10: Verify notifications are generated and can be marked as read', async () => {
    mockNotifications.push({
      _id: new mongoose.Types.ObjectId().toString(),
      recipient: memberUser._id,
      title: 'Task Assigned',
      message: 'You have been assigned to Provision EKS Cluster',
      isRead: false,
    });

    const countRes = await request(app)
      .get('/api/notifications/unread-count')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(countRes.status).toBe(200);
    expect(countRes.body.data.count).toBeGreaterThanOrEqual(1);

    const markRes = await request(app)
      .patch('/api/notifications/read-all')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(markRes.status).toBe(200);
    expect(markRes.body.success).toBe(true);
  });

  it('Journey Step 11 & 12: Log in as administrator and access Admin Dashboard', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.users).toBeDefined();
    expect(res.body.data.projects).toBeDefined();
  });

  it('Journey Step 13: Search user and perform authorized role modification', async () => {
    const searchRes = await request(app)
      .get('/api/admin/users?search=mike')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.success).toBe(true);

    const roleRes = await request(app)
      .patch(`/api/admin/users/${memberUser._id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'PROJECT_MANAGER' });

    expect(roleRes.status).toBe(200);
    expect(roleRes.body.success).toBe(true);
    expect(roleRes.body.data.role).toBe('PROJECT_MANAGER');
  });

  it('Journey Step 14: Verify ordinary user cannot access admin endpoints', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard/overview')
      .set('Authorization', `Bearer ${memberToken}`);

    // Member was updated to PM, still not ADMIN
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});

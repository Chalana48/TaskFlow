const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const { Notification } = require('../models/Notification');
const { generateToken } = require('../utils/generateToken');

describe('TaskFlow Phase 7: Admin Dashboard & User Management Test Suite', () => {
  let mockUsers = [];
  let mockProjects = [];
  let mockTasks = [];
  let mockActivities = [];
  let mockNotifications = [];

  const adminUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'Master Admin',
    username: 'admin_master',
    email: 'admin@taskflow.dev',
    role: 'ADMIN',
    isActive: true,
    status: 'ACTIVE',
    toSafeObject: function () {
      return {
        id: this._id,
        name: this.name,
        username: this.username,
        email: this.email,
        role: this.role,
        isActive: this.isActive,
        status: this.status,
      };
    },
    save: async function () {
      return this;
    },
  };

  const secondAdminUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'Second Admin',
    username: 'admin_second',
    email: 'admin2@taskflow.dev',
    role: 'ADMIN',
    isActive: true,
    status: 'ACTIVE',
    toSafeObject: function () {
      return {
        id: this._id,
        name: this.name,
        username: this.username,
        email: this.email,
        role: this.role,
        isActive: this.isActive,
        status: this.status,
      };
    },
    save: async function () {
      return this;
    },
  };

  const pmUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'Project Manager Bob',
    username: 'pm_bob',
    email: 'bob@taskflow.dev',
    role: 'PROJECT_MANAGER',
    isActive: true,
    status: 'ACTIVE',
    toSafeObject: function () {
      return {
        id: this._id,
        name: this.name,
        username: this.username,
        email: this.email,
        role: this.role,
        isActive: this.isActive,
        status: this.status,
      };
    },
    save: async function () {
      return this;
    },
  };

  const regularUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'Alice Member',
    username: 'alice_member',
    email: 'alice@taskflow.dev',
    role: 'USER',
    isActive: true,
    status: 'ACTIVE',
    toSafeObject: function () {
      return {
        id: this._id,
        name: this.name,
        username: this.username,
        email: this.email,
        role: this.role,
        isActive: this.isActive,
        status: this.status,
      };
    },
    save: async function () {
      return this;
    },
  };

  let adminToken;
  let secondAdminToken;
  let pmToken;
  let regularToken;

  beforeAll(() => {
    adminToken = generateToken(adminUser._id, adminUser.role);
    secondAdminToken = generateToken(secondAdminUser._id, secondAdminUser.role);
    pmToken = generateToken(pmUser._id, pmUser.role);
    regularToken = generateToken(regularUser._id, regularUser.role);
  });

  beforeEach(() => {
    mockUsers = [
      { ...adminUser },
      { ...secondAdminUser },
      { ...pmUser },
      { ...regularUser },
    ];

    mockProjects = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        name: 'Project Neptune',
        description: 'Deep sea exploration software',
        manager: pmUser._id,
        members: [regularUser._id],
        status: 'ACTIVE',
        priority: 'HIGH',
      },
    ];

    mockTasks = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        title: 'Calibrate sonar sensors',
        project: mockProjects[0]._id,
        assignedTo: regularUser._id,
        createdBy: pmUser._id,
        status: 'DONE',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 86400000),
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        title: 'Review pressure hull blueprints',
        project: mockProjects[0]._id,
        assignedTo: regularUser._id,
        createdBy: pmUser._id,
        status: 'TODO',
        priority: 'CRITICAL',
        dueDate: new Date(Date.now() - 86400000 * 2), // Overdue
      },
    ];

    mockActivities = [];
    mockNotifications = [];

    jest.clearAllMocks();

    // Mock User queries
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const found = mockUsers.find((u) => String(u._id) === String(id));
      if (!found) {
        return {
          select: () => Promise.resolve(null),
          then: (resolve) => resolve(null),
        };
      }
      const userCopy = {
        ...found,
        save: async function () {
          const idx = mockUsers.findIndex((u) => String(u._id) === String(this._id));
          if (idx !== -1) mockUsers[idx] = { ...this };
          return this;
        },
        toSafeObject: function () {
          return {
            id: this._id,
            name: this.name,
            username: this.username,
            email: this.email,
            role: this.role,
            isActive: this.isActive,
            status: this.status || (this.isActive ? 'ACTIVE' : 'SUSPENDED'),
          };
        },
      };
      return {
        select: (fields) => ({
          ...userCopy,
          then: (res) => res(userCopy),
        }),
        then: (resolve) => resolve(userCopy),
      };
    });

    jest.spyOn(User, 'countDocuments').mockImplementation((filter = {}) => {
      let filtered = [...mockUsers];
      if (filter.role) {
        filtered = filtered.filter((u) => u.role === filter.role);
      }
      if (filter._id && filter._id.$ne) {
        filtered = filtered.filter((u) => String(u._id) !== String(filter._id.$ne));
      }
      if (filter.$or) {
        filtered = filtered.filter((u) => {
          return filter.$or.some((cond) => {
            if (cond.status) return u.status === cond.status;
            if (cond.isActive !== undefined) return u.isActive === cond.isActive;
            return false;
          });
        });
      }
      return Promise.resolve(filtered.length);
    });

    jest.spyOn(User, 'find').mockImplementation((filter = {}) => {
      let filtered = [...mockUsers];
      if (filter.role) filtered = filtered.filter((u) => u.role === filter.role);
      if (filter.$or) {
        filtered = filtered.filter((u) => {
          return filter.$or.some((cond) => {
            if (cond.name) return cond.name.test(u.name);
            if (cond.email) return cond.email.test(u.email);
            if (cond.username) return cond.username.test(u.username);
            return false;
          });
        });
      }
      return {
        sort: () => ({
          skip: (skipCount) => ({
            limit: (limitCount) => ({
              select: () =>
                Promise.resolve(
                  filtered.slice(skipCount, skipCount + limitCount).map((u) => ({
                    ...u,
                    toSafeObject: () => ({
                      id: u._id,
                      name: u.name,
                      username: u.username,
                      email: u.email,
                      role: u.role,
                      isActive: u.isActive,
                      status: u.status,
                    }),
                  }))
                ),
            }),
          }),
        }),
      };
    });

    jest.spyOn(User, 'aggregate').mockImplementation(() => {
      return Promise.resolve([
        { _id: new Date().toISOString().split('T')[0], count: 4 },
      ]);
    });

    jest.spyOn(User, 'findByIdAndDelete').mockImplementation((id) => {
      const idx = mockUsers.findIndex((u) => String(u._id) === String(id));
      if (idx !== -1) {
        const deleted = mockUsers.splice(idx, 1)[0];
        return Promise.resolve(deleted);
      }
      return Promise.resolve(null);
    });

    // Mock Project queries
    jest.spyOn(Project, 'countDocuments').mockImplementation((filter = {}) => {
      let filtered = [...mockProjects];
      if (filter.status) {
        if (typeof filter.status === 'string') {
          filtered = filtered.filter((p) => p.status === filter.status);
        } else if (filter.status.$in) {
          filtered = filtered.filter((p) => filter.status.$in.includes(p.status));
        }
      }
      if (filter.manager) {
        filtered = filtered.filter((p) => String(p.manager) === String(filter.manager));
      }
      return Promise.resolve(filtered.length);
    });

    jest.spyOn(Project, 'aggregate').mockImplementation(() => {
      return Promise.resolve([
        { _id: 'ACTIVE', count: 1 },
      ]);
    });

    jest.spyOn(Project, 'find').mockImplementation(() => ({
      select: () => ({
        populate: () => ({
          lean: () => Promise.resolve(mockProjects),
        }),
      }),
    }));

    jest.spyOn(Project, 'updateMany').mockImplementation((filter, update) => {
      return Promise.resolve({ modifiedCount: 1 });
    });

    // Mock Task queries
    jest.spyOn(Task, 'countDocuments').mockImplementation((filter = {}) => {
      let filtered = [...mockTasks];
      if (filter.status) {
        if (typeof filter.status === 'string') {
          filtered = filtered.filter((t) => t.status === filter.status);
        } else if (filter.status.$ne) {
          filtered = filtered.filter((t) => t.status !== filter.status.$ne);
        }
      }
      if (filter.dueDate && filter.dueDate.$lt) {
        filtered = filtered.filter((t) => t.dueDate && t.dueDate < filter.dueDate.$lt);
      }
      return Promise.resolve(filtered.length);
    });

    jest.spyOn(Task, 'aggregate').mockImplementation(() => {
      return Promise.resolve([
        { _id: 'DONE', count: 1 },
        { _id: 'TODO', count: 1 },
      ]);
    });

    jest.spyOn(Task, 'find').mockImplementation(() => ({
      select: () => ({
        populate: () => ({
          lean: () => Promise.resolve(mockTasks),
        }),
      }),
    }));

    jest.spyOn(Task, 'updateMany').mockImplementation((filter, update) => {
      return Promise.resolve({ modifiedCount: 1 });
    });

    // Mock Activity & Notification
    jest.spyOn(Activity, 'create').mockImplementation((data) => {
      const record = { _id: new mongoose.Types.ObjectId().toString(), ...data };
      mockActivities.push(record);
      return Promise.resolve(record);
    });

    jest.spyOn(Activity, 'find').mockImplementation(() => ({
      sort: () => ({
        limit: () => ({
          populate: () => ({
            populate: () => ({
              lean: () => Promise.resolve(mockActivities),
            }),
          }),
        }),
      }),
    }));

    jest.spyOn(Notification, 'findOne').mockResolvedValue(null);

    jest.spyOn(Notification, 'create').mockImplementation((data) => {
      const notif = { _id: new mongoose.Types.ObjectId().toString(), ...data };
      mockNotifications.push(notif);
      return Promise.resolve(notif);
    });

    jest.spyOn(Notification, 'deleteMany').mockImplementation((filter) => {
      return Promise.resolve({ deletedCount: 1 });
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('1. Admin Authorization & Security (RBAC Protection)', () => {
    it('allows authenticated administrator to access dashboard overview', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toBeDefined();
      expect(res.body.data.projects).toBeDefined();
      expect(res.body.data.tasks).toBeDefined();
    });

    it('rejects ordinary users with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/overview')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('rejects project managers with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/overview')
        .set('Authorization', `Bearer ${pmToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/admin/dashboard/overview');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Admin Dashboard Aggregation Services & Statistics', () => {
    it('returns user growth time-series data', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/user-growth?days=7')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('date');
      expect(res.body.data[0]).toHaveProperty('newUsers');
    });

    it('returns project statistics by status and priority', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/project-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('byStatus');
      expect(res.body.data).toHaveProperty('byPriority');
    });

    it('returns task statistics by status and priority', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard/task-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('byStatus');
      expect(res.body.data).toHaveProperty('byPriority');
    });
  });

  describe('3. User Management Search, Filter & Pagination', () => {
    it('returns paginated list of users without exposing passwords', async () => {
      const res = await request(app)
        .get('/api/admin/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);

      // Verify password hashes are never exposed
      res.body.data.forEach((u) => {
        expect(u.password).toBeUndefined();
      });
    });

    it('returns comprehensive user details including project and task summary', async () => {
      const res = await request(app)
        .get(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.projects).toBeDefined();
      expect(res.body.data.tasks).toBeDefined();
      expect(res.body.data.taskSummary).toBeDefined();
      expect(res.body.data.taskSummary).toHaveProperty('completionRate');
    });
  });

  describe('4. Role Management & Safeguards', () => {
    it('allows admin to change user role and logs activity & notification', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${regularUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'PROJECT_MANAGER' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('PROJECT_MANAGER');
      expect(mockActivities.some((a) => a.type === 'USER_ROLE_CHANGED')).toBe(true);
      expect(mockNotifications.some((n) => n.type === 'ROLE_UPDATED')).toBe(true);
    });

    it('validates role and rejects unsupported role values', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${regularUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'SUPER_HERO' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('prevents demoting the last active administrator', async () => {
      // Temporarily simulate only 1 active admin
      mockUsers = mockUsers.filter((u) => u._id !== secondAdminUser._id);

      const res = await request(app)
        .patch(`/api/admin/users/${adminUser._id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'USER' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('last active administrator');
    });

    it('prevents ordinary users from calling role update endpoint', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${regularUser._id}/role`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ role: 'ADMIN' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('5. Account Status Management (Suspend & Restore)', () => {
    it('allows admin to suspend an account and logs activity', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${regularUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SUSPENDED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUSPENDED');
      expect(mockActivities.some((a) => a.type === 'USER_STATUS_CHANGED')).toBe(true);
      expect(mockNotifications.some((n) => n.type === 'ACCOUNT_STATUS_CHANGED')).toBe(true);
    });

    it('prevents an administrator from suspending their own account', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${adminUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'SUSPENDED' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('cannot suspend your own');
    });

    it('allows admin to restore a suspended account to ACTIVE', async () => {
      const res = await request(app)
        .patch(`/api/admin/users/${regularUser._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'ACTIVE' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACTIVE');
    });

    it('prevents suspended users from authenticating in protect middleware', async () => {
      // Simulate user marked as SUSPENDED
      const suspendedUser = {
        _id: regularUser._id,
        name: 'Suspended Alice',
        role: 'USER',
        isActive: false,
        status: 'SUSPENDED',
      };
      mockUsers = mockUsers.map((u) =>
        String(u._id) === String(suspendedUser._id) ? suspendedUser : u
      );

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('deactivated or suspended');
    });
  });

  describe('6. Safe User Deletion Strategy', () => {
    it('prevents an administrator from deleting their own account', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${adminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('cannot delete your own');
    });

    it('prevents deleting the last active administrator', async () => {
      // Mock countDocuments to simulate that target admin is the only active admin remaining
      jest.spyOn(User, 'countDocuments').mockImplementation((filter = {}) => {
        if (filter.role === 'ADMIN' && filter._id && filter._id.$ne) {
          return Promise.resolve(0);
        }
        return Promise.resolve(2);
      });

      const res = await request(app)
        .delete(`/api/admin/users/${secondAdminUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('last active administrator');
    });

    it('prevents deleting a user who manages active projects', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${pmUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('currently managing');
    });

    it('safely deletes ordinary user and cleans up project/task dependencies', async () => {
      const res = await request(app)
        .delete(`/api/admin/users/${regularUser._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('deleted safely');
      expect(mockActivities.some((a) => a.type === 'USER_DELETED')).toBe(true);
    });
  });
});

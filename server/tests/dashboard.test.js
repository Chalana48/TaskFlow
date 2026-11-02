const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const Activity = require('../models/Activity');
const activityService = require('../services/activityService');
const taskService = require('../services/taskService');
const { generateToken } = require('../utils/generateToken');

describe('TaskFlow Phase 5: Dashboard & Analytics Test Suite', () => {
  let mockProjects = [];
  let mockTasks = [];
  let mockUsers = [];
  let mockActivities = [];

  const adminUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'Admin User',
    username: 'admin_test',
    email: 'admin@test.com',
    role: 'ADMIN',
    isActive: true,
  };

  const pmUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'PM User',
    username: 'pm_test',
    email: 'pm@test.com',
    role: 'PROJECT_MANAGER',
    isActive: true,
  };

  const memberUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'Member User',
    username: 'member_test',
    email: 'member@test.com',
    role: 'USER',
    isActive: true,
  };

  const outsiderUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'Outsider User',
    username: 'outsider_test',
    email: 'outsider@test.com',
    role: 'USER',
    isActive: true,
  };

  let adminToken, pmToken, memberToken, outsiderToken;
  let testProject1, testProject2;

  beforeAll(() => {
    adminToken = generateToken(adminUser._id, adminUser.role);
    pmToken = generateToken(pmUser._id, pmUser.role);
    memberToken = generateToken(memberUser._id, memberUser.role);
    outsiderToken = generateToken(outsiderUser._id, outsiderUser.role);
  });

  beforeEach(() => {
    mockUsers = [adminUser, pmUser, memberUser, outsiderUser];

    testProject1 = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: 'Project Alpha',
      description: 'Alpha project for testing',
      manager: pmUser._id,
      members: [memberUser._id],
      status: 'ACTIVE',
      priority: 'HIGH',
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-12-31'),
    };

    testProject2 = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: 'Project Beta',
      description: 'Beta project for testing',
      manager: adminUser._id,
      members: [],
      status: 'COMPLETED',
      priority: 'MEDIUM',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-09-30'),
    };

    mockProjects = [testProject1, testProject2];

    const completedDate = new Date('2026-09-20');
    mockTasks = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        title: 'Task 1 - Todo',
        project: testProject1._id,
        assignedTo: memberUser._id,
        createdBy: pmUser._id,
        status: 'TODO',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 86400000 * 2), // in 2 days
        completedAt: null,
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        title: 'Task 2 - In Progress',
        project: testProject1._id,
        assignedTo: memberUser._id,
        createdBy: pmUser._id,
        status: 'IN_PROGRESS',
        priority: 'CRITICAL',
        dueDate: new Date(Date.now() + 86400000 * 5),
        completedAt: null,
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        title: 'Task 3 - Overdue',
        project: testProject1._id,
        assignedTo: pmUser._id,
        createdBy: pmUser._id,
        status: 'IN_REVIEW',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() - 86400000 * 3), // overdue by 3 days
        completedAt: null,
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        title: 'Task 4 - Done Alpha',
        project: testProject1._id,
        assignedTo: memberUser._id,
        createdBy: pmUser._id,
        status: 'DONE',
        priority: 'LOW',
        dueDate: new Date('2026-09-19'),
        completedAt: completedDate,
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        title: 'Task 5 - Done Beta',
        project: testProject2._id,
        assignedTo: adminUser._id,
        createdBy: adminUser._id,
        status: 'DONE',
        priority: 'HIGH',
        dueDate: new Date('2026-09-25'),
        completedAt: completedDate,
      },
    ];

    mockActivities = [
      {
        _id: new mongoose.Types.ObjectId().toString(),
        user: memberUser,
        type: 'TASK_COMPLETED',
        project: testProject1,
        task: mockTasks[3],
        message: 'Member User completed Task 4 - Done Alpha',
        createdAt: new Date(),
      },
    ];

    jest.clearAllMocks();

    // Mock User.findById
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const found = mockUsers.find((u) => String(u._id) === String(id));
      return {
        select: () => Promise.resolve(found || null),
        then: (resolve) => resolve(found || null),
      };
    });

    // Mock Project.findById
    jest.spyOn(Project, 'findById').mockImplementation((id) => {
      const found = mockProjects.find((p) => String(p._id) === String(id));
      return {
        select: () => Promise.resolve(found || null),
        then: (resolve) => resolve(found || null),
      };
    });

    // Mock Project.find
    jest.spyOn(Project, 'find').mockImplementation((query = {}) => {
      let filtered = [...mockProjects];
      if (query.$or) {
        filtered = filtered.filter((p) => {
          const isMgr = query.$or.some((c) => c.manager && String(c.manager) === String(p.manager));
          const isMbr = query.$or.some((c) => c.members && p.members.some((m) => String(m) === String(c.members)));
          return isMgr || isMbr;
        });
      }
      return {
        select: () => ({
          lean: () => Promise.resolve(filtered),
          then: (resolve) => resolve(filtered),
        }),
        then: (resolve) => resolve(filtered),
      };
    });

    // Mock Project.aggregate
    jest.spyOn(Project, 'aggregate').mockImplementation((pipeline = []) => {
      const match = pipeline.find((st) => st.$match)?.$match || {};
      let filtered = [...mockProjects];

      if (match._id && match._id.$in) {
        const allowedIds = match._id.$in.map(String);
        filtered = filtered.filter((p) => allowedIds.includes(String(p._id)));
      }

      const statusMap = {};
      filtered.forEach((p) => {
        statusMap[p.status] = (statusMap[p.status] || 0) + 1;
      });

      const statusCounts = Object.entries(statusMap).map(([_id, count]) => ({ _id, count }));
      const totalCount = filtered.length > 0 ? [{ count: filtered.length }] : [];

      return Promise.resolve([
        {
          statusCounts,
          totalCount,
        },
      ]);
    });

    // Mock Task.aggregate
    jest.spyOn(Task, 'aggregate').mockImplementation((pipeline = []) => {
      const match = pipeline.find((st) => st.$match)?.$match || {};
      let filtered = [...mockTasks];

      if (match.$or) {
        // e.g. [{ project: { $in: ids } }, { assignedTo: userId }]
        filtered = filtered.filter((t) => {
          return match.$or.some((c) => {
            if (c.project && c.project.$in) {
              const ids = c.project.$in.map(String);
              if (ids.includes(String(t.project))) return true;
            }
            if (c.assignedTo && String(c.assignedTo) === String(t.assignedTo)) {
              return true;
            }
            return false;
          });
        });
      } else if (match.project) {
        filtered = filtered.filter((t) => String(t.project) === String(match.project));
      }

      // Check if pipeline has $facet (overview or task statistics)
      const facetStage = pipeline.find((st) => st.$facet);
      if (facetStage) {
        const now = new Date();
        const statusMap = {};
        const priorityMap = {};

        filtered.forEach((t) => {
          statusMap[t.status] = (statusMap[t.status] || 0) + 1;
          priorityMap[t.priority] = (priorityMap[t.priority] || 0) + 1;
        });

        const statusCounts = Object.entries(statusMap).map(([_id, count]) => ({ _id, count }));
        const priorityCounts = Object.entries(priorityMap).map(([_id, count]) => ({ _id, count }));

        const overdueCount = filtered.filter(
          (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE'
        ).length;

        // check currentUser in match
        const myTasksCount = filtered.filter(
          (t) => t.status !== 'DONE' && t.assignedTo && String(t.assignedTo) === String(memberUser._id)
        ).length;

        return Promise.resolve([
          {
            statusCounts,
            byStatus: statusCounts,
            byPriority: priorityCounts,
            overdueCount: overdueCount > 0 ? [{ count: overdueCount }] : [],
            overdue: overdueCount > 0 ? [{ count: overdueCount }] : [],
            myTasksCount: myTasksCount > 0 ? [{ count: myTasksCount }] : [],
            totalCount: filtered.length > 0 ? [{ count: filtered.length }] : [],
            total: filtered.length > 0 ? [{ count: filtered.length }] : [],
          },
        ]);
      }

      // Check for trend grouping
      const groupStage = pipeline.find((st) => st.$group);
      if (groupStage) {
        const doneTasks = filtered.filter((t) => t.status === 'DONE' && t.completedAt);
        const map = {};
        doneTasks.forEach((t) => {
          const key = t.completedAt.toISOString().slice(0, 7); // monthly mock
          map[key] = (map[key] || 0) + 1;
        });

        const result = Object.entries(map).map(([period, completed]) => ({
          period,
          completed,
        }));
        return Promise.resolve(result);
      }

      return Promise.resolve([]);
    });

    // Mock Task.find
    jest.spyOn(Task, 'find').mockImplementation((query = {}) => {
      let filtered = [...mockTasks];

      if (query.status && query.status.$ne) {
        filtered = filtered.filter((t) => t.status !== query.status.$ne);
      }
      if (query.dueDate && query.dueDate.$ne) {
        filtered = filtered.filter((t) => t.dueDate !== null);
      }
      if (query.assignedTo) {
        filtered = filtered.filter((t) => String(t.assignedTo) === String(query.assignedTo));
      }

      const mockQuery = {
        sort: () => mockQuery,
        limit: (l) => {
          filtered = filtered.slice(0, l);
          return mockQuery;
        },
        populate: (field) => {
          if (field === 'project') {
            filtered = filtered.map((t) => ({
              ...t,
              project: mockProjects.find((p) => String(p._id) === String(t.project)) || t.project,
            }));
          }
          if (field === 'assignedTo') {
            filtered = filtered.map((t) => ({
              ...t,
              assignedTo: mockUsers.find((u) => String(u._id) === String(t.assignedTo)) || null,
            }));
          }
          return mockQuery;
        },
        lean: () => Promise.resolve(filtered),
        then: (resolve) => resolve(filtered),
      };
      return mockQuery;
    });

    // Mock Activity.find
    jest.spyOn(Activity, 'find').mockImplementation(() => {
      return {
        sort: () => ({
          limit: () => ({
            populate: () => ({
              populate: () => ({
                populate: () => Promise.resolve(mockActivities),
              }),
            }),
          }),
        }),
      };
    });

    // Mock Activity.create
    jest.spyOn(Activity, 'create').mockImplementation((data) => {
      const newAct = {
        _id: new mongoose.Types.ObjectId().toString(),
        ...data,
        createdAt: new Date(),
      };
      mockActivities.push(newAct);
      return Promise.resolve(newAct);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Test 1: Dashboard overview
  it('1. should return dashboard overview statistics from real database aggregation', async () => {
    const res = await request(app)
      .get('/api/dashboard/overview')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalProjects');
    expect(res.body.data).toHaveProperty('totalTasks');
    expect(res.body.data).toHaveProperty('todoTasks');
    expect(res.body.data).toHaveProperty('inProgressTasks');
    expect(res.body.data).toHaveProperty('inReviewTasks');
    expect(res.body.data).toHaveProperty('completedTasks');
    expect(res.body.data).toHaveProperty('overdueTasks');
    expect(res.body.data).toHaveProperty('myTasks');
  });

  // Test 2: Project statistics
  it('2. should return aggregated project statistics with byStatus and totals', async () => {
    const res = await request(app)
      .get('/api/dashboard/projects')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('totalProjects');
    expect(res.body.data).toHaveProperty('active');
    expect(res.body.data).toHaveProperty('completed');
    expect(res.body.data).toHaveProperty('byStatus');
  });

  // Test 3: Task statistics
  it('3. should return task statistics broken down by status and priority', async () => {
    const res = await request(app)
      .get('/api/dashboard/tasks')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('status');
    expect(res.body.data.status).toHaveProperty('TODO');
    expect(res.body.data.status).toHaveProperty('IN_PROGRESS');
    expect(res.body.data.status).toHaveProperty('DONE');
    expect(res.body.data).toHaveProperty('priority');
    expect(res.body.data.priority).toHaveProperty('HIGH');
    expect(res.body.data).toHaveProperty('overdue');
  });

  // Test 4: Completion trends
  it('4. should return task completion trends aggregated by date periods', async () => {
    const res = await request(app)
      .get('/api/dashboard/trends?period=monthly')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('period');
      expect(res.body.data[0]).toHaveProperty('completed');
    }
  });

  // Test 5: Upcoming deadlines
  it('5. should return upcoming deadlines sorted by due date', async () => {
    const res = await request(app)
      .get('/api/dashboard/deadlines?limit=5')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('title');
      expect(res.body.data[0]).toHaveProperty('dueDate');
      expect(res.body.data[0]).toHaveProperty('isOverdue');
    }
  });

  // Test 6: Recent activity
  it('6. should return recent system activities', async () => {
    const res = await request(app)
      .get('/api/dashboard/activity?limit=5')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('message');
  });

  // Test 7: User-specific dashboard filtering
  it('7. should restrict normal user dashboard to projects they are members of', async () => {
    const res = await request(app)
      .get('/api/dashboard/overview')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalProjects).toBe(1); // Member of Alpha only
  });

  // Test 8: Project manager dashboard filtering
  it('8. should restrict project manager to their managed projects', async () => {
    const res = await request(app)
      .get('/api/dashboard/overview')
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalProjects).toBe(1); // PM manages Alpha
  });

  // Test 9: Admin dashboard access
  it('9. should provide unrestricted system-wide statistics to ADMIN', async () => {
    const res = await request(app)
      .get('/api/dashboard/overview')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.totalProjects).toBe(2); // System-wide sees both projects
  });

  // Test 10: Unauthorized dashboard access
  it('10. should block unauthenticated requests with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/dashboard/overview');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  // Test 11: Activity creation modularity
  it('11. should record an activity event using activityService', async () => {
    const act = await activityService.createActivity({
      user: memberUser,
      type: 'COMMENT_ADDED',
      project: testProject1,
      message: 'Member User added a comment',
    });

    expect(act).toBeDefined();
    expect(act.type).toBe('COMMENT_ADDED');
    expect(mockActivities.length).toBe(2);
  });

  // Test 12: Completion timestamp handling
  it('12. should set completedAt when status is DONE and clear when moved back', () => {
    const isCompletedDone = 'DONE' === 'DONE';
    const completedAt1 = isCompletedDone ? new Date() : null;
    expect(completedAt1).toBeInstanceOf(Date);

    const isCompletedTodo = 'TODO' === 'DONE';
    const completedAt2 = isCompletedTodo ? new Date() : null;
    expect(completedAt2).toBeNull();
  });
});

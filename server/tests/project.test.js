const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const Project = require('../models/Project');
const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');

describe('TaskFlow Phase 3: Project Management Test Suite', () => {
  let mockProjects = [];
  let mockUsers = [];
  let projectCounter = 1;

  // Standard test users
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

  const normalUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'Normal User',
    username: 'user_test',
    email: 'user@test.com',
    role: 'USER',
    isActive: true,
  };

  const otherUser = {
    _id: new mongoose.Types.ObjectId().toString(),
    name: 'Other User',
    username: 'other_test',
    email: 'other@test.com',
    role: 'USER',
    isActive: true,
  };

  let adminToken, pmToken, userToken, otherToken;

  beforeAll(() => {
    adminToken = generateToken(adminUser._id, adminUser.role);
    pmToken = generateToken(pmUser._id, pmUser.role);
    userToken = generateToken(normalUser._id, normalUser.role);
    otherToken = generateToken(otherUser._id, otherUser.role);
  });

  beforeEach(() => {
    mockProjects = [];
    mockUsers = [adminUser, pmUser, normalUser, otherUser];
    jest.clearAllMocks();

    // Mock User.findById
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const found = mockUsers.find((u) => String(u._id) === String(id));
      return {
        select: () => Promise.resolve(found || null),
        then: (resolve) => resolve(found || null),
      };
    });

    // Mock Project.create
    jest.spyOn(Project, 'create').mockImplementation(async (data) => {
      const newProj = {
        _id: new mongoose.Types.ObjectId().toString(),
        name: data.name,
        description: data.description,
        status: data.status || 'PLANNING',
        priority: data.priority || 'MEDIUM',
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        image: data.image || null,
        manager: data.manager,
        members: [...(data.members || [])],
        createdAt: new Date(),
        updatedAt: new Date(),
        save: async function () { return this; },
      };
      mockProjects.push(newProj);
      return newProj;
    });

    // Mock Project.findById
    jest.spyOn(Project, 'findById').mockImplementation((id) => {
      const found = mockProjects.find((p) => String(p._id) === String(id));
      const chain = {
        populate: () => chain,
        then: (resolve) => resolve(found || null),
      };
      return chain;
    });

    // Mock Project.find
    jest.spyOn(Project, 'find').mockImplementation((query = {}) => {
      let filtered = [...mockProjects];

      // Visibility filter
      if (query.$or) {
        filtered = filtered.filter((p) => {
          const isMgr = query.$or.some((cond) => cond.manager && String(cond.manager) === String(p.manager));
          const isMbr = query.$or.some((cond) => cond.members && p.members.some((m) => String(m) === String(cond.members)));
          return isMgr || isMbr;
        });
      }

      // Search filter
      if (query.$and) {
        query.$and.forEach((cond) => {
          if (cond.$or) {
            const nameRegex = cond.$or[0]?.name;
            if (nameRegex) {
              filtered = filtered.filter(
                (p) => nameRegex.test(p.name) || nameRegex.test(p.description)
              );
            }
          }
        });
      }

      // Status filter
      if (query.status) {
        filtered = filtered.filter((p) => p.status === query.status);
      }

      // Priority filter
      if (query.priority) {
        filtered = filtered.filter((p) => p.priority === query.priority);
      }

      const chain = {
        sort: () => chain,
        skip: (s) => {
          filtered = filtered.slice(s);
          return chain;
        },
        limit: (l) => {
          filtered = filtered.slice(0, l);
          return chain;
        },
        populate: () => chain,
        lean: () => Promise.resolve(filtered),
        then: (resolve) => resolve(filtered),
      };

      return chain;
    });

    // Mock Project.countDocuments
    jest.spyOn(Project, 'countDocuments').mockImplementation(async (query = {}) => {
      let filtered = [...mockProjects];
      if (query.$or) {
        filtered = filtered.filter((p) => {
          const isMgr = query.$or.some((cond) => cond.manager && String(cond.manager) === String(p.manager));
          const isMbr = query.$or.some((cond) => cond.members && p.members.some((m) => String(m) === String(cond.members)));
          return isMgr || isMbr;
        });
      }
      if (query.status) {
        filtered = filtered.filter((p) => p.status === query.status);
      }
      if (query.priority) {
        filtered = filtered.filter((p) => p.priority === query.priority);
      }
      return filtered.length;
    });

    // Mock Project.findByIdAndDelete
    jest.spyOn(Project, 'findByIdAndDelete').mockImplementation(async (id) => {
      const idx = mockProjects.findIndex((p) => String(p._id) === String(id));
      if (idx !== -1) {
        return mockProjects.splice(idx, 1)[0];
      }
      return null;
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // TEST 1: Create project
  test('1. Create project succeeds with valid data', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({
        name: 'TaskFlow Website',
        description: 'Complete MERN stack SaaS application',
        status: 'PLANNING',
        priority: 'HIGH',
        startDate: '2026-10-01',
        endDate: '2026-12-31',
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('TaskFlow Website');
    expect(res.body.data.status).toBe('PLANNING');
    expect(res.body.data.priority).toBe('HIGH');
  });

  // TEST 2: Create project with invalid data (e.g. endDate < startDate)
  test('2. Create project fails when endDate is before startDate', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({
        name: 'Invalid Date Project',
        description: 'Testing date range validation',
        startDate: '2026-12-01',
        endDate: '2026-10-01', // Earlier than startDate
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/earlier than start date/i);
  });

  // TEST 3: Get projects (with visibility check)
  test('3. Normal user only sees projects they manage or are members of', async () => {
    // Project 1: User is member
    mockProjects.push({
      _id: new mongoose.Types.ObjectId().toString(),
      name: 'User Project',
      description: 'Project with user',
      status: 'ACTIVE',
      priority: 'MEDIUM',
      manager: pmUser._id,
      members: [pmUser._id, normalUser._id],
    });

    // Project 2: User is not involved
    mockProjects.push({
      _id: new mongoose.Types.ObjectId().toString(),
      name: 'Private Project',
      description: 'Project without user',
      status: 'PLANNING',
      priority: 'LOW',
      manager: otherUser._id,
      members: [otherUser._id],
    });

    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.projects.length).toBe(1);
    expect(res.body.data.projects[0].name).toBe('User Project');
  });

  // TEST 4: Get project by ID
  test('4. Get project by ID returns populated project details', async () => {
    const testProj = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: 'Detailed Project',
      description: 'Full inspection test',
      status: 'ACTIVE',
      priority: 'CRITICAL',
      manager: pmUser._id,
      members: [pmUser._id],
    };
    mockProjects.push(testProj);

    const res = await request(app)
      .get(`/api/projects/${testProj._id}`)
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Detailed Project');
  });

  // TEST 5: Update project
  test('5. Project manager can update their project', async () => {
    const testProj = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: 'Old Project Name',
      description: 'Original description',
      status: 'PLANNING',
      priority: 'LOW',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-11-01'),
      manager: pmUser._id,
      members: [pmUser._id],
      save: async function () { return this; },
    };
    mockProjects.push(testProj);

    const res = await request(app)
      .put(`/api/projects/${testProj._id}`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({
        name: 'Brand New Project Name',
        status: 'ACTIVE',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Brand New Project Name');
    expect(res.body.data.status).toBe('ACTIVE');
  });

  // TEST 6: Delete project
  test('6. Project manager can delete their project', async () => {
    const testProj = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: 'Project to Delete',
      manager: pmUser._id,
      members: [pmUser._id],
    };
    mockProjects.push(testProj);

    const res = await request(app)
      .delete(`/api/projects/${testProj._id}`)
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted successfully/i);
    expect(mockProjects.length).toBe(0);
  });

  // TEST 7: Add member
  test('7. Project manager can add a new member to the project', async () => {
    const testProj = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: 'Team Project',
      manager: pmUser._id,
      members: [pmUser._id],
      save: async function () { return this; },
    };
    mockProjects.push(testProj);

    const res = await request(app)
      .post(`/api/projects/${testProj._id}/members`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ userId: normalUser._id });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(testProj.members.map(String)).toContain(String(normalUser._id));
  });

  // TEST 8: Prevent duplicate member
  test('8. Adding an existing member returns 409 Conflict', async () => {
    const testProj = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: 'Team Project 2',
      manager: pmUser._id,
      members: [pmUser._id, normalUser._id],
      save: async function () { return this; },
    };
    mockProjects.push(testProj);

    const res = await request(app)
      .post(`/api/projects/${testProj._id}/members`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ userId: normalUser._id });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already a member/i);
  });

  // TEST 9: Remove member
  test('9. Project manager can remove a member from the project', async () => {
    const testProj = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: 'Removal Project',
      manager: pmUser._id,
      members: [pmUser._id, normalUser._id],
      save: async function () { return this; },
    };
    mockProjects.push(testProj);

    const res = await request(app)
      .delete(`/api/projects/${testProj._id}/members/${normalUser._id}`)
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(testProj.members.map(String)).not.toContain(String(normalUser._id));
  });

  // TEST 10: Update project manager
  test('10. Current manager or Admin can reassign project manager', async () => {
    const testProj = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: 'Leadership Transition',
      manager: pmUser._id,
      members: [pmUser._id, normalUser._id],
      save: async function () { return this; },
    };
    mockProjects.push(testProj);

    const res = await request(app)
      .patch(`/api/projects/${testProj._id}/manager`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ userId: normalUser._id });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(String(testProj.manager)).toBe(String(normalUser._id));
  });

  // TEST 11: Unauthorized user cannot modify project
  test('11. Non-manager/non-admin user is rejected with 403 Forbidden when updating project', async () => {
    const testProj = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: 'Protected Project',
      manager: pmUser._id,
      members: [pmUser._id],
      save: async function () { return this; },
    };
    mockProjects.push(testProj);

    const res = await request(app)
      .put(`/api/projects/${testProj._id}`)
      .set('Authorization', `Bearer ${otherToken}`) // Not manager or admin
      .send({ name: 'Hacked Project Name' });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Forbidden/i);
  });

  // TEST 12: Admin can access project management operations
  test('12. Admin can edit projects even when not the assigned manager', async () => {
    const testProj = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: 'PM Owned Project',
      manager: pmUser._id,
      members: [pmUser._id],
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-11-01'),
      save: async function () { return this; },
    };
    mockProjects.push(testProj);

    const res = await request(app)
      .put(`/api/projects/${testProj._id}`)
      .set('Authorization', `Bearer ${adminToken}`) // Admin override
      .send({ name: 'Admin Edited Name' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Admin Edited Name');
  });

  // TEST 13: Pagination works
  test('13. Pagination limits projects and provides total count metadata', async () => {
    for (let i = 1; i <= 15; i++) {
      mockProjects.push({
        _id: new mongoose.Types.ObjectId().toString(),
        name: `Project ${i}`,
        manager: adminUser._id,
        members: [adminUser._id],
      });
    }

    const res = await request(app)
      .get('/api/projects?page=2&limit=5')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pagination.page).toBe(2);
    expect(res.body.data.pagination.limit).toBe(5);
    expect(res.body.data.pagination.total).toBe(15);
    expect(res.body.data.pagination.totalPages).toBe(3);
    expect(res.body.data.projects.length).toBe(5);
  });

  // TEST 14: Search works
  test('14. Search query filters projects by name or description keyword', async () => {
    mockProjects.push(
      {
        _id: new mongoose.Types.ObjectId().toString(),
        name: 'Mobile Application',
        description: 'React Native app',
        manager: adminUser._id,
        members: [adminUser._id],
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        name: 'Backend API',
        description: 'Express microservice',
        manager: adminUser._id,
        members: [adminUser._id],
      }
    );

    const res = await request(app)
      .get('/api/projects?search=Mobile')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.projects.length).toBe(1);
    expect(res.body.data.projects[0].name).toBe('Mobile Application');
  });

  // TEST 15: Status filter works
  test('15. Status query parameter filters projects by status enum', async () => {
    mockProjects.push(
      {
        _id: new mongoose.Types.ObjectId().toString(),
        name: 'Active Project',
        status: 'ACTIVE',
        manager: adminUser._id,
        members: [adminUser._id],
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        name: 'Completed Project',
        status: 'COMPLETED',
        manager: adminUser._id,
        members: [adminUser._id],
      }
    );

    const res = await request(app)
      .get('/api/projects?status=ACTIVE')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.projects.length).toBe(1);
    expect(res.body.data.projects[0].name).toBe('Active Project');
  });

  // TEST 16: Priority filter works
  test('16. Priority query parameter filters projects by priority enum', async () => {
    mockProjects.push(
      {
        _id: new mongoose.Types.ObjectId().toString(),
        name: 'Critical Task',
        priority: 'CRITICAL',
        manager: adminUser._id,
        members: [adminUser._id],
      },
      {
        _id: new mongoose.Types.ObjectId().toString(),
        name: 'Low Task',
        priority: 'LOW',
        manager: adminUser._id,
        members: [adminUser._id],
      }
    );

    const res = await request(app)
      .get('/api/projects?priority=CRITICAL')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.projects.length).toBe(1);
    expect(res.body.data.projects[0].name).toBe('Critical Task');
  });
});

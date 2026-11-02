const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../server');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');

describe('TaskFlow Phase 4: Task Management & Kanban Test Suite', () => {
  let mockProjects = [];
  let mockTasks = [];
  let mockUsers = [];

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
  let testProject;

  beforeAll(() => {
    adminToken = generateToken(adminUser._id, adminUser.role);
    pmToken = generateToken(pmUser._id, pmUser.role);
    memberToken = generateToken(memberUser._id, memberUser.role);
    outsiderToken = generateToken(outsiderUser._id, outsiderUser.role);
  });

  beforeEach(() => {
    mockUsers = [adminUser, pmUser, memberUser, outsiderUser];
    testProject = {
      _id: new mongoose.Types.ObjectId().toString(),
      name: 'TaskFlow Main Project',
      description: 'Project for task management testing',
      manager: pmUser._id,
      members: [memberUser._id],
      status: 'ACTIVE',
      priority: 'HIGH',
      startDate: new Date('2026-10-01'),
      endDate: new Date('2026-12-31'),
    };
    mockProjects = [testProject];
    mockTasks = [];
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
        populate: () => Promise.resolve(found || null),
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
        select: () => Promise.resolve(filtered),
        then: (resolve) => resolve(filtered),
      };
    });

    // Mock Task.create
    jest.spyOn(Task, 'create').mockImplementation(async (data) => {
      const newTask = {
        _id: new mongoose.Types.ObjectId().toString(),
        title: data.title,
        description: data.description || '',
        project: data.project,
        assignedTo: data.assignedTo || null,
        createdBy: data.createdBy,
        status: data.status || 'TODO',
        priority: data.priority || 'MEDIUM',
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        estimatedHours: data.estimatedHours || 0,
        labels: data.labels || [],
        comments: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        save: async function () { return this; },
      };
      mockTasks.push(newTask);
      return newTask;
    });

    // Mock Task.findById
    jest.spyOn(Task, 'findById').mockImplementation((id) => {
      const found = mockTasks.find((t) => String(t._id) === String(id));
      if (!found) {
        const nullChain = {
          populate: () => nullChain,
          then: (resolve) => resolve(null),
        };
        return nullChain;
      }

      // Clone found with populate simulation and subdoc helpers
      const clone = {
        ...found,
        project: testProject,
        assignedTo: mockUsers.find((u) => String(u._id) === String(found.assignedTo)) || null,
        createdBy: mockUsers.find((u) => String(u._id) === String(found.createdBy)) || null,
        comments: {
          ...found.comments,
          id: (commentId) => {
            const c = found.comments.find((item) => String(item._id) === String(commentId));
            if (!c) return null;
            return {
              ...c,
              deleteOne: () => {
                const idx = found.comments.findIndex((item) => String(item._id) === String(commentId));
                if (idx !== -1) found.comments.splice(idx, 1);
              },
            };
          },
          push: (item) => {
            const commentObj = {
              _id: new mongoose.Types.ObjectId().toString(),
              ...item,
            };
            found.comments.push(commentObj);
          },
        },
        save: async function () {
          const idx = mockTasks.findIndex((t) => String(t._id) === String(this._id));
          if (idx !== -1) {
            mockTasks[idx] = { ...mockTasks[idx], ...this };
          }
          return this;
        },
      };

      const chain = {
        populate: () => chain,
        then: (resolve) => resolve(clone),
      };
      return chain;
    });

    // Mock Task.find
    jest.spyOn(Task, 'find').mockImplementation((query = {}) => {
      let filtered = [...mockTasks];

      if (query.project) {
        filtered = filtered.filter((t) => String(t.project) === String(query.project));
      }

      if (query.status) {
        filtered = filtered.filter((t) => t.status === query.status);
      }

      if (query.priority) {
        filtered = filtered.filter((t) => t.priority === query.priority);
      }

      if (query.assignedTo) {
        filtered = filtered.filter((t) => String(t.assignedTo) === String(query.assignedTo));
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
        then: (resolve) => resolve(filtered),
      };
      return chain;
    });

    // Mock Task.countDocuments
    jest.spyOn(Task, 'countDocuments').mockImplementation(async (query = {}) => {
      let filtered = [...mockTasks];
      if (query.project) {
        filtered = filtered.filter((t) => String(t.project) === String(query.project));
      }
      if (query.status) {
        filtered = filtered.filter((t) => t.status === query.status);
      }
      if (query.priority) {
        filtered = filtered.filter((t) => t.priority === query.priority);
      }
      return filtered.length;
    });

    // Mock Task.findByIdAndDelete
    jest.spyOn(Task, 'findByIdAndDelete').mockImplementation(async (id) => {
      const idx = mockTasks.findIndex((t) => String(t._id) === String(id));
      if (idx !== -1) {
        return mockTasks.splice(idx, 1)[0];
      }
      return null;
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // TEST 1: Create task
  test('1. Create task succeeds with valid data', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({
        title: 'Design Login Interface',
        description: 'Create responsive login page in Tailwind CSS',
        project: testProject._id,
        assignedTo: memberUser._id,
        status: 'TODO',
        priority: 'HIGH',
        dueDate: '2026-10-25',
        estimatedHours: 8,
        labels: ['frontend', 'auth'],
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Design Login Interface');
    expect(res.body.data.status).toBe('TODO');
    expect(res.body.data.priority).toBe('HIGH');
  });

  // TEST 2: Create task with invalid project
  test('2. Create task fails when project does not exist', async () => {
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({
        title: 'Task with bad project',
        project: nonExistentId,
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/project not found/i);
  });

  // TEST 3: Create task with invalid user (not member of project)
  test('3. Create task fails when assigned user is not part of the project', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${pmToken}`)
      .send({
        title: 'Task for outsider',
        project: testProject._id,
        assignedTo: outsiderUser._id, // Not a member of testProject
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/assigned user must be a member/i);
  });

  // TEST 4: Get tasks
  test('4. Get tasks returns user authorized tasks', async () => {
    mockTasks.push({
      _id: new mongoose.Types.ObjectId().toString(),
      title: 'Member Task',
      project: testProject._id,
      assignedTo: memberUser._id,
      status: 'TODO',
      priority: 'MEDIUM',
      comments: [],
    });

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.tasks)).toBe(true);
    expect(res.body.data.pagination).toBeDefined();
  });

  // TEST 5: Get project tasks
  test('5. Get project tasks returns tasks for specific project', async () => {
    mockTasks.push({
      _id: new mongoose.Types.ObjectId().toString(),
      title: 'Project Specific Task',
      project: testProject._id,
      assignedTo: memberUser._id,
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      comments: [],
    });

    const res = await request(app)
      .get(`/api/tasks?project=${testProject._id}`)
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tasks.length).toBe(1);
    expect(res.body.data.tasks[0].title).toBe('Project Specific Task');
  });

  // TEST 6: Get task by ID
  test('6. Get task by ID returns populated task details', async () => {
    const taskId = new mongoose.Types.ObjectId().toString();
    mockTasks.push({
      _id: taskId,
      title: 'Detailed Task',
      description: 'Full description',
      project: testProject._id,
      assignedTo: memberUser._id,
      createdBy: pmUser._id,
      status: 'TODO',
      priority: 'MEDIUM',
      comments: [],
    });

    const res = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data._id).toBe(taskId);
    expect(res.body.data.title).toBe('Detailed Task');
  });

  // TEST 7: Update task
  test('7. Update task updates metadata when user is manager', async () => {
    const taskId = new mongoose.Types.ObjectId().toString();
    mockTasks.push({
      _id: taskId,
      title: 'Original Title',
      project: testProject._id,
      assignedTo: memberUser._id,
      status: 'TODO',
      priority: 'LOW',
      comments: [],
    });

    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({
        title: 'Updated Task Title',
        priority: 'HIGH',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/updated successfully/i);
  });

  // TEST 8: Delete task
  test('8. Delete task removes task when user is project manager', async () => {
    const taskId = new mongoose.Types.ObjectId().toString();
    mockTasks.push({
      _id: taskId,
      title: 'Task to Delete',
      project: testProject._id,
      status: 'TODO',
      comments: [],
    });

    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockTasks.length).toBe(0);
  });

  // TEST 9: Assign task
  test('9. Assign task updates assignee when user is manager', async () => {
    const taskId = new mongoose.Types.ObjectId().toString();
    mockTasks.push({
      _id: taskId,
      title: 'Unassigned Task',
      project: testProject._id,
      assignedTo: null,
      status: 'TODO',
      comments: [],
    });

    const res = await request(app)
      .patch(`/api/tasks/${taskId}/assignee`)
      .set('Authorization', `Bearer ${pmToken}`)
      .send({ userId: memberUser._id });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/assignee updated/i);
  });

  // TEST 10: Change task status
  test('10. Change task status updates status (TODO -> IN_PROGRESS)', async () => {
    const taskId = new mongoose.Types.ObjectId().toString();
    mockTasks.push({
      _id: taskId,
      title: 'Status Task',
      project: testProject._id,
      assignedTo: memberUser._id,
      status: 'TODO',
      comments: [],
    });

    const res = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'IN_PROGRESS' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/status updated/i);
  });

  // TEST 11: Add comment
  test('11. Add comment appends message with authenticated user', async () => {
    const taskId = new mongoose.Types.ObjectId().toString();
    mockTasks.push({
      _id: taskId,
      title: 'Comment Task',
      project: testProject._id,
      assignedTo: memberUser._id,
      status: 'TODO',
      comments: [],
    });

    const res = await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ message: 'Ready for initial code review.' });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/comment added/i);
  });

  // TEST 12: Unauthorized user cannot modify task metadata
  test('12. Unauthorized outsider user cannot modify task metadata (403 Forbidden)', async () => {
    const taskId = new mongoose.Types.ObjectId().toString();
    mockTasks.push({
      _id: taskId,
      title: 'Private Task',
      project: testProject._id,
      assignedTo: memberUser._id,
      status: 'TODO',
      priority: 'LOW',
      comments: [],
    });

    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${outsiderToken}`)
      .send({ title: 'Hacked Title' });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });

  // TEST 13: Unauthorized user cannot delete task
  test('13. Normal member user cannot delete task (403 Forbidden)', async () => {
    const taskId = new mongoose.Types.ObjectId().toString();
    mockTasks.push({
      _id: taskId,
      title: 'Protected Task',
      project: testProject._id,
      assignedTo: memberUser._id,
      status: 'TODO',
      comments: [],
    });

    const res = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/only the project manager or an administrator/i);
  });

  // TEST 14: Search works
  test('14. Search tasks works across query parameters', async () => {
    mockTasks.push({
      _id: new mongoose.Types.ObjectId().toString(),
      title: 'Fix authentication cookie bug',
      project: testProject._id,
      status: 'TODO',
      comments: [],
    });

    const res = await request(app)
      .get(`/api/tasks?search=cookie`)
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  // TEST 15: Filtering works
  test('15. Filtering tasks by status and priority works', async () => {
    mockTasks.push({
      _id: new mongoose.Types.ObjectId().toString(),
      title: 'Critical Bug Task',
      project: testProject._id,
      status: 'IN_REVIEW',
      priority: 'CRITICAL',
      comments: [],
    });

    const res = await request(app)
      .get(`/api/tasks?status=IN_REVIEW&priority=CRITICAL`)
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.tasks.length).toBe(1);
    expect(res.body.data.tasks[0].status).toBe('IN_REVIEW');
    expect(res.body.data.tasks[0].priority).toBe('CRITICAL');
  });

  // TEST 16: Pagination works
  test('16. Pagination works correctly with limit and page structure', async () => {
    for (let i = 1; i <= 5; i++) {
      mockTasks.push({
        _id: new mongoose.Types.ObjectId().toString(),
        title: `Task #${i}`,
        project: testProject._id,
        status: 'TODO',
        comments: [],
      });
    }

    const res = await request(app)
      .get('/api/tasks?page=1&limit=2')
      .set('Authorization', `Bearer ${pmToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pagination.page).toBe(1);
    expect(res.body.data.pagination.limit).toBe(2);
    expect(res.body.data.pagination.total).toBe(5);
    expect(res.body.data.pagination.totalPages).toBe(3);
  });
});

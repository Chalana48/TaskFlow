const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');

describe('TaskFlow Phase 2: Authentication & User Management Test Suite', () => {
  let mockUsers = [];
  let userCounter = 1;

  beforeEach(() => {
    mockUsers = [];
    jest.clearAllMocks();

    // Mock User.create
    jest.spyOn(User, 'create').mockImplementation(async (userData) => {
      const newUser = {
        _id: `user_id_${userCounter++}`,
        ...userData,
        comparePassword: async (pwd) => pwd === userData.password || pwd === 'Password123!',
        toSafeObject: function () {
          return {
            id: this._id,
            name: this.name,
            username: this.username,
            email: this.email,
            role: this.role,
            profileImage: this.profileImage,
            isActive: this.isActive,
            createdAt: new Date().toISOString(),
          };
        },
        save: async function () {
          return this;
        },
      };
      mockUsers.push(newUser);
      return newUser;
    });

    // Mock User.findOne
    jest.spyOn(User, 'findOne').mockImplementation((query) => {
      const queryKey = Object.keys(query)[0];
      const queryVal = query[queryKey];
      const found = mockUsers.find((u) => u[queryKey] === queryVal);

      return {
        select: () => Promise.resolve(found || null),
        then: (resolve) => resolve(found || null),
      };
    });

    // Mock User.findById
    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const found = mockUsers.find((u) => String(u._id) === String(id));
      return {
        select: () => Promise.resolve(found || null),
        then: (resolve) => resolve(found || null),
      };
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  // TEST 1: User registration succeeds
  test('1. User registration succeeds with valid data', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'John Doe',
      username: 'johndoe',
      email: 'john@example.com',
      password: 'Password123!',
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('john@example.com');
    expect(res.body.data.role).toBe('USER');
    expect(res.body.data.password).toBeUndefined();
    expect(res.body.token).toBeDefined();
  });

  // TEST 2: Duplicate email is rejected
  test('2. Duplicate email is rejected with 409 Conflict', async () => {
    mockUsers.push({
      _id: 'existing_id_1',
      name: 'Existing User',
      username: 'unique_user',
      email: 'duplicate@example.com',
      password: 'Password123!',
      role: 'USER',
      isActive: true,
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Another User',
      username: 'another_user',
      email: 'duplicate@example.com',
      password: 'Password123!',
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  // TEST 3: Duplicate username is rejected
  test('3. Duplicate username is rejected with 409 Conflict', async () => {
    mockUsers.push({
      _id: 'existing_id_2',
      name: 'Existing User 2',
      username: 'takenusername',
      email: 'unique_email@example.com',
      password: 'Password123!',
      role: 'USER',
      isActive: true,
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Second User',
      username: 'takenusername',
      email: 'newemail@example.com',
      password: 'Password123!',
    });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already taken/i);
  });

  // TEST 4: Invalid email is rejected
  test('4. Invalid email format is rejected with 400 Bad Request', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Invalid Email',
      username: 'invalidemail',
      email: 'not-an-email',
      password: 'Password123!',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/valid email/i);
  });

  // TEST 5: Weak password is rejected
  test('5. Short password (< 6 chars) is rejected with 400 Bad Request', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Short Pwd',
      username: 'shortpwd',
      email: 'short@example.com',
      password: '123',
    });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/at least 6 characters/i);
  });

  // TEST 6: Login succeeds with correct credentials
  test('6. Login succeeds with correct credentials', async () => {
    mockUsers.push({
      _id: 'user_active_1',
      name: 'Active User',
      username: 'activeuser',
      email: 'active@example.com',
      password: 'Password123!',
      role: 'USER',
      isActive: true,
      comparePassword: async (pwd) => pwd === 'Password123!',
      toSafeObject: function () {
        return { id: this._id, name: this.name, email: this.email, role: this.role };
      },
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'active@example.com',
      password: 'Password123!',
    });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.data.email).toBe('active@example.com');
  });

  // TEST 7: Login fails with incorrect credentials
  test('7. Login fails with incorrect credentials', async () => {
    mockUsers.push({
      _id: 'user_active_2',
      name: 'User 2',
      username: 'user2',
      email: 'user2@example.com',
      password: 'Password123!',
      role: 'USER',
      isActive: true,
      comparePassword: async () => false,
      toSafeObject: function () {
        return { id: this._id, name: this.name, email: this.email, role: this.role };
      },
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'user2@example.com',
      password: 'WrongPassword!',
    });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid email or password/i);
  });

  // TEST 8: Protected route rejects unauthenticated request
  test('8. Protected route /api/auth/me rejects unauthenticated request with 401', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Authentication required/i);
  });

  // TEST 9: Authenticated user can access /me
  test('9. Authenticated user can access /api/auth/me with valid Bearer token', async () => {
    const user = {
      _id: 'user_auth_9',
      name: 'Auth Nine',
      username: 'authnine',
      email: 'auth9@example.com',
      role: 'USER',
      isActive: true,
      toSafeObject: function () {
        return { id: this._id, name: this.name, username: this.username, email: this.email, role: this.role };
      },
    };
    mockUsers.push(user);

    const token = generateToken(user._id, user.role);

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe('authnine');
  });

  // TEST 10: USER cannot access ADMIN route
  test('10. Normal USER cannot access ADMIN route (returns 403 Forbidden)', async () => {
    const user = {
      _id: 'user_regular_10',
      role: 'USER',
      isActive: true,
      toSafeObject: function () {
        return { id: this._id, role: this.role };
      },
    };
    mockUsers.push(user);

    const token = generateToken(user._id, user.role);

    const res = await request(app)
      .get('/api/auth/test-admin-only')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Forbidden/i);
  });

  // TEST 11: ADMIN can access ADMIN route
  test('11. ADMIN user can access ADMIN route (returns 200 OK)', async () => {
    const admin = {
      _id: 'admin_user_11',
      role: 'ADMIN',
      isActive: true,
      toSafeObject: function () {
        return { id: this._id, role: this.role };
      },
    };
    mockUsers.push(admin);

    const token = generateToken(admin._id, admin.role);

    const res = await request(app)
      .get('/api/auth/test-admin-only')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Admin access granted');
  });

  // TEST 12: Inactive user cannot authenticate
  test('12. Inactive/suspended user cannot authenticate (returns 403 Forbidden)', async () => {
    const suspended = {
      _id: 'suspended_12',
      email: 'suspended@example.com',
      password: 'Password123!',
      role: 'USER',
      isActive: false, // suspended
      comparePassword: async () => true,
    };
    mockUsers.push(suspended);

    const res = await request(app).post('/api/auth/login').send({
      email: 'suspended@example.com',
      password: 'Password123!',
    });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  // TEST 13: User can update profile
  test('13. Authenticated user can update their profile name and username', async () => {
    const user = {
      _id: 'profile_user_13',
      name: 'Initial Name',
      username: 'initialuser',
      email: 'profile13@example.com',
      role: 'USER',
      isActive: true,
      save: async function () { return this; },
      toSafeObject: function () {
        return { id: this._id, name: this.name, username: this.username, email: this.email };
      },
    };
    mockUsers.push(user);

    const token = generateToken(user._id, user.role);

    const res = await request(app)
      .put('/api/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Name',
        username: 'updatedusername',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Updated Name');
    expect(res.body.data.username).toBe('updatedusername');
  });

  // TEST 14: User can change password
  test('14. Authenticated user can change password with valid credentials', async () => {
    const user = {
      _id: 'pwd_user_14',
      name: 'Password User',
      email: 'pwd@example.com',
      password: 'OldPassword123!',
      role: 'USER',
      isActive: true,
      comparePassword: async (pwd) => pwd === 'OldPassword123!',
      save: async function () { return this; },
    };
    mockUsers.push(user);

    const token = generateToken(user._id, user.role);

    const res = await request(app)
      .put('/api/users/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'OldPassword123!',
        newPassword: 'BrandNewPassword123!',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/Password changed successfully/i);
  });

  // TEST 15: Incorrect current password is rejected
  test('15. Incorrect current password is rejected with 400 Bad Request', async () => {
    const user = {
      _id: 'pwd_user_15',
      name: 'Password User 2',
      email: 'pwd2@example.com',
      password: 'RealPassword123!',
      role: 'USER',
      isActive: true,
      comparePassword: async () => false,
      save: async function () { return this; },
    };
    mockUsers.push(user);

    const token = generateToken(user._id, user.role);

    const res = await request(app)
      .put('/api/users/password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'WrongPassword!',
        newPassword: 'BrandNewPassword123!',
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Current password does not match/i);
  });
});

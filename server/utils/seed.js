/**
 * TaskFlow Database Seeding Utility
 * Seeds demonstration users, projects, tasks, activities, and notifications.
 *
 * Usage:
 *   node utils/seed.js
 *   npm run seed
 */

const mongoose = require('mongoose');
const config = require('../config/env');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

const seedDatabase = async () => {
  console.log('====================================================');
  console.log('🌱 TaskFlow Database Seed Utility');
  console.log(`📡 Connecting to MongoDB at: ${config.mongoUri}`);
  console.log('====================================================');

  try {
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB.');

    // 1. Clean existing records (optional/graceful)
    console.log('🧹 Clearing previous demonstration data...');
    await Promise.all([
      User.deleteMany({ email: { $in: ['admin@taskflow.dev', 'pm@taskflow.dev', 'user@taskflow.dev'] } }),
      Project.deleteMany({ name: { $in: ['Cloud Migration & Scalability', 'NextGen Mobile Experience'] } }),
      Activity.deleteMany({}),
      Notification.deleteMany({}),
    ]);

    // 2. Create Demo Users
    console.log('👤 Creating demo accounts (Password: Password123!)...');
    const adminUser = await User.create({
      name: 'Eleanor Vance (Admin)',
      username: 'admin_eleanor',
      email: 'admin@taskflow.dev',
      password: 'Password123!',
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    const pmUser = await User.create({
      name: 'Marcus Chen (PM)',
      username: 'pm_marcus',
      email: 'pm@taskflow.dev',
      password: 'Password123!',
      role: 'PROJECT_MANAGER',
      status: 'ACTIVE',
    });

    const regularUser = await User.create({
      name: 'Sophia Patel (Engineer)',
      username: 'user_sophia',
      email: 'user@taskflow.dev',
      password: 'Password123!',
      role: 'USER',
      status: 'ACTIVE',
    });

    console.log('   ✓ Admin:   admin@taskflow.dev (Role: ADMIN)');
    console.log('   ✓ Manager: pm@taskflow.dev    (Role: PROJECT_MANAGER)');
    console.log('   ✓ User:    user@taskflow.dev  (Role: USER)');

    // 3. Create Demo Projects
    console.log('📁 Creating demonstration projects...');
    const now = new Date();
    const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const projectOne = await Project.create({
      name: 'Cloud Migration & Scalability',
      description: 'Migrating legacy monolith architecture into cloud-native microservices with Docker and Kubernetes.',
      manager: pmUser._id,
      members: [pmUser._id, regularUser._id, adminUser._id],
      status: 'ACTIVE',
      priority: 'HIGH',
      startDate: now,
      endDate: nextMonth,
      tags: ['Infrastructure', 'DevOps', 'Docker'],
    });

    const projectTwo = await Project.create({
      name: 'NextGen Mobile Experience',
      description: 'Designing and building real-time mobile collaboration features with optimized touch UX.',
      manager: pmUser._id,
      members: [pmUser._id, regularUser._id],
      status: 'PLANNING',
      priority: 'MEDIUM',
      startDate: now,
      endDate: nextMonth,
      tags: ['Mobile', 'React', 'UX'],
    });

    console.log(`   ✓ Project 1: "${projectOne.name}"`);
    console.log(`   ✓ Project 2: "${projectTwo.name}"`);

    // 4. Create Demo Tasks Across Kanban Columns
    console.log('📋 Creating demo tasks across Kanban lifecycle columns...');
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await Task.create([
      {
        title: 'Containerize backend REST API with multi-stage Dockerfile',
        description: 'Implement non-root Alpine Dockerfile with BuildKit caching and health checks.',
        project: projectOne._id,
        assignedTo: regularUser._id,
        createdBy: pmUser._id,
        status: 'DONE',
        priority: 'HIGH',
        dueDate: tomorrow,
        completedAt: now,
        labels: ['Docker', 'Backend'],
        comments: [
          {
            user: pmUser._id,
            message: 'Excellent work on the multi-stage build and Alpine security baseline!',
            createdAt: now,
          },
        ],
      },
      {
        title: 'Configure automated CI pipeline on GitHub Actions',
        description: 'Set up dual workflow testing backend endpoints and compiling frontend bundle.',
        project: projectOne._id,
        assignedTo: regularUser._id,
        createdBy: pmUser._id,
        status: 'IN_REVIEW',
        priority: 'HIGH',
        dueDate: nextWeek,
        labels: ['CI/CD', 'GitHub'],
      },
      {
        title: 'Audit MongoDB indexes and connection pooling',
        description: 'Verify compound indexes on tasks collection for optimal query latency.',
        project: projectOne._id,
        assignedTo: regularUser._id,
        createdBy: pmUser._id,
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
        dueDate: nextWeek,
        labels: ['Database', 'MongoDB'],
      },
      {
        title: 'Draft OpenAPI 3.0 API schema and verify Swagger UI',
        description: 'Ensure all 35+ REST endpoints are documented with parameters and error responses.',
        project: projectOne._id,
        assignedTo: null,
        createdBy: pmUser._id,
        status: 'TODO',
        priority: 'LOW',
        dueDate: nextWeek,
        labels: ['Documentation', 'Swagger'],
      },
      {
        title: 'Initial mobile UI wireframes and user flow mapping',
        description: 'Create Figma prototypes for offline mode and instant task status dragging.',
        project: projectTwo._id,
        assignedTo: regularUser._id,
        createdBy: pmUser._id,
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: nextWeek,
        labels: ['Design', 'Mobile'],
      },
    ]);

    // 5. Create Sample Notifications
    console.log('🔔 Generating sample notifications...');
    await Notification.create([
      {
        recipient: regularUser._id,
        sender: pmUser._id,
        type: 'PROJECT_ADDED',
        title: 'Welcome to Cloud Migration Project',
        message: 'Marcus Chen added you to Cloud Migration & Scalability.',
        relatedProject: projectOne._id,
        link: `/projects/${projectOne._id}`,
        isRead: false,
      },
      {
        recipient: regularUser._id,
        sender: pmUser._id,
        type: 'TASK_ASSIGNED',
        title: 'New Task Assignment',
        message: 'You were assigned to "Audit MongoDB indexes and connection pooling".',
        relatedProject: projectOne._id,
        link: `/tasks`,
        isRead: false,
      },
    ]);

    // 6. Create Initial Activities
    console.log('📊 Recording recent activity items...');
    await Activity.create([
      {
        user: pmUser._id,
        project: projectOne._id,
        action: 'PROJECT_CREATED',
        details: 'Marcus Chen created project "Cloud Migration & Scalability".',
      },
      {
        user: regularUser._id,
        project: projectOne._id,
        action: 'TASK_COMPLETED',
        details: 'Sophia Patel completed task "Containerize backend REST API".',
      },
    ]);

    console.log('====================================================');
    console.log('🎉 Seeding successfully completed!');
    console.log('🔑 You can now log into TaskFlow using:');
    console.log('   - Admin:   admin@taskflow.dev / Password123!');
    console.log('   - PM:      pm@taskflow.dev    / Password123!');
    console.log('   - User:    user@taskflow.dev  / Password123!');
    console.log('====================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`❌ Seeding failed: ${error.message}`);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
};

seedDatabase();

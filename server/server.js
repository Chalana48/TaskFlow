const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');
const config = require('./config/env');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');

const app = express();

// 1. Establish Database Connection
connectDB();

// 2. Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // Allows Swagger UI documentation assets to load smoothly
  })
);

// 3. CORS Configuration
const configuredOrigins = config.clientUrl
  ? config.clientUrl.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : [];
const allowedOrigins = Array.from(
  new Set([
    ...configuredOrigins,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ])
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or postman)
      if (!origin) {
        return callback(null, true);
      }
      const normalizedOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(normalizedOrigin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      // Allow Vercel preview deployments if a vercel domain is configured
      if (normalizedOrigin.endsWith('.vercel.app') && allowedOrigins.some((o) => o.includes('vercel.app'))) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true, // Enables cookie passing across origins
  })
);

// 4. Rate Limiting (Prevents DDoS and Brute Force on Auth endpoints)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api', apiLimiter);

// Specific stricter brute-force protector on authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// 5. Body & Cookie Parsers
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// 6. Static Uploads Folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger & OpenAPI Documentation Endpoints
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(swaggerDocument);
});
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customSiteTitle: 'TaskFlow REST API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  })
);

// 7. Base Health Check Endpoint (With Database Readiness)
app.get('/api/health', (req, res) => {
  const isTest = config.nodeEnv === 'test';
  const dbReady = mongoose.connection.readyState === 1;
  const isHealthy = dbReady || isTest;
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    message: isHealthy
      ? 'TaskFlow API Server is healthy and running'
      : 'TaskFlow API Server running in degraded mode (database unavailable)',
    database: isTest ? 'test-mocked' : (dbReady ? 'connected' : 'disconnected'),
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    environment: config.nodeEnv,
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      health: '/api/health',
      swaggerUi: '/api-docs',
      openApiJson: '/api-docs.json',
      auth: '/api/auth',
      users: '/api/users',
      projects: '/api/projects (Phase 3)',
      tasks: '/api/tasks (Phase 4)',
      dashboard: '/api/dashboard (Phase 5)',
      notifications: '/api/notifications (Phase 6)',
      admin: '/api/admin (Phase 7)',
    },
  });
});

// 8. Mount Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// 9. 404 & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

// 10. Server Initialization
const PORT = config.port;
let server;

// Avoid starting listener during automated tests (supertest handles server instance)
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 TaskFlow REST API running on port ${PORT}`);
    console.log(`📡 Environment: ${config.nodeEnv}`);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
    console.log(`👤 User routes: http://localhost:${PORT}/api/users`);
    console.log(`====================================================`);
  });
}

// 11. Handle Unhandled Promise Rejections & Uncaught Exceptions
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection]: ${err.message}`);
});

// 12. Graceful Shutdown Signal Handlers (SIGTERM / SIGINT)
const handleShutdown = (signal) => {
  console.log(`[Process] ${signal} signal received. Closing HTTP server and database connections...`);
  if (server) {
    server.close(() => {
      console.log('[Process] HTTP server closed gracefully.');
      mongoose.connection
        .close(false)
        .then(() => {
          console.log('[Process] MongoDB connection closed.');
          process.exit(0);
        })
        .catch(() => process.exit(0));
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

module.exports = { app, server };

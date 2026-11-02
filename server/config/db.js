const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  // In automated test environment, database is mocked or provided by test runner
  if (process.env.NODE_ENV === 'test') {
    return null;
  }

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`[Database Warning] MongoDB connection attempt failed: ${error.message}`);
    console.warn(`[Database Warning] Backend will continue running in offline/standby mode for non-DB health checks.`);
    return null;
  }
};

module.exports = connectDB;

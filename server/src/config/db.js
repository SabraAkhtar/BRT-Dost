const mongoose = require('mongoose');

let mongod = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const isProduction = process.env.NODE_ENV === 'production';

  // Production Mode: MongoDB Atlas is required for persistent data
  if (isProduction) {
    if (!uri || uri.trim() === '' || uri === 'memory') {
      console.error('[DB] FATAL: MONGODB_URI environment variable is required in production mode to connect to MongoDB Atlas.');
      console.error('[DB] Please set MONGODB_URI in your Render environment variables.');
      process.exit(1);
    }

    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000
      });
      console.log(`[DB] Successfully connected to MongoDB Atlas: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.error(`[DB] FATAL: Failed to connect to MongoDB Atlas: ${err.message}`);
      console.error(`[DB] Please verify your MongoDB Atlas cluster connection string, user credentials, and Network Access (IP whitelist) settings.`);
      process.exit(1);
    }
  }

  // Development / Test Mode: Use provided URI or fallback to In-Memory MongoDB
  if (uri && uri.trim() !== '' && uri !== 'memory') {
    try {
      const conn = await mongoose.connect(uri);
      console.log(`[DB] Connected to MongoDB Atlas/Host: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.warn(`[DB] Connection to provided MONGODB_URI failed: ${err.message}.`);
      console.log(`[DB] Falling back to In-Memory MongoDB for testing/development...`);
    }
  }

  // Fallback to In-Memory MongoDB Server for local development/testing
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongod = await MongoMemoryServer.create();
    const memoryUri = mongod.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(`[DB] Connected to In-Memory MongoDB (Zero-configuration mode).`);
    console.log(`[DB] Running on: ${memoryUri}`);
    return conn;
  } catch (error) {
    console.error(`[DB] Fatal error initializing database: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
    console.log('[DB] Disconnected from MongoDB');
  } catch (err) {
    console.error(`[DB] Error disconnecting: ${err.message}`);
  }
};

module.exports = { connectDB, disconnectDB };

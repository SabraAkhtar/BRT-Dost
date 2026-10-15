require('dotenv').config();
const http = require('http');
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');
const { seedDatabase } = require('./utils/seed');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connect to database
    await connectDB();

    // Ensure database contains essential Peshawar BRT seed data
    await seedDatabase(false);

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`  BRT DOST — Peshawar Transport Verification Engine`);
      console.log(`  Server listening on http://localhost:${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Trust & Freshness Engine: ACTIVE`);
      console.log(`=================================================`);
    });

    // Graceful shutdown
    const handleShutdown = async (signal) => {
      console.log(`\n[Server] Received ${signal}. Gracefully shutting down...`);
      server.close(async () => {
        await disconnectDB();
        console.log('[Server] Process terminated cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));

  } catch (err) {
    console.error(`[Server] Startup failure: ${err.message}`, err);
    process.exit(1);
  }
}

startServer();

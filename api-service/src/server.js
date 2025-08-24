const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./services/database');
const queueService = require('./services/queueService');
const cacheService = require('./services/cacheService');
const routes = require('./routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

async function initializeServices() {
  try {
    await Promise.all([
      connectDB().then(() => console.log("Database initialized")),
      cacheService.connect().then(() => console.log("Cache initialized")),
      queueService.connect().then(() => console.log("Queue initialized"))
    ]);

    console.log("All services initialized");
  } catch (error) {
    console.error("Failed to initialize services:", error.message);
    process.exit(1);
  }
}

initializeServices();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api', routes);

app.use((err, req, res, next) => {
  console.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  return res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

app.get("/", async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "API Server is running..."
  });
});


async function gracefulShutdown() {
  console.log('Shutdown signal received, shutting down gracefully...');

  try {
    if (queueService.close) {
      await queueService.close();
      console.log('Queue service closed');
    }

    if (cacheService.close) {
      await cacheService.close();
      console.log('Cache service closed');
    }

    await mongoose.disconnect();
    console.log('Database disconnected');

    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error.message);
    process.exit(1);
  }
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

app.listen(PORT, () => {
  console.log(`API Service running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

module.exports = app;

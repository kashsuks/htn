const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const rbcRoutes = require('./routes/rbc');
const gameRoutes = require('./routes/game');
const rbcTradingRoutes = require('./routes/rbc-trading');
const userRoutes = require('./routes/users');
const stockEventRoutes = require('./routes/stock-events');
const groqRoutes = require('./routes/groq');

// Use MongoDB for data storage
const mongoDBService = require('./services/mongodb');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:3005',
    'http://localhost:3007',
    'http://localhost:3015',
    process.env.CORS_ORIGIN || 'http://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes
app.use('/api/rbc', rbcRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/rbc-trading', rbcTradingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stock-events', stockEventRoutes);
app.use('/api/groq', groqRoutes);
app.use('/users', userRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
});

// Initialize MongoDB connection and start server
async function startServer() {
  try {
    // Try to connect to MongoDB with timeout
    console.log('🔄 Attempting to connect to MongoDB...');
    const connectionPromise = mongoDBService.connect();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('MongoDB connection timeout')), 10000)
    );
    
    await Promise.race([connectionPromise, timeoutPromise]);
    console.log('✅ MongoDB connected successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('🚫 Server cannot start without database connection');
    process.exit(1);
  }
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`🚀 InvestEase Showdown Backend running on port ${PORT}`);
    console.log(`🌐 CORS enabled for: http://localhost:5173,http://localhost:3005,${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`🗄️ Database: MongoDB`);
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  await mongoDBService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down server...');
  await mongoDBService.disconnect();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;

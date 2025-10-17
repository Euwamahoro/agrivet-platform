// src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

console.log('🔄 Loading routes...');

// Test route - add this first
app.post('/api/test-login', (req, res) => {
  console.log('✅ Test login route called:', req.body);
  res.json({ 
    message: 'Test route works!', 
    body: req.body,
    timestamp: new Date().toISOString()
  });
});

// Routes with error handling
try {
  console.log('🔄 Loading auth routes...');
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes mounted successfully');
} catch (error) {
  console.error('❌ Failed to load auth routes:', error.message);
  console.error('❌ Full error:', error);
}

try {
  console.log('🔄 Loading graduate routes...');
  const graduateRoutes = require('./routes/graduates');
  app.use('/api/graduates', graduateRoutes);
  console.log('✅ Graduate routes mounted successfully');
} catch (error) {
  console.error('❌ Failed to load graduate routes:', error.message);
}

try {
  console.log('🔄 Loading service request routes...');
  const serviceRequestRoutes = require('./routes/serviceRequests');
  app.use('/api/service-requests', serviceRequestRoutes);
  console.log('✅ Service request routes mounted successfully');
} catch (error) {
  console.error('❌ Failed to load service request routes:', error.message);
}

// Health check route
app.get('/api/health', (req, res) => {
  console.log('✅ Health check called');
  res.json({ 
    status: 'OK', 
    message: 'AgriVet API is running',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/admin', require('./routes/admin'));

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 - Route not found:', req.originalUrl);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 AgriVet Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Test login: POST http://localhost:${PORT}/api/test-login`);
});

module.exports = app;
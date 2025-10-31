// src/server.js - COMPLETE UPDATED VERSION
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

// ✅ ENVIRONMENT-BASED CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [
      'https://agrivet-web.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080'
    ];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'x-auth-token'
  ],
  exposedHeaders: ['x-auth-token'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

console.log('🔧 CORS configured for origins:', allowedOrigins);

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

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.json({
    message: 'CORS is working!',
    allowedOrigins: allowedOrigins,
    timestamp: new Date().toISOString()
  });
});

// Explicit preflight for login
app.options('/api/auth/login', cors(corsOptions));

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

// Sync routes
try {
  console.log('🔄 Loading sync routes...');
  const syncRoutes = require('./routes/sync');
  app.use('/api/sync', syncRoutes);
  console.log('✅ Sync routes mounted successfully');
} catch (error) {
  console.error('❌ Failed to load sync routes:', error.message);
}

// Test sync endpoint (temporary for testing)
app.get('/api/test-sync', async (req, res) => {
  try {
    console.log('🔄 Manual sync triggered via test endpoint');
    const syncService = require('./services/syncService');
    const result = await syncService.syncFromUSSDToWeb();
    
    res.json({ 
      success: true, 
      message: 'Sync completed successfully',
      result 
    });
  } catch (error) {
    console.error('❌ Sync test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health check route
app.get('/api/health', (req, res) => {
  console.log('✅ Health check called');
  res.json({ 
    status: 'OK', 
    message: 'AgriVet API is running',
    timestamp: new Date().toISOString(),
    cors: {
      enabled: true,
      allowedOrigins: allowedOrigins
    }
  });
});

// Admin routes
try {
  console.log('🔄 Loading admin routes...');
  app.use('/api/admin', require('./routes/admin'));
  console.log('✅ Admin routes mounted successfully');
} catch (error) {
  console.error('❌ Failed to load admin routes:', error.message);
}

// 404 handler
app.use('*', (req, res) => {
  console.log('❌ 404 - Route not found:', req.originalUrl);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    allowedOrigins: allowedOrigins
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  
  // Handle CORS errors specifically
  if (error.message.includes('CORS')) {
    return res.status(403).json({ 
      error: 'CORS Error',
      message: 'Request blocked by CORS policy',
      allowedOrigins: allowedOrigins
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 AgriVet Backend Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: https://agrivet-backend.up.railway.app/api/health`);
  console.log(`🔗 CORS test: https://agrivet-backend.up.railway.app/api/cors-test`);
  console.log(`🔗 Test login: POST https://agrivet-backend.up.railway.app/api/test-login`);
  console.log(`🔗 Test sync: GET https://agrivet-backend.up.railway.app/api/test-sync`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
});

module.exports = app;
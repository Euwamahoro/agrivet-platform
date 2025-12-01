# 🌾 AgriVet Platform

[![Demo Video](https://img.shields.io/badge/📹-Watch_Demo-9B59B6?style=for-the-badge)](https://go.screenpal.com/watch/cTXVF0nFDwh)
[![Web Platform](https://img.shields.io/badge/🌐-Live_Platform-2563eb?style=for-the-badge)](https://agrivet-web.vercel.app)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE.md)

A comprehensive agricultural support platform connecting farmers with agricultural graduates for veterinary and agronomy services through USSD and web interfaces, along with access to agricultural tips and weather information.

---

## 📋 Table of Contents

- [Quick Access](#-quick-access)
- [Overview](#-overview)
- [Core Features](#-core-features)
- [System Architecture](#-system-architecture)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#️-installation--setup)
  - [Backend Setup](#-backend-setup)
  - [USSD Service Setup](#-ussd-service-setup)
  - [Web Frontend Setup](#-web-frontend-setup)
- [Running the Project](#-running-the-project)
- [Testing](#-testing)
- [Usage Guide](#-usage-guide)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Quick Access

| Service | URL | Status |
|---------|-----|--------|
| 🌐 **Web Platform** | [https://agrivet-web.vercel.app](https://agrivet-web.vercel.app) | ✅ Live |
| 🔗 **Backend API** | [https://agrivet.up.railway.app](https://agrivet.up.railway.app) | ✅ Live |
| 📞 **USSD API** | [https://agrivet-ussd.onrender.com](https://agrivet-ussd.onrender.com) | ✅ Live |
| 🎥 **Demo Video** | [Watch 5-minute demo](https://go.screenpal.com/watch/cTXVF0nFDwh) | 📹 Available |
| 📱 **USSD Service** | Dial provided USSD code | 🔜 Coming Soon |

---

## 🌟 Overview

AgriVet provides farmers with access to agricultural experts through multiple channels:

- **USSD Service**: Accessible via basic mobile phones without internet connection
- **Web Platform**: For graduates and administrators to manage service requests
- **Real-time Sync**: Seamless data synchronization between USSD and web platforms
- **Multi-language Support**: Available in English, Kinyarwanda, and Swahili

### Key Benefits

✅ **For Farmers**: Instant access to agricultural experts without internet  
✅ **For Graduates**: Employment opportunities and service management  
✅ **For Administrators**: Comprehensive platform oversight and analytics  
✅ **For Rwanda**: Digital transformation of agricultural extension services

---

## 🚀 Core Features

### 👨‍🌾 For Farmers (USSD)

- 📝 **Service Requests**: Request veterinary or agronomy services
- 👤 **Farmer Registration**: Simple registration via USSD menu
- 🌤️ **Weather Information**: Get localized weather updates
- 🌱 **Farming Tips**: Access agricultural best practices
- 📊 **Request Status**: Track service request progress in real-time

### 🎓 For Graduates (Web)

- 📋 **Request Management**: View and accept service requests based on location
- 📞 **Farmer Communication**: Access farmer contact information
- 🔄 **Service Tracking**: Manage assigned service requests through completion
- 👤 **Profile Management**: Update availability status and expertise
- ⭐ **Rating System**: Build reputation through farmer ratings

### 🧑‍💼 For Administrators (Web)

- 📊 **Platform Analytics**: View comprehensive system statistics and metrics
- 👥 **User Management**: Monitor and manage farmers and graduates
- 🔄 **Sync Management**: Control data synchronization between systems
- 🔍 **Request Oversight**: Monitor all service requests platform-wide
- ✅ **Graduate Verification**: Approve and verify graduate credentials

---

## 🏗️ System Architecture

```
┌─────────────────┐
│  Farmer (USSD)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────┐      ┌──────────────────┐
│   USSD Service      │◄────►│  PostgreSQL DB   │
│  (Node.js/Express)  │      │   (USSD Data)    │
└──────────┬──────────┘      └──────────────────┘
           │
           │ Sync API
           │
           ▼
┌─────────────────────┐      ┌──────────────────┐
│   Backend API       │◄────►│   MongoDB        │
│  (Node.js/Express)  │      │   (Web Data)     │
└──────────┬──────────┘      └──────────────────┘
           │
           ▼
┌─────────────────────┐
│   Web Frontend      │
│   (React/Vite)      │
└─────────────────────┘
         ▲
         │
    ┌────┴─────┐
    │          │
Graduate    Admin
```

**Technology Stack:**
- **Frontend**: React.js, Vite, TailwindCSS
- **Backend**: Node.js, Express.js
- **USSD**: Node.js, PostgreSQL
- **Web Database**: MongoDB
- **Deployment**: Vercel, Railway, Render

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

| Software | Version | Installation Guide |
|----------|---------|-------------------|
| **Node.js** | 16.x or higher | [Download](https://nodejs.org/) |
| **npm** | 8.x or higher | Comes with Node.js |
| **MongoDB** | 5.x or higher | [Installation Guide](https://docs.mongodb.com/manual/installation/) |
| **PostgreSQL** | 13.x or higher | [Installation Guide](https://www.postgresql.org/download/) |
| **Git** | Latest | [Download](https://git-scm.com/) |

### Optional Tools

- **Postman** or **Thunder Client**: For API testing
- **MongoDB Compass**: GUI for MongoDB management
- **pgAdmin**: GUI for PostgreSQL management
- **Redis**: For session management (optional)

### Verify Installation

Run these commands to verify your installations:

```bash
node --version    # Should output v16.x.x or higher
npm --version     # Should output 8.x.x or higher
mongo --version   # Should output MongoDB version
psql --version    # Should output PostgreSQL version
git --version     # Should output Git version
```

---

## 🛠️ Installation & Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/Euwamahoro/agrivet-platform.git

# Navigate to project directory
cd agrivet-platform
```

### Step 2: Project Structure

Verify you have the following structure:

```
agrivet-platform/
├── agrivet-backend/          # Main backend API (MongoDB)
├── agrivet-ussd/             # USSD service (PostgreSQL)
├── agrivet-web/              # React frontend
└── README.md
```

---

## 🔧 Backend Setup

### 1. Navigate to Backend Directory

```bash
cd agrivet-backend
```

### 2. Install Dependencies

```bash
npm install
```

**Expected Output:**
```
added XXX packages in Xs
```

### 3. Configure Environment Variables

Create a `.env` file in the `agrivet-backend` directory:

```bash
# Create .env file
touch .env

# Or on Windows
type nul > .env
```

Add the following configuration to `.env`:

```env
# =================================
# DATABASE CONFIGURATION
# =================================
MONGODB_URI=mongodb://localhost:27017/agrivet
# For MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/agrivet

# =================================
# SERVER CONFIGURATION
# =================================
PORT=8080
NODE_ENV=development

# =================================
# CORS CONFIGURATION
# =================================
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://agrivet-web.vercel.app

# =================================
# JWT AUTHENTICATION
# =================================
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# =================================
# SYNC CONFIGURATION
# =================================
USSD_API_URL=http://localhost:10000
WEB_API_URL=http://localhost:8080

# For production:
# USSD_API_URL=https://agrivet-ussd.onrender.com
# WEB_API_URL=https://agrivet.up.railway.app

# =================================
# EMAIL CONFIGURATION (Optional)
# =================================
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your_email@gmail.com
# EMAIL_PASS=your_app_password
```

### 4. Setup MongoDB Database

**Option A: Local MongoDB**

```bash
# Start MongoDB service
# On macOS:
brew services start mongodb-community

# On Ubuntu/Linux:
sudo systemctl start mongod

# On Windows:
# Start MongoDB from Services or run:
"C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe"

# Verify MongoDB is running
mongosh
# You should see MongoDB shell prompt
```

**Option B: MongoDB Atlas (Cloud)**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string
4. Replace `MONGODB_URI` in `.env` with your Atlas connection string

### 5. Initialize Database

```bash
# Setup MongoDB collections and indexes
npm run db:setup
```

**Expected Output:**
```
✅ Database setup complete
✅ Collections created: farmers, graduates, serviceRequests, users
✅ Indexes created successfully
```

### 6. Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

**Expected Output:**
```
🚀 Server running on port 8080
✅ MongoDB Connected: localhost
🌐 Environment: development
```

### 7. Verify Backend is Running

Open a new terminal and test:

```bash
# Health check
curl http://localhost:8080/api/health

# Expected response:
# {"status":"ok","timestamp":"2024-XX-XX..."}
```

Or visit in browser: `http://localhost:8080/api/health`

---

## 📞 USSD Service Setup

### 1. Navigate to USSD Directory

```bash
# Open new terminal
cd agrivet-platform/agrivet-ussd
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create `.env` file:

```bash
touch .env  # or: type nul > .env (Windows)
```

Add the following configuration:

```env
# =================================
# DATABASE CONFIGURATION
# =================================
DATABASE_URL=postgresql://postgres:password@localhost:5432/agrivet_ussd
# Format: postgresql://username:password@host:port/database

# =================================
# SERVER CONFIGURATION
# =================================
PORT=10000
NODE_ENV=development

# =================================
# SYNC CONFIGURATION
# =================================
WEB_API_URL=http://localhost:8080
# For production: https://agrivet.up.railway.app

# =================================
# AFRICA'S TALKING CONFIGURATION (Optional)
# =================================
# AT_USERNAME=sandbox
# AT_API_KEY=your_api_key
```

### 4. Setup PostgreSQL Database

**Step 4.1: Create Database**

```bash
# Open PostgreSQL terminal
psql -U postgres

# In psql terminal:
CREATE DATABASE agrivet_ussd;

# Verify database creation
\l

# Exit psql
\q
```

**Step 4.2: Verify Connection**

```bash
# Test connection
psql -U postgres -d agrivet_ussd

# If successful, you'll see:
# agrivet_ussd=#
```

### 5. Run Database Migrations

```bash
# Run migrations to create tables
npm run migrate

# Or manually:
node src/migrations/setup.js
```

**Expected Output:**
```
✅ Running database migrations...
✅ Table 'farmers' created
✅ Table 'graduates' created
✅ Table 'service_requests' created
✅ All migrations completed successfully
```

### 6. Seed Test Data (Optional)

```bash
# Add sample data for testing
npm run seed
```

### 7. Start USSD Service

```bash
npm start
```

**Expected Output:**
```
🚀 USSD Service running on port 10000
✅ PostgreSQL Connected successfully
🌐 Environment: development
```

### 8. Verify USSD Service

Test the USSD endpoint:

```bash
# Health check
curl http://localhost:10000/health

# Test USSD session
curl -X POST http://localhost:10000/ussd \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test123",
    "serviceCode": "*123#",
    "phoneNumber": "+250788000000",
    "text": ""
  }'
```

**Expected Response:**
```
CON Welcome to AgriVet
1. English
2. Kinyarwanda
3. Swahili
```

---

## 💻 Web Frontend Setup

### 1. Navigate to Web Directory

```bash
# Open new terminal
cd agrivet-platform/agrivet-web
```

### 2. Install Dependencies

```bash
npm install
```

**If you encounter errors:**
```bash
# Clear npm cache
npm cache clean --force

# Retry installation
npm install
```

### 3. Configure Environment Variables

Create `.env` file:

```bash
touch .env  # or: type nul > .env (Windows)
```

Add the following configuration:

```env
# =================================
# API CONFIGURATION
# =================================
VITE_API_URL=http://localhost:8080/api
VITE_USSD_API_URL=http://localhost:10000

# For production:
# VITE_API_URL=https://agrivet.up.railway.app/api
# VITE_USSD_API_URL=https://agrivet-ussd.onrender.com

# =================================
# APP CONFIGURATION
# =================================
VITE_APP_NAME=AgriVet Platform
VITE_APP_VERSION=1.0.0
```

### 4. Start Development Server

```bash
npm run dev
```

**Expected Output:**
```
  VITE v4.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
  ➜  press h to show help
```

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:5173
```

You should see the AgriVet login page.

---

## 🎮 Running the Project

### Complete Startup Sequence

**Terminal 1 - Backend API:**
```bash
cd agrivet-backend
npm run dev
# Running on http://localhost:8080
```

**Terminal 2 - USSD Service:**
```bash
cd agrivet-ussd
npm start
# Running on http://localhost:10000
```

**Terminal 3 - Web Frontend:**
```bash
cd agrivet-web
npm run dev
# Running on http://localhost:5173
```

### Quick Start Script (Optional)

Create a `start-all.sh` script in the root directory:

```bash
#!/bin/bash

# Start backend
cd agrivet-backend && npm run dev &

# Start USSD
cd agrivet-ussd && npm start &

# Start frontend
cd agrivet-web && npm run dev &

echo "✅ All services started!"
echo "Backend: http://localhost:8080"
echo "USSD: http://localhost:10000"
echo "Frontend: http://localhost:5173"
```

Make it executable:
```bash
chmod +x start-all.sh
./start-all.sh
```

---

## 🧪 Testing

### Backend Tests

```bash
cd agrivet-backend

# Run all tests
npm test

# Run specific test suite
npm test -- --grep "Farmer"

# Run with coverage
npm run test:coverage
```

### USSD Service Tests

```bash
cd agrivet-ussd

# Run unit tests
npm test

# Test USSD flows
npm run test:ussd
```

### Frontend Tests

```bash
cd agrivet-web

# Run component tests
npm test

# Run E2E tests
npm run test:e2e
```

### Manual Testing Checklist

#### ✅ USSD Testing
- [ ] Farmer can register via USSD
- [ ] Service request creation works
- [ ] Language selection functions correctly
- [ ] Weather information displays
- [ ] Request status tracking works

#### ✅ Web Platform Testing
- [ ] Graduate can login
- [ ] Available requests display correctly
- [ ] Graduate can accept requests
- [ ] Admin can view analytics
- [ ] Data syncs between USSD and web

---

## 📱 Usage Guide

### For Moderators/Reviewers

#### 1. Create Test Accounts

**Graduate Account:**
```bash
# Use the web interface
1. Go to http://localhost:5173/register
2. Select "Graduate" role
3. Fill in:
   - Name: Test Graduate
   - Email: graduate@test.com
   - Password: Test123!
   - Specialization: Agronomy
   - Location: Kigali, Gasabo
```

**Admin Account:**
```bash
# Create via MongoDB shell or seed script
mongosh agrivet
db.users.insertOne({
  name: "Admin User",
  email: "admin@test.com",
  password: "$2a$10$...", // hashed "Admin123!"
  role: "admin",
  createdAt: new Date()
})
```

#### 2. Test USSD Flow

Use the curl command or Postman:

**Step 1: Initial USSD Dial**
```bash
curl -X POST http://localhost:10000/ussd \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "ATUid_1234567890",
    "serviceCode": "*123#",
    "phoneNumber": "+250788123456",
    "text": ""
  }'
```

**Step 2: Select Language (English)**
```bash
curl -X POST http://localhost:10000/ussd \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "ATUid_1234567890",
    "serviceCode": "*123#",
    "phoneNumber": "+250788123456",
    "text": "1"
  }'
```

**Step 3: Register Farmer**
```bash
curl -X POST http://localhost:10000/ussd \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "ATUid_1234567890",
    "serviceCode": "*123#",
    "phoneNumber": "+250788123456",
    "text": "1*1"
  }'
```

Continue this flow to complete registration and service requests.

#### 3. Verify Sync

**Check USSD Database:**
```bash
psql -U postgres -d agrivet_ussd
SELECT * FROM farmers;
SELECT * FROM service_requests;
```

**Check Web Database:**
```bash
mongosh agrivet
db.farmers.find()
db.serviceRequests.find()
```

---

## 📚 API Documentation

### Backend API Endpoints

**Base URL:** `http://localhost:8080/api`

#### Authentication

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "graduate",
  "specialization": "veterinary"
}
```

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

#### Service Requests

```http
GET /api/service-requests/available
Authorization: Bearer <token>

Response:
[
  {
    "id": "...",
    "farmerName": "Test Farmer",
    "serviceType": "veterinary",
    "description": "Cow is sick",
    "location": { ... }
  }
]
```

```http
POST /api/service-requests/:id/accept
Authorization: Bearer <token>

Response:
{
  "message": "Request accepted",
  "request": { ... }
}
```

#### Admin Endpoints

```http
GET /api/admin/stats
Authorization: Bearer <admin-token>

Response:
{
  "totalFarmers": 150,
  "totalGraduates": 45,
  "activeRequests": 12,
  "completedRequests": 203
}
```

### USSD API Endpoints

**Base URL:** `http://localhost:10000`

```http
POST /ussd
Content-Type: application/json

{
  "sessionId": "unique-session-id",
  "serviceCode": "*123#",
  "phoneNumber": "+250788000000",
  "text": "1*1*John Doe"
}
```

### Sync Endpoints

```http
POST /api/sync/farmers
GET /api/sync/service-requests
GET /api/test-sync
```

---

## 🔍 Troubleshooting

### Common Issues and Solutions

#### Issue 1: MongoDB Connection Failed

**Error:**
```
MongooseError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**
```bash
# Check if MongoDB is running
sudo systemctl status mongod  # Linux
brew services list | grep mongodb  # macOS

# Start MongoDB
sudo systemctl start mongod  # Linux
brew services start mongodb-community  # macOS

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log
```

#### Issue 2: PostgreSQL Connection Failed

**Error:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql  # Linux
brew services list | grep postgresql  # macOS

# Start PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql  # macOS

# Verify credentials
psql -U postgres -d agrivet_ussd
```

#### Issue 3: Port Already in Use

**Error:**
```
Error: listen EADDRINUSE: address already in use :::8080
```

**Solutions:**
```bash
# Find process using the port
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Kill the process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or change port in .env file
PORT=8081
```

#### Issue 4: npm install Fails

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still failing, try:
npm install --legacy-peer-deps
```

#### Issue 5: CORS Errors

**Error:**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution:**
Update `ALLOWED_ORIGINS` in backend `.env`:
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### Issue 6: Frontend Build Errors

**Solutions:**
```bash
# Check Node version
node --version  # Should be 16+

# Clear Vite cache
rm -rf node_modules/.vite

# Rebuild
npm run dev
```

### Getting Help

If you encounter issues not listed here:

1. **Check the logs:**
   - Backend: Check terminal output
   - USSD: Check `logs/ussd.log`
   - Frontend: Check browser console (F12)

2. **Database connection:**
   ```bash
   # Test MongoDB
   mongosh agrivet
   
   # Test PostgreSQL
   psql -U postgres -d agrivet_ussd
   ```

3. **Environment variables:**
   ```bash
   # Print current env vars (be careful not to share sensitive data)
   cat .env
   ```

4. **Open an issue:** [GitHub Issues](https://github.com/Euwamahoro/agrivet-platform/issues)

---

## 🌐 Deployment

### Backend Deployment (Railway)

1. **Create Railway Account:** [railway.app](https://railway.app)

2. **Create New Project:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Initialize project
   cd agrivet-backend
   railway init
   ```

3. **Add Environment Variables** in Railway Dashboard

4. **Deploy:**
   ```bash
   railway up
   ```

### USSD Service Deployment (Render)

1. **Create Render Account:** [render.com](https://render.com)

2. **Create New Web Service:**
   - Connect GitHub repository
   - Select `agrivet-ussd` directory
   - Set environment variables
   - Deploy

3. **Add PostgreSQL Database:**
   - Create PostgreSQL instance
   - Copy connection string
   - Update environment variables

### Frontend Deployment (Vercel)

1. **Create Vercel Account:** [vercel.com](https://vercel.com)

2. **Deploy:**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Deploy
   cd agrivet-web
   vercel
   ```

3. **Configure Environment Variables** in Vercel Dashboard

4. **Update Production URLs** in all `.env` files

---

## 🔄 Data Synchronization

The platform automatically syncs data between USSD and web systems:

### Sync Flow

```
USSD (PostgreSQL) ──────┐
                        │
                        ▼
                   Sync Service
                        │
                        ▼
Web (MongoDB) ──────────┘
```

### Manual Sync

```bash
# Trigger manual sync
curl http://localhost:8080/api/test-sync

# Sync farmers only
curl -X POST http://localhost:8080/api/sync/farmers

# Sync service requests
curl -X POST http://localhost:8080/api/sync/service-requests
```

### Monitoring Sync Status

```bash
# Check last sync time
curl http://localhost:8080/api/sync/status

Response:
{
  "lastSync": "2024-XX-XX...",
  "farmersSynced": 150,
  "requestsSynced": 45
}
```

---

## 📊 Database Schema

### PostgreSQL (USSD)

**farmers table:**
```sql
id              SERIAL PRIMARY KEY
phone_number    VARCHAR(15) UNIQUE
name            VARCHAR(100)
province        VARCHAR(50)
district        VARCHAR(50)
sector          VARCHAR(50)
cell            VARCHAR(50)
created_at      TIMESTAMP
```

**service_requests table:**
```sql
id              SERIAL PRIMARY KEY
farmer_id       INTEGER REFERENCES farmers(id)
service_type    VARCHAR(20)
description     TEXT
status          VARCHAR(20)
created_at      TIMESTAMP
```

### MongoDB (Web)

**Farmers collection:**
```javascript
{
  _id: ObjectId,
  phoneNumber: String,
  name: String,
  location: {
    province: String,
    district: String,
    sector: String,
    cell: String
  },
  createdAt: Date
}
```

**ServiceRequests collection:**
```javascript
{
  _id: ObjectId,
  farmer: ObjectId,
  graduate: ObjectId,
  serviceType: String,
  description: String,
  status: String,
  createdAt: Date,
  assignedAt: Date,
  completedAt: Date
}
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### 1. Fork the Repository

Click the "Fork" button on GitHub

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/agrivet-platform.git
cd agrivet-platform
```

### 3. Create a Feature Branch

```bash
git checkout -b feature/amazing-feature
```

### 4. Make Your Changes

- Follow the existing code style
- Add tests for new features
- Update documentation

### 5. Commit Your Changes

```bash
git add .
git commit -m 'Add some amazing feature'
```

### 6. Push to Your Branch

```bash
git push origin feature/amazing-feature
```

### 7. Open a Pull Request

Go to the original repository and click "New Pull Request"

### Code Style Guidelines

- Use ES6+ JavaScript features
- Follow Airbnb style guide
- Write meaningful commit messages
- Add comments for complex logic
- Keep functions small and focused

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

### MIT License Summary

- ✅ Commercial use
- ✅ Modification
- ✅ Distribution
- ✅ Private use
- ❌ Liability
- ❌ Warranty

---

## 🙏 Acknowledgments

Special thanks to:

- **Rwanda Agriculture Board (RAB)** for guidance and support
- **Local farming communities** for valuable feedback and testing
- **Agricultural graduates** for active participation
- **Ministry of Agriculture (MINAGRI)** for policy alignment
- **Africa's Talking** for USSD infrastructure
- **Open Source Community** for amazing tools and libraries

---

## 👨‍💻 Author

**Uwamahoro Enock**

- 🌐 GitHub: [@Euwamahoro](https://github.com/Euwamahoro)
- 📧 Email: [Contact via GitHub](https://github.com/Euwamahoro)
- 💼 LinkedIn: [Connect on LinkedIn](#)

---

## 📞 Support

Need help? Here's how to get support:

1. **📖 Documentation**: Check this README first
2. **🐛 Bug Reports**: [Open an issue](https://github.com/Euwamahoro/agrivet-platform/issues)
3. **💡 Feature Requests**: [Submit a feature request](https://github.com/Euwamahoro/agrivet-platform/issues)
4. **❓ Questions**: [GitHub Discussions](https://github.com/Euwamahoro/agrivet-platform/discussions)

---

## 📈 Project Status

| Metric | Status |
|--------|--------|
| Build | ![Passing](https://img.shields.io/badge/build-passing-brightgreen) |
| Tests | ![Coverage 85%](https://img.shields.io/badge/coverage-85%25-green
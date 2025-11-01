🌾 AgriVet Platform

A comprehensive agricultural support platform connecting farmers with agricultural graduates for veterinary and agronomy services through USSD and web interfaces, along with access to agricultural tips and weather information.

🌟 Overview

AgriVet provides farmers with access to agricultural experts through multiple channels:

USSD Service: Accessible via mobile phones without internet

Web Platform: For graduates and administrators to manage requests

Real-time Sync: Seamless data synchronization between USSD and web platforms

🚀 Core Features
👨‍🌾 For Farmers (USSD)

Service Requests: Request veterinary or agronomy services

Farmer Registration: Simple registration via USSD

Weather Information: Get localized weather updates

Farming Tips: Access agricultural best practices

Request Status: Track service request status

🎓 For Graduates (Web)

Request Management: View and accept service requests

Farmer Communication: Access farmer contact information

Service Tracking: Manage assigned service requests

Profile Management: Update availability and expertise

🧑‍💼 For Administrators (Web)

Platform Analytics: View system statistics and metrics

User Management: Monitor farmers and graduates

Sync Management: Control data synchronization

Request Oversight: Monitor all service requests

🛠️ Installation & Setup
🔧 Prerequisites

Node.js 16+

MongoDB

PostgreSQL

Redis
 (for session management)

🖥️ Backend Setup
# Clone the repository
git clone https://github.com/Euwamahoro/agrivet-platform.git
cd agrivet-platform/agrivet-backend


Install dependencies:

npm install


Environment Configuration:
Create a .env file:

# Database
MONGODB_URI=mongodb://localhost:27017/agrivet
DATABASE_URL=postgresql://user:pass@localhost:5432/agrivet_ussd

# Server
PORT=8080
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://agrivet-web.vercel.app

# Sync
USSD_API_URL=https://agrivet-ussd.onrender.com
WEB_API_URL=https://agrivet.up.railway.app


Database Setup:

# Setup MongoDB collections
npm run db:setup

# Run USSD database migrations
npm run migrate


Start the server:

# Development
npm run dev

# Production
npm start

📞 USSD Service Setup
cd ../agrivet-ussd


Install dependencies:

npm install


Environment Configuration:
Create a .env file:

DATABASE_URL=postgresql://user:pass@localhost:5432/agrivet_ussd
PORT=10000
NODE_ENV=development


Start USSD service:

npm start

💻 Web Frontend Setup
cd ../agrivet-web


Install dependencies:

npm install


Environment Configuration:
Create a .env file:

VITE_API_URL=https://agrivet.up.railway.app/api
VITE_USSD_API_URL=https://agrivet-ussd.onrender.com


Start development server:

npm run dev

📱 Usage
📲 USSD Access

Dial: *MUO to be given soon# (or your USSD code)

Select language (English, Kinyarwanda, Swahili)

Register as a farmer or request services

Access weather information and farming tips

🌍 Web Platform Access

Graduates: Manage service requests and farmer communications

Administrators: Monitor platform activity and sync status

URL: https://agrivet-web.vercel.app

🔄 Data Synchronization

The platform supports real-time sync between USSD and web databases:

Farmers: Registered via USSD appear instantly on the web platform

Service Requests: Created via USSD are immediately available to graduates

Status Updates: Graduate actions sync back to the USSD system

🔗 Sync Endpoints
Endpoint	Description
GET /api/test-sync	Manual sync trigger
POST /api/sync/farmers	Sync farmers from USSD to web
POST /api/sync/service-requests	Sync service requests
🗂️ Project Structure
agrivet-platform/
├── agrivet-backend/          # Main backend API
│   ├── src/
│   │   ├── models/           # MongoDB models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   └── config/           # Database configuration
├── agrivet-ussd/             # USSD service
│   ├── src/
│   │   ├── models/           # PostgreSQL models
│   │   ├── routes/           # USSD routes
│   │   ├── services/         # USSD logic
│   │   └── controllers/      # USSD controllers
└── agrivet-web/              # React frontend
    ├── src/
    │   ├── components/       # React components
    │   ├── pages/            # Page components
    │   └── services/         # API services

🌐 Deployment
🧩 Backend Deployment (Railway)
# Set environment variables in Railway dashboard
# Connect GitHub repository for auto-deploy

☁️ USSD Service Deployment (Render)
# Connect repository to Render
# Set environment variables
# Deploy as a web service

💫 Frontend Deployment (Vercel)
# Connect repository to Vercel
# Set environment variables
# Deploy with default settings

📊 Database Schema
🗄️ USSD Database (PostgreSQL)

farmers: Farmer registrations and contact information

graduates: Agricultural experts and their availability

service_requests: Service requests from farmers

💽 Web Database (MongoDB)

Farmers: Synced farmer data with additional analytics

Graduates: Graduate profiles and assignment history

ServiceRequests: Service requests with status tracking

🔧 API Documentation
📡 USSD API (https://agrivet-ussd.onrender.com)
Method	Endpoint	Description
POST	/ussd	Handle USSD requests
GET	/api/farmers/sync	Get farmers for sync
GET	/api/service-requests/sync	Get service requests for sync
🌍 Web API (https://agrivet.up.railway.app)
Method	Endpoint	Description
POST	/api/sync/farmers	Sync farmers from USSD
POST	/api/sync/service-requests	Sync service requests
GET	/api/admin/stats	Get platform statistics
🎥 Demo Video

🎬 Watch 5-Minute Demo Video

Highlights:

USSD service requests and web platform management

Real-time synchronization

Farmer registration and service request flow

Graduate assignment and communication process

🌐 Live Deployment
Component	URL
Web Platform	https://agrivet-web.vercel.app

Backend API	https://agrivet.up.railway.app

USSD API	https://agrivet-ussd.onrender.com

USSD Service	Dial provided USSD code
🤝 Contributing

Fork the repository

Create a feature branch:

git checkout -b feature/amazing-feature


Commit your changes:

git commit -m 'Add amazing feature'


Push to your branch:

git push origin feature/amazing-feature


Open a Pull Request

📄 License

This project is licensed under the MIT License — see the LICENSE.md
 file for details.

🙏 Acknowledgments

Rwanda Agricultural Board for guidance

Local farming communities for feedback

Agricultural graduates for participation

✅ Author: Euwamahoro

📧 Contact: For inquiries or support, open an issue on GitHub.
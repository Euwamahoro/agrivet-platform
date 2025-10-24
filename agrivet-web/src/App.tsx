// src/App.tsx
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { store } from './store';
import Login from './pages/Login';
import Register from './pages/Register';
import GraduateDashboard from './pages/GraduateDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Graduate Pages
import AvailableRequests from './pages/AvailableRequests';
import MyAssignments from './pages/MyAssignments';
import RequestDetails from './pages/RequestDetails';
import GraduateProfile from './pages/GraduateProfile';

// Admin Pages - ADD THESE IMPORTS
import UserManagement from './pages/admin/UserManagement';
import ServiceRequestsAdmin from './pages/admin/ServiceRequestsAdmin';
import Analytics from './pages/admin/Analytics';
import AdminRegister from './pages/admin/AdminRegister';
function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Graduate Routes */}
            <Route path="/graduate" element={
              <ProtectedRoute allowedRoles={['graduate']}>
                <Layout>
                  <GraduateDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/graduate/requests" element={
              <ProtectedRoute allowedRoles={['graduate']}>
                <Layout>
                  <AvailableRequests />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/graduate/assignments" element={
              <ProtectedRoute allowedRoles={['graduate']}>
                <Layout>
                  <MyAssignments />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/graduate/requests/:requestId" element={
              <ProtectedRoute allowedRoles={['graduate']}>
                <Layout>
                  <RequestDetails />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/graduate/profile" element={
              <ProtectedRoute allowedRoles={['graduate']}>
                <Layout>
                  <GraduateProfile />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Admin Routes - ADD THESE NEW ROUTES */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <UserManagement />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/requests" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <ServiceRequestsAdmin />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/analytics" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Layout>
                  <Analytics />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/register/admin" element={<AdminRegister />} />
            
            <Route path="/" element={<Login />} />
          </Routes>
        </div>
      </Router>
    </Provider>
  );
}

export default App;
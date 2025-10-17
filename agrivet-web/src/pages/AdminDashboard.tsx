// src/pages/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { getPlatformStats, PlatformStats } from '../services/adminServices';

const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  // Real data from API
  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalFarmers: 0,
    totalGraduates: 0,
    activeRequests: 0,
    completedServices: 0,
    pendingRegistrations: 0,
    revenueThisMonth: 0,
  });

  const [recentActivities, setRecentActivities] = useState([
    {
      id: 1,
      type: 'service_request',
      description: 'New veterinary service request from Farmer John',
      time: '2 hours ago',
      status: 'pending'
    },
    {
      id: 2,
      type: 'graduate_registration',
      description: 'New graduate registered: Dr. Alice Uwase',
      time: '4 hours ago',
      status: 'completed'
    },
    {
      id: 3,
      type: 'service_completed',
      description: 'Agronomy service completed in Kayonza District',
      time: '1 day ago',
      status: 'completed'
    },
    {
      id: 4,
      type: 'system_alert',
      description: 'High demand for veterinary services in Northern Province',
      time: '2 days ago',
      status: 'alert'
    }
  ]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlatformStats();
  }, []);

  const fetchPlatformStats = async () => {
    try {
      setLoading(true);
      const stats = await getPlatformStats();
      setPlatformStats(stats);
    } catch (error) {
      console.error('Error fetching platform stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Platform overview and management console
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Welcome back,</p>
              <p className="text-lg font-semibold text-gray-900">{user?.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Statistics */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Farmers */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <span className="text-green-600 text-xl">👨‍🌾</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Farmers
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {platformStats.totalFarmers.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <span className="text-green-600 font-medium">+{Math.floor(platformStats.totalFarmers * 0.12)} </span>
              <span className="text-gray-500">this month</span>
            </div>
          </div>
        </div>

        {/* Total Graduates */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <span className="text-blue-600 text-xl">🎓</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Graduates
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {platformStats.totalGraduates}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <span className="text-green-600 font-medium">+{Math.floor(platformStats.totalGraduates * 0.05)} </span>
              <span className="text-gray-500">new this month</span>
            </div>
          </div>
        </div>

        {/* Active Requests */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <span className="text-yellow-600 text-xl">📋</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Requests
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {platformStats.activeRequests}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <span className={`font-medium ${platformStats.activeRequests > 20 ? 'text-red-600' : 'text-green-600'}`}>
                {platformStats.activeRequests > 20 ? 'High' : 'Normal'}
              </span>
              <span className="text-gray-500"> workload</span>
            </div>
          </div>
        </div>

        {/* Completed Services */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <span className="text-purple-600 text-xl">✅</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed Services
                  </dt>
                  <dd className="text-lg font-semibold text-gray-900">
                    {platformStats.completedServices}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <span className="text-green-600 font-medium">
                {platformStats.completedServices > 0 ? '+' : ''}{Math.floor(platformStats.completedServices * 0.08)}
              </span>
              <span className="text-gray-500"> this week</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => navigate('/admin/users')}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <span className="text-blue-600">👥</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">User Management</h4>
                    <p className="text-sm text-gray-500">Manage farmers and graduates</p>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </button>

              <button
                onClick={() => navigate('/admin/requests')}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <span className="text-green-600">📋</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">Service Requests</h4>
                    <p className="text-sm text-gray-500">Monitor all service requests</p>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </button>

              <button
                onClick={() => navigate('/admin/analytics')}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <span className="text-purple-600">📊</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">Platform Analytics</h4>
                    <p className="text-sm text-gray-500">View reports and insights</p>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </button>

              <button
                onClick={() => navigate('/admin/users?role=graduate&status=pending')}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <span className="text-yellow-600">⏳</span>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-sm font-medium text-gray-900">Pending Registrations</h4>
                    <p className="text-sm text-gray-500">
                      {platformStats.pendingRegistrations} waiting approval
                    </p>
                  </div>
                </div>
                <span className="text-gray-400">→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                    activity.status === 'completed' ? 'bg-green-400' : 
                    activity.status === 'alert' ? 'bg-red-400' : 'bg-yellow-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    activity.status === 'completed' ? 'bg-green-100 text-green-800' : 
                    activity.status === 'alert' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <button 
                onClick={() => navigate('/admin/requests')}
                className="text-sm text-green-600 hover:text-green-500 font-medium"
              >
                View all activity →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Platform Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {platformStats.totalFarmers + platformStats.totalGraduates}
              </div>
              <div className="text-sm text-gray-600">Total Users</div>
              <div className="text-xs text-gray-500">Platform growth</div>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {platformStats.completedServices}
              </div>
              <div className="text-sm text-gray-600">Services Delivered</div>
              <div className="text-xs text-gray-500">Impact measurement</div>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {platformStats.pendingRegistrations}
              </div>
              <div className="text-sm text-gray-600">Pending Approvals</div>
              <div className="text-xs text-gray-500">Requires attention</div>
            </div>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={fetchPlatformStats}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
        >
          Refresh Dashboard
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
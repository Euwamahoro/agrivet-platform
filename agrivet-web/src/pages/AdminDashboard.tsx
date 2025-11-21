// src/pages/AdminDashboard.tsx - REFINED VERSION
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import { getPlatformStats, PlatformStats } from '../services/adminServices';

interface SyncResult {
  success: boolean;
  farmers: number;
  serviceRequests: number;
  message?: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);

  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    totalFarmers: 0,
    totalGraduates: 0,
    activeRequests: 0,
    completedServices: 0,
    pendingRegistrations: 0,
    revenueThisMonth: 0,
  });

  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

  useEffect(() => {
    fetchPlatformStats();
  }, []);

  const fetchPlatformStats = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching platform stats...');
      const stats = await getPlatformStats();
      console.log('✅ Platform stats received:', stats);
      setPlatformStats(stats);
    } catch (error) {
      console.error('❌ Error fetching platform stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncUSSDData = async () => {
    try {
      setSyncLoading(true);
      setSyncResult(null);
      
      console.log('🔄 Starting USSD sync...');
      const syncUrl = 'https://agrivet.up.railway.app/api/test-sync';

      const response = await fetch(syncUrl);
      console.log('✅ Sync response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📊 Sync result received:', result);
      
      if (result.success) {
        setSyncResult(result.result || result);
        setLastSyncTime(new Date().toLocaleTimeString());
        console.log('🎉 Sync successful');
        
        // Refresh platform stats
        await fetchPlatformStats();
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (error) {
      console.error('❌ Sync failed:', error);
      setSyncResult({
        success: false,
        farmers: 0,
        serviceRequests: 0,
        message: error instanceof Error ? error.message : 'Sync failed'
      });
    } finally {
      setSyncLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
          <div className="text-lg text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-6 py-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="mt-1 text-gray-600">
                Platform overview and management
              </p>
            </div>
            <div className="bg-gray-50 px-4 py-3 rounded-lg">
              <p className="text-sm text-gray-600">Welcome back</p>
              <p className="font-semibold text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Status */}
      {syncResult && (
        <div className={`p-4 rounded-lg border ${
          syncResult.success 
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center">
            <div className={`flex-shrink-0 w-4 h-4 rounded-full ${
              syncResult.success ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <div className="ml-3">
              <p className="font-medium">
                {syncResult.success ? 'Sync Completed' : 'Sync Failed'}
              </p>
              <p className="text-sm mt-1">
                {syncResult.message || `Farmers: ${syncResult.farmers}, Requests: ${syncResult.serviceRequests}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Farmers */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 p-3 rounded-lg">
              <span className="text-green-600 text-xl">👨‍🌾</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Farmers</p>
              <p className="text-2xl font-bold text-gray-900">
                {platformStats.totalFarmers}
              </p>
            </div>
          </div>
        </div>

        {/* Total Graduates */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 p-3 rounded-lg">
              <span className="text-blue-600 text-xl">🎓</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Graduates</p>
              <p className="text-2xl font-bold text-gray-900">
                {platformStats.totalGraduates}
              </p>
            </div>
          </div>
        </div>

        {/* Active Requests */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-orange-100 p-3 rounded-lg">
              <span className="text-orange-600 text-xl">📋</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Requests</p>
              <p className="text-2xl font-bold text-gray-900">
                {platformStats.activeRequests}
              </p>
            </div>
          </div>
        </div>

        {/* Completed Services */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 p-3 rounded-lg">
              <span className="text-purple-600 text-xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Services</p>
              <p className="text-2xl font-bold text-gray-900">
                {platformStats.completedServices}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin/users')}
              className="w-full flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <span className="text-blue-600">👥</span>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">User Management</p>
                  <p className="text-sm text-gray-600">Manage all users</p>
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </button>

            <button
              onClick={() => navigate('/admin/requests')}
              className="w-full flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-lg">
                  <span className="text-green-600">📋</span>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Service Requests</p>
                  <p className="text-sm text-gray-600">Monitor requests</p>
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </button>

            <button
              onClick={() => navigate('/admin/analytics')}
              className="w-full flex items-center justify-between p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <span className="text-purple-600">📊</span>
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">Platform Analytics</p>
                  <p className="text-sm text-gray-600">View insights</p>
                </div>
              </div>
              <span className="text-gray-400">→</span>
            </button>
          </div>
        </div>

        {/* Sync Status */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Data Sync
          </h3>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600">USSD Data</span>
                {lastSyncTime && (
                  <span className="text-xs text-gray-500">Last: {lastSyncTime}</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{platformStats.totalFarmers}</p>
                  <p className="text-sm text-gray-600">Farmers</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{platformStats.activeRequests}</p>
                  <p className="text-sm text-gray-600">Active Requests</p>
                </div>
              </div>
            </div>

            <button
              onClick={syncUSSDData}
              disabled={syncLoading}
              className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {syncLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Syncing...
                </>
              ) : (
                <>
                  <span className="mr-2">🔄</span>
                  Sync USSD Data
                </>
              )}
            </button>

            <button
              onClick={fetchPlatformStats}
              className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Platform Summary */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Platform Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {platformStats.totalFarmers + platformStats.totalGraduates}
            </p>
            <p className="text-sm text-gray-600">Total Users</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {platformStats.completedServices}
            </p>
            <p className="text-sm text-gray-600">Services Completed</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {platformStats.pendingRegistrations}
            </p>
            <p className="text-sm text-gray-600">Pending Approvals</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
 
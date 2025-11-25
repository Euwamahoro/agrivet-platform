import React, { useEffect, useState } from 'react';
import { getAnalytics, AnalyticsData } from '../../services/adminServices';

interface EnhancedAnalyticsData extends AnalyticsData {
  platformKPIs?: {
    totalRequests: number;
    completedRequests: number;
    activeRequests: number;
    completionRate: number;
    avgResolutionTime: number;
    weeklyGrowth: number;
  };
  requestsByDistrict?: Array<{ _id: string; count: number }>;
  requestsByTime?: {
    daily: Array<{ date: string; count: number }>;
    weekly: Array<{ week: string; count: number }>;
    monthly: Array<{ month: string; count: number }>;
  };
  topPerforming?: {
    bestDistrict: { name: string; count: number };
    bestProvince: { name: string; count: number };
    highestServiceType: { name: string; count: number };
  };
  userStatistics?: {
    totalFarmers: number;
    totalGraduates: number;
    newRegistrationsThisMonth: number;
    activeUsersThisMonth: number;
  };
}

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<EnhancedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to determine if regional data shows provinces or districts
  const getRegionalLabel = () => {
    if (!analytics?.requestsByProvince) return 'Region';
    
    // If we have more than 5 entries, it's likely districts not provinces
    const isLikelyDistricts = analytics.requestsByProvince.length > 5;
    return isLikelyDistricts ? 'District' : 'Province';
  };

  // Format growth indicator
  const renderGrowthIndicator = (growth: number) => {
    if (growth > 0) {
      return <span className="text-green-600 text-sm">↑ {growth}%</span>;
    } else if (growth < 0) {
      return <span className="text-red-600 text-sm">↓ {Math.abs(growth)}%</span>;
    }
    return <span className="text-gray-600 text-sm">→ 0%</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-red-600">Failed to load analytics</div>
      </div>
    );
  }

  const regionalLabel = getRegionalLabel();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          Refresh Data
        </button>
      </div>

      {/* Platform KPIs */}
      {analytics.platformKPIs && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.platformKPIs.totalRequests}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            {renderGrowthIndicator(analytics.platformKPIs.weeklyGrowth)}
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.platformKPIs.completionRate}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {analytics.platformKPIs.completedRequests} of {analytics.platformKPIs.totalRequests} completed
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Requests</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.platformKPIs.activeRequests}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">Need attention</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Resolution</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.platformKPIs.avgResolutionTime}d</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">Average time to complete</p>
          </div>
        </div>
      )}

      {/* User Statistics */}
      {analytics.userStatistics && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              User Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.userStatistics.totalFarmers}
                </div>
                <div className="text-sm text-gray-600">Total Farmers</div>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {analytics.userStatistics.totalGraduates}
                </div>
                <div className="text-sm text-gray-600">Total Graduates</div>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {analytics.userStatistics.newRegistrationsThisMonth}
                </div>
                <div className="text-sm text-gray-600">New Registrations</div>
                <div className="text-xs text-gray-500">This Month</div>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {analytics.userStatistics.activeUsersThisMonth}
                </div>
                <div className="text-sm text-gray-600">Active Users</div>
                <div className="text-xs text-gray-500">This Month</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Overview */}
      {analytics.topPerforming && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Performance Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border border-gray-200 rounded-lg bg-blue-50">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.topPerforming.bestProvince.count}
                </div>
                <div className="text-sm text-gray-600">Top Province</div>
                <div className="text-lg font-semibold text-gray-900 capitalize">
                  {analytics.topPerforming.bestProvince.name}
                </div>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg bg-green-50">
                <div className="text-2xl font-bold text-green-600">
                  {analytics.topPerforming.bestDistrict.count}
                </div>
                <div className="text-sm text-gray-600">Top District</div>
                <div className="text-lg font-semibold text-gray-900 capitalize">
                  {analytics.topPerforming.bestDistrict.name}
                </div>
              </div>
              
              <div className="text-center p-4 border border-gray-200 rounded-lg bg-purple-50">
                <div className="text-2xl font-bold text-purple-600">
                  {analytics.topPerforming.highestServiceType.count}
                </div>
                <div className="text-sm text-gray-600">Most Requested Service</div>
                <div className="text-lg font-semibold text-gray-900 capitalize">
                  {analytics.topPerforming.highestServiceType.name}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Requests by Type */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Service Requests by Type
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.serviceRequestsByType.map((item) => (
              <div key={item._id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {item._id} Services
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Requests by Status */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Requests by Status
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {analytics.requestsByStatus.map((item) => (
              <div key={item._id} className="text-center p-4 border border-gray-200 rounded-lg">
                <div className={`text-2xl font-bold ${
                  item._id === 'completed' ? 'text-green-600' :
                  item._id === 'pending' ? 'text-yellow-600' :
                  item._id === 'in_progress' ? 'text-orange-600' :
                  'text-gray-600'
                }`}>
                  {item.count}
                </div>
                <div className="text-sm text-gray-600 capitalize">
                  {item._id.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Requests Over Time */}
      {analytics.requestsByTime && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Requests Over Time
              </h3>
              <div className="flex space-x-2">
                {(['daily', 'weekly', 'monthly'] as const).map((frame) => (
                  <button
                    key={frame}
                    onClick={() => setTimeFrame(frame)}
                    className={`px-3 py-1 text-sm rounded-md ${
                      timeFrame === frame
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {frame.charAt(0).toUpperCase() + frame.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics.requestsByTime[timeFrame]?.map((item, index) => (
                <div key={index} className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {item.count}
                  </div>
                  <div className="text-sm text-gray-600">
                    {'date' in item ? item.date : 'week' in item ? item.week : item.month}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Regional Distribution */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Regional Distribution
            </h3>
            <div className="text-sm text-gray-500">
              Showing: {regionalLabel}s
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.requestsByProvince.map((item) => (
              <div key={item._id} className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {item.count}
                </div>
                <div className="text-sm text-gray-600 capitalize">
                  {item._id} {regionalLabel}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* District Distribution */}
      {analytics.requestsByDistrict && analytics.requestsByDistrict.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Top Districts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analytics.requestsByDistrict.map((item) => (
                <div key={item._id} className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {item.count}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    {item._id} District
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
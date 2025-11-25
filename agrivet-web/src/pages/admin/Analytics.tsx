import React, { useEffect, useState } from 'react';
import { getAnalytics } from '../../services/adminServices';

interface DailyData {
  date: string;
  count: number;
}

interface WeeklyData {
  week: string;
  count: number;
}

interface MonthlyData {
  month: string;
  count: number;
}

interface AnalyticsData {
  overview: {
    totalRequests: number;
    completionRate: number;
    activeRequests: number;
    avgResponseTime: number;
    requestTrend: number;
  };
  serviceDistribution: {
    byType: Array<{ _id: string; count: number }>;
    byStatus: Array<{ _id: string; count: number }>;
    completionByType: Array<{ _id: string; total: number; completed: number; completionRate: number }>;
  };
  regionalPerformance: {
    byProvince: Array<{ _id: string; count: number }>;
    byDistrict: Array<{ _id: string; province: string; count: number }>;
    topPerforming: {
      bestProvince: { name: string; count: number };
      bestDistrict: { name: string; count: number };
      highestServiceType: { name: string; count: number };
    };
  };
  timeTrends: {
    daily: DailyData[];
    weekly: WeeklyData[];
    monthly: MonthlyData[];
  };
  userInsights: {
    farmers: {
      total: number;
      active: number;
      new: number;
      activityRate: string;
    };
    graduates: {
      total: number;
      active: number;
      new: number;
      utilizationRate: string;
    };
    serviceUsagePatterns: Array<{ _id: number; farmerCount: number }>;
  };
}

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeFrame, setTimeFrame] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getAnalytics();
      setAnalytics(data as unknown as AnalyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* ===== OVERVIEW KPIs ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics.overview.totalRequests}
              </p>
              {analytics.overview.requestTrend !== 0 && (
                <p className={`text-sm mt-2 ${analytics.overview.requestTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analytics.overview.requestTrend > 0 ? '↑' : '↓'} {Math.abs(analytics.overview.requestTrend)}% from last month
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics.overview.completionRate}%
              </p>
              <p className="text-sm text-gray-500 mt-2">of all requests</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-orange-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Requests</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics.overview.activeRequests}
              </p>
              <p className="text-sm text-gray-500 mt-2">in progress</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 border-l-4 border-purple-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Response Time</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics.overview.avgResponseTime}h
              </p>
              <p className="text-sm text-gray-500 mt-2">to assignment</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== TOP PERFORMING OVERVIEW ===== */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-semibold text-gray-900">
            Top Performers
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 border-2 border-blue-200 rounded-lg bg-blue-50">
              <div className="text-4xl font-bold text-blue-600">
                {analytics.regionalPerformance.topPerforming.bestProvince.count}
              </div>
              <div className="text-sm text-gray-600 mt-1">requests</div>
              <div className="text-lg font-semibold text-gray-900 mt-2 capitalize">
                {analytics.regionalPerformance.topPerforming.bestProvince.name}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Top Province</div>
            </div>
            
            <div className="text-center p-6 border-2 border-green-200 rounded-lg bg-green-50">
              <div className="text-4xl font-bold text-green-600">
                {analytics.regionalPerformance.topPerforming.bestDistrict.count}
              </div>
              <div className="text-sm text-gray-600 mt-1">requests</div>
              <div className="text-lg font-semibold text-gray-900 mt-2 capitalize">
                {analytics.regionalPerformance.topPerforming.bestDistrict.name}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Top District</div>
            </div>
            
            <div className="text-center p-6 border-2 border-purple-200 rounded-lg bg-purple-50">
              <div className="text-4xl font-bold text-purple-600">
                {analytics.regionalPerformance.topPerforming.highestServiceType.count}
              </div>
              <div className="text-sm text-gray-600 mt-1">requests</div>
              <div className="text-lg font-semibold text-gray-900 mt-2 capitalize">
                {analytics.regionalPerformance.topPerforming.highestServiceType.name}
              </div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mt-1">Most Requested</div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SERVICE DISTRIBUTION ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Requests by Type */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-semibold text-gray-900">
              Service Requests by Type
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.serviceDistribution.byType.map((item) => (
                <div key={item._id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {item._id}
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
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-semibold text-gray-900">
              Requests by Status
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {analytics.serviceDistribution.byStatus.map((item) => (
                <div key={item._id} className="text-center p-4 border-2 border-gray-200 rounded-lg">
                  <div className={`text-3xl font-bold ${
                    item._id === 'completed' ? 'text-green-600' :
                    item._id === 'pending' ? 'text-yellow-600' :
                    item._id === 'in_progress' ? 'text-orange-600' :
                    item._id === 'assigned' ? 'text-blue-600' :
                    'text-gray-600'
                  }`}>
                    {item.count}
                  </div>
                  <div className="text-sm text-gray-600 capitalize mt-2">
                    {item._id.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Completion Rate by Type */}
      {analytics.serviceDistribution.completionByType.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-semibold text-gray-900">
              Completion Rate by Service Type
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analytics.serviceDistribution.completionByType.map((item) => (
                <div key={item._id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {item._id}
                    </span>
                    <span className="text-sm text-gray-600">
                      {item.completed}/{item.total} ({item.completionRate.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${item.completionRate}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== REGIONAL PERFORMANCE ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Province */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-semibold text-gray-900">
              Requests by Province
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {analytics.regionalPerformance.byProvince.map((item) => (
                <div key={item._id} className="text-center p-4 border border-gray-200 rounded-lg hover:border-blue-400 transition-colors">
                  <div className="text-2xl font-bold text-blue-600">
                    {item.count}
                  </div>
                  <div className="text-sm text-gray-600 capitalize mt-1">
                    {item._id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* By District */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-semibold text-gray-900">
              Top Districts
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {analytics.regionalPerformance.byDistrict.slice(0, 6).map((item, index) => (
                <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {item._id}
                    </span>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== TIME TRENDS ===== */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg leading-6 font-semibold text-gray-900">
              Requests Over Time
            </h3>
            <div className="flex space-x-2">
              {(['daily', 'weekly', 'monthly'] as const).map((frame) => (
                <button
                  key={frame}
                  onClick={() => setTimeFrame(frame)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
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
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {analytics.timeTrends[timeFrame]?.map((item, index) => {
              let displayText = '';
              if (timeFrame === 'daily' && 'date' in item) {
                displayText = item.date;
              } else if (timeFrame === 'weekly' && 'week' in item) {
                displayText = item.week;
              } else if (timeFrame === 'monthly' && 'month' in item) {
                displayText = item.month;
              }
              
              return (
                <div key={index} className="text-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors">
                  <div className="text-2xl font-bold text-blue-600">
                    {item.count}
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    {displayText}
                  </div>
                </div>
              );
            })}
          </div>
          {analytics.timeTrends[timeFrame]?.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No data available for this time period
            </div>
          )}
        </div>
      </div>

      {/* ===== USER INSIGHTS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Farmers Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-semibold text-gray-900">
              Farmer Activity
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {analytics.userInsights.farmers.total}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Farmers</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {analytics.userInsights.farmers.active}
                </div>
                <div className="text-sm text-gray-600 mt-1">Active</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {analytics.userInsights.farmers.new}
                </div>
                <div className="text-sm text-gray-600 mt-1">New (30 days)</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">
                  {analytics.userInsights.farmers.activityRate}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Activity Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Graduates Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-semibold text-gray-900">
              Graduate Activity
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {analytics.userInsights.graduates.total}
                </div>
                <div className="text-sm text-gray-600 mt-1">Total Graduates</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {analytics.userInsights.graduates.active}
                </div>
                <div className="text-sm text-gray-600 mt-1">Active</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl font-bold text-purple-600">
                  {analytics.userInsights.graduates.new}
                </div>
                <div className="text-sm text-gray-600 mt-1">New (30 days)</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-3xl font-bold text-orange-600">
                  {analytics.userInsights.graduates.utilizationRate}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Utilization</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Usage Patterns */}
      {analytics.userInsights.serviceUsagePatterns.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-semibold text-gray-900">
              Service Usage Patterns
            </h3>
            <p className="text-sm text-gray-500 mt-1">Distribution of farmers by number of requests made</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {analytics.userInsights.serviceUsagePatterns.map((item) => (
                <div key={item._id} className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-600">
                    {item.farmerCount}
                  </div>
                  <div className="text-xs text-gray-600 mt-2">
                    {item._id} request{item._id !== 1 ? 's' : ''}
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
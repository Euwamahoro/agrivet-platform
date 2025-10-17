import React, { useEffect, useState } from 'react';
import { getAnalytics, AnalyticsData } from '../../services/adminServices';

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

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

      {/* Service Requests by Type */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Service Requests by Type
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Regional Distribution */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Regional Distribution
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {analytics.requestsByProvince.map((item) => (
              <div key={item._id} className="text-center p-4 border border-gray-200 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {item.count}
                </div>
                <div className="text-sm text-gray-600">
                  {item._id} Province
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
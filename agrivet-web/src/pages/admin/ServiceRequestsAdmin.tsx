import React, { useEffect, useState } from 'react';
import { getServiceRequests, ServiceRequest } from '../../services/adminServices';

const ServiceRequestsAdmin: React.FC = () => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    fetchRequests();
  }, [currentPage, filterStatus]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getServiceRequests(filterStatus, currentPage);
      console.log('Fetched requests:', data.requests); // Debug log
      
      // Log the structure of the first request to understand the data
      if (data.requests.length > 0) {
        console.log('First request structure:', data.requests[0]);
        console.log('Farmer data:', data.requests[0].farmer);
        console.log('Location data:', data.requests[0].location);
      }
      
      setRequests(data.requests);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Error fetching service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to safely get farmer name
  const getFarmerName = (request: ServiceRequest) => {
    // Try multiple possible locations for farmer name
    return (
      request.farmer?.user?.name ||
      request.farmerName || // From sync service
      'Unknown Farmer'
    );
  };

  // Helper function to safely get farmer phone
  const getFarmerPhone = (request: ServiceRequest) => {
    return (
      request.farmer?.user?.phoneNumber ||
      request.farmerPhone || // From sync service
      'No Phone'
    );
  };

  // Helper function to safely get location
  const getLocationDistrict = (request: ServiceRequest) => {
    return (
      request.location?.district ||
      request.farmer?.district || // From farmer object
      'Unknown District'
    );
  };

  const getLocationSector = (request: ServiceRequest) => {
    return (
      request.location?.sector ||
      request.farmer?.sector || // From farmer object
      'Unknown Sector'
    );
  };

  // Helper function to safely get graduate info
  const getGraduateName = (request: ServiceRequest) => {
    return (
      request.graduate?.user?.name ||
      'Not assigned'
    );
  };

  const getGraduateExpertise = (request: ServiceRequest) => {
    return (
      request.graduate?.expertise ||
      ''
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading service requests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Service Requests</h1>
        
        <div className="flex space-x-4">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Request Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Farmer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Graduate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => (
              <tr key={request._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 capitalize">
                    {request.serviceType || 'General'} Service
                  </div>
                  <div className="text-sm text-gray-500 mt-1 max-w-md">
                    {request.description || 'No description provided'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {getFarmerName(request)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getFarmerPhone(request)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {getLocationDistrict(request)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getLocationSector(request)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {request.graduate ? (
                    <>
                      <div className="text-sm font-medium text-gray-900">
                        {getGraduateName(request)}
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {getGraduateExpertise(request)}
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Not assigned</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                    {request.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Unknown'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {requests.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg">No service requests found</div>
          <div className="text-gray-500 text-sm mt-2">
            {filterStatus ? `No requests with status "${filterStatus}"` : 'No requests in the system'}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ServiceRequestsAdmin;
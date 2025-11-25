// src/pages/AvailableRequests.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { fetchAvailableRequests, acceptRequest } from '../store/slices/serviceRequestSlice';
import { fetchCurrentGraduate } from '../store/slices/graduateSlice'; // Add this import

const AvailableRequests: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { availableRequests, isLoading } = useSelector(
    (state: RootState) => state.serviceRequests
  );
  const { currentGraduate } = useSelector((state: RootState) => state.graduates);

  const [filters, setFilters] = useState({
    serviceType: '',
    location: '',
  });

  useEffect(() => {
    // Fetch current graduate to check availability status
    console.log('🔄 Fetching current graduate profile...');
    dispatch(fetchCurrentGraduate());
    
    // Fetch available requests
    console.log('🔄 Fetching available requests...');
    dispatch(fetchAvailableRequests(filters));
  }, [dispatch, filters]);

  const handleAcceptRequest = async (requestId: string) => {
    if (!currentGraduate?.isAvailable) {
      alert('Please update your availability in your profile to accept requests.');
      return;
    }

    if (window.confirm('Are you sure you want to accept this service request?')) {
      try {
        await dispatch(acceptRequest(requestId)).unwrap();
        alert('Request accepted successfully!');
        // Refresh the available requests list
        dispatch(fetchAvailableRequests(filters));
      } catch (error) {
        console.error('Error accepting request:', error);
        alert('Failed to accept request. Please try again.');
      }
    }
  };

  const filteredRequests = availableRequests.filter(request => {
    if (filters.serviceType && request.serviceType !== filters.serviceType) {
      return false;
    }
    if (filters.location && !request.location.district.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Debug log to check current graduate data
  useEffect(() => {
    console.log('📊 Current Graduate Data:', currentGraduate);
    console.log('📊 Is Available:', currentGraduate?.isAvailable);
  }, [currentGraduate]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">Available Service Requests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse and accept service requests from farmers in your area
          </p>
          
          {/* Availability Status Banner */}
          {currentGraduate && (
            <div className={`mt-4 p-3 rounded-md ${
              currentGraduate.isAvailable 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {currentGraduate.isAvailable ? (
                    <span className="text-green-400">✅</span>
                  ) : (
                    <span className="text-yellow-400">⚠️</span>
                  )}
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentGraduate.isAvailable ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {currentGraduate.isAvailable 
                      ? 'You are available to accept new requests' 
                      : 'You are not available for new requests'
                    }
                  </p>
                  <p className={`text-sm ${
                    currentGraduate.isAvailable ? 'text-green-700' : 'text-yellow-700'
                  }`}>
                    {currentGraduate.isAvailable 
                      ? 'You can accept service requests from farmers.'
                      : 'Update your availability in your profile to accept requests.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700">
                Service Type
              </label>
              <select
                id="serviceType"
                name="serviceType"
                value={filters.serviceType}
                onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="">All Services</option>
                <option value="agronomy">Agronomy</option>
                <option value="veterinary">Veterinary</option>
              </select>
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <input
                type="text"
                id="location"
                name="location"
                placeholder="Search by district..."
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ serviceType: '', location: '' })}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {filteredRequests.length} Request{filteredRequests.length !== 1 ? 's' : ''} Available
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => dispatch(fetchCurrentGraduate())}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Refresh Availability
              </button>
              <button
                onClick={() => dispatch(fetchAvailableRequests(filters))}
                className="text-sm text-green-600 hover:text-green-500"
              >
                Refresh Requests
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No available requests match your filters.</p>
              <button
                onClick={() => setFilters({ serviceType: '', location: '' })}
                className="mt-2 text-green-600 hover:text-green-500"
              >
                Clear filters to see all requests
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          request.serviceType === 'agronomy' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {request.serviceType === 'agronomy' ? '🌱 Agronomy' : '🐄 Veterinary'}
                        </span>
                        <span className="text-sm text-gray-500">
                          #{request.id.substring(0, 8)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h4 className="mt-2 text-lg font-medium text-gray-900">
                        Service Request from {request.farmer?.name || 'Farmer'}
                      </h4>
                      
                      <p className="mt-2 text-gray-600">
                        {request.description}
                      </p>
                      
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500">
                        <div>
                          <strong>Location:</strong> {request.location.district}, {request.location.sector}
                        </div>
                        <div>
                          <strong>Contact:</strong> {request.farmer?.phoneNumber || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex flex-col space-y-2">
                      <button
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={!currentGraduate?.isAvailable}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {currentGraduate?.isAvailable ? 'Accept Request' : 'Unavailable'}
                      </button>
                      <button
                        onClick={() => navigate(`/graduate/requests/${request.id}`)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                  
                  {/* Show availability warning for this specific request */}
                  {!currentGraduate?.isAvailable && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <p className="text-sm text-yellow-800">
                        ⚠️ You are currently marked as unavailable. Update your availability in your profile to accept requests.
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AvailableRequests;
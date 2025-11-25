// src/pages/GraduateDashboard.tsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { fetchAvailableRequests } from '../store/slices/serviceRequestSlice';
import { fetchCurrentGraduate } from '../store/slices/graduateSlice'; // CHANGED: Use fetchCurrentGraduate

const GraduateDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const { user } = useSelector((state: RootState) => state.auth);
  const { currentGraduate } = useSelector((state: RootState) => state.graduates);
  const { availableRequests, assignedRequests, isLoading } = useSelector(
    (state: RootState) => state.serviceRequests
  );

  useEffect(() => {
    // CHANGED: Use fetchCurrentGraduate instead of fetchGraduateProfile
    dispatch(fetchAvailableRequests());
    dispatch(fetchCurrentGraduate());
  }, [dispatch]); // REMOVED: user?.id dependency

  const pendingRequests = assignedRequests.filter(req => 
    req.status === 'assigned' || req.status === 'in_progress'
  );

  const completedRequests = assignedRequests.filter(req => 
    req.status === 'completed'
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Here's your overview of service requests and assignments.
            {currentGraduate && (
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                currentGraduate.isAvailable 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {currentGraduate.isAvailable ? 'Available' : 'Not Available'}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Available Requests
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {availableRequests.length}
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <button
              onClick={() => navigate('/graduate/requests')}
              className="text-sm font-medium text-green-600 hover:text-green-500"
            >
              View all requests
            </button>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Active Assignments
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {pendingRequests.length}
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <button
              onClick={() => navigate('/graduate/assignments')}
              className="text-sm font-medium text-green-600 hover:text-green-500"
            >
              Manage assignments
            </button>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Completed Services
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {completedRequests.length}
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <span className="text-sm font-medium text-gray-500">
              This month
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Quick Actions
          </h3>
          <div className="mt-5 flex flex-wrap gap-4">
            <button
              onClick={() => navigate('/graduate/requests')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Browse Available Requests
            </button>
            <button
              onClick={() => navigate('/graduate/assignments')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              View My Assignments
            </button>
            <button
              onClick={() => navigate('/graduate/profile')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Update Profile
            </button>
          </div>
        </div>
      </div>

      {/* Recent Available Requests */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Available Requests
          </h3>
          {isLoading ? (
            <div className="text-center py-4">Loading requests...</div>
          ) : availableRequests.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No available requests at the moment.
            </div>
          ) : (
            <div className="space-y-4">
              {availableRequests.slice(0, 3).map((request) => (
                <div key={request.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {request.serviceType === 'agronomy' ? '🌱 Agronomy' : '🐄 Veterinary'} Service
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {request.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Location: {request.location.district}, {request.location.sector}
                      </p>
                      <p className="text-xs text-gray-500">
                        Farmer: {request.farmer?.name || 'Unknown'}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/graduate/requests/${request.id}`)}
                    className="mt-3 text-sm text-green-600 hover:text-green-500"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Current Graduate Status */}
      {currentGraduate && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Your Profile Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  <strong>Specialization:</strong> {currentGraduate.specialization} {/* CHANGED: specialization to expertise */}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Location:</strong> {currentGraduate.district}, {currentGraduate.province}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Experience:</strong> {currentGraduate.experience} years
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  <strong>Availability:</strong> 
                  <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                    currentGraduate.isAvailable 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {currentGraduate.isAvailable ? 'Available for new requests' : 'Not available'}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Rating:</strong> {currentGraduate.rating ? `⭐ ${currentGraduate.rating}/5` : 'No ratings yet'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraduateDashboard;
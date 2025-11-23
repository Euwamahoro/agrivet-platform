// src/pages/RequestDetails.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { acceptRequest, updateRequestStatus } from '../store/slices/serviceRequestSlice';

const RequestDetails: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { availableRequests, assignedRequests } = useSelector(
    (state: RootState) => state.serviceRequests
  );
  const { currentGraduate } = useSelector((state: RootState) => state.graduates);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serviceNotes, setServiceNotes] = useState('');

  // Find the request in either available or assigned requests
  const request = [...availableRequests, ...assignedRequests].find(
    req => req.id === requestId
  );

  useEffect(() => {
    if (!request) {
      // If request not found, redirect to appropriate page
      navigate('/graduate/requests');
    }
  }, [request, navigate]);

  // Add a loading state
  if (!request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Loading request details...</p>
        </div>
      </div>
    );
  }

  // Safe function to get short ID
  const getShortId = (id: string | undefined) => {
    return id ? `#${id.substring(0, 8)}` : '#Unknown';
  };

  // Safe function to get farmer name
  const getFarmerName = () => {
    return request?.farmer?.name || 'Not specified';
  };

  // Safe function to get farmer phone
  const getFarmerPhone = () => {
    return request?.farmer?.phoneNumber || 'Not specified';
  };

  // Safe function to get location
  const getLocation = () => {
    if (!request?.location) return 'Location not specified';
    const { cell, sector, district, province } = request.location;
    return `${cell || ''}, ${sector || ''}, ${district || ''}, ${province || ''}`.replace(/,\s*,/g, ',').replace(/^,\s*/, '');
  };

  const handleAcceptRequest = async () => {
    if (!currentGraduate?.isAvailable) {
      alert('Please mark yourself as available in your profile before accepting requests.');
      return;
    }

    if (window.confirm('Are you sure you want to accept this service request?')) {
      setIsSubmitting(true);
      try {
        await dispatch(acceptRequest(request.id)).unwrap();
        alert('Request accepted successfully!');
        navigate('/graduate/assignments');
      } catch (error) {
        alert('Failed to accept request. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    setIsSubmitting(true);
    try {
      await dispatch(updateRequestStatus({ 
        requestId: request.id, 
        status: newStatus, 
        notes: serviceNotes 
      })).unwrap();
      alert('Status updated successfully!');
      setServiceNotes('');
    } catch (error) {
      alert('Failed to update status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-gray-100 text-gray-800', label: 'Pending' },
      assigned: { color: 'bg-blue-100 text-blue-800', label: 'Assigned' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      no_match: { color: 'bg-orange-100 text-orange-800', label: 'No Match' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const isAvailableRequest = availableRequests.some(req => req.id === requestId);
  const isMyAssignment = assignedRequests.some(req => req.id === requestId);

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-sm text-green-600 hover:text-green-500"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Service Request Details</h1>
        <div>{getStatusBadge(request.status)}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Request Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Request Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Service Type</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {request.serviceType === 'agronomy' ? '🌱 Agronomy' : '🐄 Veterinary'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Request ID</label>
                  <p className="mt-1 text-sm text-gray-900">{getShortId(request.id)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created Date</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {request.updatedAt ? new Date(request.updatedAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="mt-2 p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                  {request.description || 'No description provided'}
                </p>
              </div>
            </div>
          </div>

          {/* Farmer Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Farmer Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {getFarmerName()}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {getFarmerPhone()}
                  </p>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {getLocation()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Service Notes */}
          {(isMyAssignment && request.status !== 'completed') && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Service Notes</h2>
                <textarea
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  placeholder="Add notes about the service provided, recommendations, or follow-up actions..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
                <p className="mt-2 text-sm text-gray-500">
                  These notes will be saved when you update the request status.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Actions */}
        <div className="space-y-6">
          {/* Action Buttons */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
              
              <div className="space-y-3">
                {isAvailableRequest && (
                  <button
                    onClick={handleAcceptRequest}
                    disabled={isSubmitting || !currentGraduate?.isAvailable}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Accepting...' : 'Accept Request'}
                  </button>
                )}

                {isMyAssignment && request.status === 'assigned' && (
                  <button
                    onClick={() => handleStatusUpdate('in_progress')}
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Updating...' : 'Start Service'}
                  </button>
                )}

                {isMyAssignment && request.status === 'in_progress' && (
                  <button
                    onClick={() => handleStatusUpdate('completed')}
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Updating...' : 'Mark as Completed'}
                  </button>
                )}

                {isMyAssignment && (request.status === 'assigned' || request.status === 'in_progress') && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel this assignment?')) {
                        handleStatusUpdate('cancelled');
                      }
                    }}
                    disabled={isSubmitting}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Cancelling...' : 'Cancel Assignment'}
                  </button>
                )}

                {request.status === 'completed' && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800 text-center">
                      ✅ Service Completed
                    </p>
                  </div>
                )}
              </div>

              {isAvailableRequest && !currentGraduate?.isAvailable && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    ⚠️ You need to mark yourself as available in your profile to accept requests.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Status Timeline */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Status Timeline</h3>
              <div className="space-y-2">
                <div className={`flex items-center ${request.status !== 'pending' ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="w-6">✅</span>
                  <span className="text-sm">Request Submitted</span>
                </div>
                <div className={`flex items-center ${request.status === 'assigned' || request.status === 'in_progress' || request.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="w-6">
                    {request.status === 'assigned' || request.status === 'in_progress' || request.status === 'completed' ? '✅' : '◯'}
                  </span>
                  <span className="text-sm">Graduate Assigned</span>
                </div>
                <div className={`flex items-center ${request.status === 'in_progress' || request.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="w-6">
                    {request.status === 'completed' ? '✅' : request.status === 'in_progress' ? '⏳' : '◯'}
                  </span>
                  <span className="text-sm">Service In Progress</span>
                </div>
                <div className={`flex items-center ${request.status === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
                  <span className="w-6">{request.status === 'completed' ? '✅' : '◯'}</span>
                  <span className="text-sm">Service Completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;
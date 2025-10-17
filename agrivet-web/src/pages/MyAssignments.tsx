// src/pages/MyAssignments.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { updateRequestStatus } from '../store/slices/serviceRequestSlice';

const MyAssignments: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { assignedRequests, isLoading } = useSelector(
    (state: RootState) => state.serviceRequests
  );

  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // In a real app, we would fetch assigned requests here
    // dispatch(fetchMyAssignments());
  }, [dispatch]);

  const handleStatusUpdate = async (requestId: string, newStatus: string, notes?: string) => {
    try {
      await dispatch(updateRequestStatus({ requestId, status: newStatus, notes })).unwrap();
      alert('Status updated successfully!');
    } catch (error) {
      alert('Failed to update status. Please try again.');
    }
  };

  const filteredAssignments = assignedRequests.filter(assignment => {
    if (statusFilter === 'all') return true;
    return assignment.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      assigned: { color: 'bg-blue-100 text-blue-800', label: 'Assigned' },
      in_progress: { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'bg-gray-100 text-gray-800', label: status };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getNextStatusAction = (currentStatus: string) => {
    const actions = {
      assigned: { nextStatus: 'in_progress', label: 'Start Service', color: 'bg-yellow-600 hover:bg-yellow-700' },
      in_progress: { nextStatus: 'completed', label: 'Mark Complete', color: 'bg-green-600 hover:bg-green-700' },
    };
    return actions[currentStatus as keyof typeof actions];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your current service assignments and track progress
          </p>
        </div>
      </div>

      {/* Stats and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <dt className="text-sm font-medium text-gray-500 truncate">Total Assignments</dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">{assignedRequests.length}</dd>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
          <dd className="mt-1 text-3xl font-semibold text-yellow-600">
            {assignedRequests.filter(a => a.status === 'in_progress').length}
          </dd>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
          <dd className="mt-1 text-3xl font-semibold text-green-600">
            {assignedRequests.filter(a => a.status === 'completed').length}
          </dd>
        </div>
        <div className="bg-white shadow rounded-lg p-4">
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700">
            Filter by Status
          </label>
          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">All Statuses</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Assignments List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading assignments...</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {statusFilter === 'all' 
                  ? "You don't have any assignments yet." 
                  : `No assignments with status "${statusFilter}".`}
              </p>
              {statusFilter !== 'all' && (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="mt-2 text-green-600 hover:text-green-500"
                >
                  View all assignments
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredAssignments.map((assignment) => {
                const nextAction = getNextStatusAction(assignment.status);
                
                return (
                  <div key={assignment.id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          {getStatusBadge(assignment.status)}
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            assignment.serviceType === 'agronomy' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {assignment.serviceType === 'agronomy' ? '🌱 Agronomy' : '🐄 Veterinary'}
                          </span>
                          <span className="text-sm text-gray-500">
                            #{assignment.id.substring(0, 8)}
                          </span>
                        </div>
                        
                        <h4 className="text-lg font-medium text-gray-900">
                          Service for {assignment.farmer?.name || 'Farmer'}
                        </h4>
                        
                        <p className="mt-2 text-gray-600">
                          {assignment.description}
                        </p>
                        
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500">
                          <div>
                            <strong>Location:</strong> {assignment.location.district}, {assignment.location.sector}
                          </div>
                          <div>
                            <strong>Farmer Contact:</strong> {assignment.farmer?.phoneNumber || 'N/A'}
                          </div>
                          <div>
                            <strong>Assigned:</strong> {new Date(assignment.createdAt).toLocaleDateString()}
                          </div>
                          <div>
                            <strong>Last Updated:</strong> {new Date(assignment.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex flex-col space-y-2">
                        {nextAction && (
                          <button
                            onClick={() => handleStatusUpdate(assignment.id, nextAction.nextStatus)}
                            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${nextAction.color} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                          >
                            {nextAction.label}
                          </button>
                        )}
                        
                        {assignment.status === 'in_progress' && (
                          <button
                            onClick={() => {
                              const notes = prompt('Please provide service notes:');
                              if (notes !== null) {
                                handleStatusUpdate(assignment.id, 'completed', notes);
                              }
                            }}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            Complete with Notes
                          </button>
                        )}
                        
                        <button
                          onClick={() => navigate(`/graduate/requests/${assignment.id}`)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                    
                    {/* Progress Timeline */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Progress Timeline</h5>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className={`${assignment.status !== 'assigned' ? 'text-green-600' : ''}`}>
                          ✅ Assigned
                        </span>
                        <span className={`${assignment.status === 'in_progress' ? 'text-yellow-600' : assignment.status === 'completed' ? 'text-green-600' : ''}`}>
                          {assignment.status === 'completed' ? '✅' : '⏳'} In Progress
                        </span>
                        <span className={`${assignment.status === 'completed' ? 'text-green-600' : ''}`}>
                          {assignment.status === 'completed' ? '✅' : '◯'} Completed
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAssignments;
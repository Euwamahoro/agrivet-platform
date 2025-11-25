// src/pages/GraduateProfile.tsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchCurrentGraduate, updateGraduateAvailability } from '../store/slices/graduateSlice';

const GraduateProfile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentGraduate, isLoading } = useSelector((state: RootState) => state.graduates);

  useEffect(() => {
    dispatch(fetchCurrentGraduate());
  }, [dispatch]);

  const handleToggleAvailability = async () => {
    if (!currentGraduate) return;
    
    try {
      await dispatch(updateGraduateAvailability(!currentGraduate.isAvailable)).unwrap();
      alert(`You are now ${!currentGraduate.isAvailable ? 'available' : 'unavailable'} for requests`);
    } catch (error) {
      alert('Failed to update availability. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!currentGraduate) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Unable to load profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your profile and availability settings
          </p>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <p className="mt-1 text-sm text-gray-900">{currentGraduate.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <p className="mt-1 text-sm text-gray-900">{currentGraduate.phoneNumber}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Expertise</label>
              <p className="mt-1 text-sm text-gray-900 capitalize">{currentGraduate.expertise}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Experience</label>
              <p className="mt-1 text-sm text-gray-900">{currentGraduate.experience} years</p>
            </div>
          </div>
        </div>
      </div>

      {/* Availability Settings */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Availability Settings</h3>
          
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-gray-900">Accept Service Requests</p>
              <p className="text-sm text-gray-500 mt-1">
                {currentGraduate.isAvailable 
                  ? 'You are currently available to accept new service requests from farmers.' 
                  : 'You are not currently accepting new service requests.'
                }
              </p>
            </div>
            <button
              onClick={handleToggleAvailability}
              disabled={isLoading}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                currentGraduate.isAvailable ? 'bg-green-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  currentGraduate.isAvailable ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Status Message */}
          <div className={`mt-4 p-4 rounded-md ${
            currentGraduate.isAvailable 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex">
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
                    ? 'You are available for new requests' 
                    : 'You are not available for new requests'
                  }
                </p>
                <p className={`mt-1 text-sm ${
                  currentGraduate.isAvailable ? 'text-green-700' : 'text-yellow-700'
                }`}>
                  {currentGraduate.isAvailable 
                    ? 'Farmers can see your profile and assign you service requests.'
                    : 'You will not appear in search results or be able to accept new requests.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraduateProfile;
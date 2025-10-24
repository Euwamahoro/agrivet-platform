// src/pages/GraduateProfile.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { updateGraduateProfile, updateGraduateAvailability } from '../store/slices/graduateSlice';

const GraduateProfile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { currentGraduate } = useSelector((state: RootState) => state.graduates);
  const { user } = useSelector((state: RootState) => state.auth);

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialization: 'agronomy' as 'agronomy' | 'veterinary' | 'both',
    province: '',
    district: '',
    sector: '',
    cell: '',
    qualifications: '',
    experience: 0,
  });

  useEffect(() => {
    if (currentGraduate) {
      setFormData({
        name: currentGraduate.name,
        email: currentGraduate.email || '',
        specialization: currentGraduate.specialization,
        province: currentGraduate.province,
        district: currentGraduate.district,
        sector: currentGraduate.sector,
        cell: currentGraduate.cell,
        qualifications: currentGraduate.qualifications.join(', '),
        experience: currentGraduate.experience,
      });
    }
  }, [currentGraduate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'experience' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const updates = {
        ...formData,
        qualifications: formData.qualifications.split(',').map(q => q.trim()).filter(q => q),
      };
      
      await dispatch(updateGraduateProfile(updates)).unwrap();
      setIsEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    if (currentGraduate) {
      try {
        await dispatch(updateGraduateAvailability(!currentGraduate.isAvailable)).unwrap();
      } catch (error) {
        alert('Failed to update availability. Please try again.');
      }
    }
  };

  if (!currentGraduate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage your professional information and availability
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Availability Status</p>
                <button
                  onClick={handleAvailabilityToggle}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    currentGraduate.isAvailable 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  {currentGraduate.isAvailable ? '✅ Available' : '❌ Not Available'}
                </button>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{currentGraduate.name}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{currentGraduate.email || 'Not provided'}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
                      Specialization
                    </label>
                    {isEditing ? (
                      <select
                        id="specialization"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="agronomy">Agronomy</option>
                        <option value="veterinary">Veterinary</option>
                        <option value="both">Both (Dual Expertise)</option>
                      </select>
                    ) : (
                      <p className="mt-1 text-sm text-gray-900 capitalize">{currentGraduate.specialization}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                      Years of Experience
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        id="experience"
                        name="experience"
                        min="0"
                        value={formData.experience}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{currentGraduate.experience} years</p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700">
                    Qualifications
                  </label>
                  {isEditing ? (
                    <textarea
                      id="qualifications"
                      name="qualifications"
                      rows={3}
                      value={formData.qualifications}
                      onChange={handleInputChange}
                      placeholder="List your degrees, certifications, etc. (comma-separated)"
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  ) : (
                    <div className="mt-1">
                      {currentGraduate.qualifications.map((qualification, index) => (
                        <span
                          key={index}
                          className="inline-block bg-gray-100 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2"
                        >
                          {qualification}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-medium text-gray-900 mt-8 mb-4">Location Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="province" className="block text-sm font-medium text-gray-700">
                      Province
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        id="province"
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{currentGraduate.province}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="district" className="block text-sm font-medium text-gray-700">
                      District
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        id="district"
                        name="district"
                        value={formData.district}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{currentGraduate.district}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="sector" className="block text-sm font-medium text-gray-700">
                      Sector
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        id="sector"
                        name="sector"
                        value={formData.sector}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{currentGraduate.sector}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="cell" className="block text-sm font-medium text-gray-700">
                      Cell
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        id="cell"
                        name="cell"
                        value={formData.cell}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{currentGraduate.cell}</p>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Profile Stats Sidebar */}
        <div className="space-y-6">
          {/* Account Information */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <p className="mt-1 text-sm text-gray-900">{user?.phoneNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Member Since</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(currentGraduate.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">
                    {currentGraduate.id.substring(0, 8)}...
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed Services</span>
                  <span className="text-sm font-medium text-gray-900">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Current Rating</span>
                  <span className="text-sm font-medium text-gray-900">
                    {currentGraduate.rating ? `⭐ ${currentGraduate.rating}/5` : 'No ratings yet'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Response Rate</span>
                  <span className="text-sm font-medium text-gray-900">92%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Assignments</span>
                  <span className="text-sm font-medium text-gray-900">3</span>
                </div>
              </div>
            </div>
          </div>

          {/* Availability Notice */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Availability</h3>
              <div className={`p-4 rounded-md ${
                currentGraduate.isAvailable 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`text-sm ${
                  currentGraduate.isAvailable ? 'text-green-800' : 'text-red-800'
                }`}>
                  {currentGraduate.isAvailable 
                    ? '✅ You are currently available to receive new service requests.' 
                    : '❌ You are not available for new service requests. Farmers cannot assign you new tasks.'
                  }
                </p>
                <button
                  onClick={handleAvailabilityToggle}
                  className="mt-2 text-sm font-medium text-green-600 hover:text-green-500"
                >
                  {currentGraduate.isAvailable ? 'Mark as unavailable' : 'Mark as available'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraduateProfile;
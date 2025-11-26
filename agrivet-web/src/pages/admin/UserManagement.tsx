import React, { useEffect, useState } from 'react';
import { getUsers, updateUserStatus, User, getFarmers, getGraduates } from '../../services/adminServices';

interface CombinedUser extends User {
  expertise?: string;
  province?: string;
  district?: string;
  totalRequests?: number;
  completedRequests?: number;
  pendingRequests?: number;
  serviceRequests?: any[];
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<CombinedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllUsers();
  }, [filterRole, showInactive]);

  const fetchAllUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Fetching all users data...');
      
      // Fetch ALL data from all endpoints
      const [usersResponse, farmersResponse, graduatesResponse] = await Promise.all([
        getUsers('', 1, 1000),
        getFarmers(),
        getGraduates()
      ]);

      console.log('📊 API Response Summary:', {
        totalUsers: usersResponse?.users?.length || 0,
        totalFarmers: farmersResponse?.length || 0,
        totalGraduates: graduatesResponse?.length || 0
      });

      console.log('👨‍🌾 Farmers raw data:', farmersResponse);
      console.log('🎓 Graduates raw data:', graduatesResponse);

      let combinedUsers: CombinedUser[] = [];

      // 1. Start with base users
      if (usersResponse && usersResponse.users) {
        combinedUsers = [...usersResponse.users];
        console.log('✅ Loaded base users:', usersResponse.users.length);
      }

      // 2. Process FARMERS - with comprehensive data extraction
      if (farmersResponse && Array.isArray(farmersResponse)) {
        farmersResponse.forEach((farmer: any) => {
          console.log('Processing farmer:', farmer);
          
          // Extract service requests data
          const serviceRequests = farmer.requests || farmer.serviceRequests || [];
          const totalRequests = serviceRequests.length;
          const completedRequests = serviceRequests.filter((req: any) => 
            req.status === 'completed' || req.status === 'closed'
          ).length;
          const pendingRequests = serviceRequests.filter((req: any) => 
            req.status === 'pending' || req.status === 'assigned' || req.status === 'in_progress'
          ).length;

          // Extract farmer data - handle different possible data structures
          const farmerData: CombinedUser = {
            _id: farmer._id || farmer.user?._id,
            name: farmer.name || farmer.user?.name || farmer.farmerName || 'Unknown Farmer',
            phoneNumber: farmer.phoneNumber || farmer.user?.phoneNumber || farmer.farmerPhone || 'N/A',
            email: farmer.email || farmer.user?.email,
            role: 'farmer',
            isActive: farmer.isActive ?? farmer.user?.isActive ?? true,
            createdAt: farmer.createdAt || farmer.user?.createdAt || new Date().toISOString(),
            province: farmer.province || farmer.location?.province,
            district: farmer.district || farmer.location?.district,
            totalRequests: farmer.totalRequests || totalRequests,
            completedRequests: farmer.completedRequests || completedRequests,
            pendingRequests: pendingRequests,
            serviceRequests: serviceRequests
          };

          // Check if this farmer already exists in combinedUsers
          const existingUserIndex = combinedUsers.findIndex(u => 
            u._id === farmerData._id || 
            u.phoneNumber === farmerData.phoneNumber ||
            u.name === farmerData.name
          );
          
          if (existingUserIndex !== -1) {
            // Update existing user with farmer details
            combinedUsers[existingUserIndex] = {
              ...combinedUsers[existingUserIndex],
              ...farmerData,
              role: 'farmer'
            };
            console.log('✅ Updated existing farmer:', farmerData.name);
          } else {
            // Create new user entry from farmer data
            combinedUsers.push(farmerData);
            console.log('✅ Added new farmer:', farmerData.name);
          }
        });
        console.log('✅ Processed farmers:', farmersResponse.length);
      }

      // 3. Process GRADUATES - with comprehensive data extraction
      if (graduatesResponse && Array.isArray(graduatesResponse)) {
        graduatesResponse.forEach((graduate: any) => {
          console.log('Processing graduate:', graduate);
          
          // Extract graduate data
          const graduateData: CombinedUser = {
            _id: graduate._id || graduate.user?._id,
            name: graduate.name || graduate.user?.name || 'Unknown Graduate',
            phoneNumber: graduate.phoneNumber || graduate.user?.phoneNumber || 'N/A',
            email: graduate.email || graduate.user?.email,
            role: 'graduate',
            isActive: graduate.isActive ?? graduate.user?.isActive ?? true,
            createdAt: graduate.createdAt || graduate.user?.createdAt || new Date().toISOString(),
            expertise: graduate.expertise,
            province: graduate.province || graduate.location?.province,
            district: graduate.district || graduate.location?.district
          };

          // Check if this graduate already exists in combinedUsers
          const existingUserIndex = combinedUsers.findIndex(u => 
            u._id === graduateData._id || 
            u.phoneNumber === graduateData.phoneNumber ||
            u.name === graduateData.name
          );
          
          if (existingUserIndex !== -1) {
            // Update existing user with graduate details
            combinedUsers[existingUserIndex] = {
              ...combinedUsers[existingUserIndex],
              ...graduateData,
              role: 'graduate'
            };
            console.log('✅ Updated existing graduate:', graduateData.name);
          } else {
            // Create new user entry from graduate data
            combinedUsers.push(graduateData);
            console.log('✅ Added new graduate:', graduateData.name);
          }
        });
        console.log('✅ Processed graduates:', graduatesResponse.length);
      }

      // Remove any potential duplicates based on _id
      const uniqueUsers = combinedUsers.filter((user, index, self) => 
        index === self.findIndex(u => u._id === user._id)
      );

      console.log('🎯 Final combined users:', uniqueUsers);
      console.log('📈 Role distribution:', {
        admins: uniqueUsers.filter(u => u.role === 'admin').length,
        graduates: uniqueUsers.filter(u => u.role === 'graduate').length,
        farmers: uniqueUsers.filter(u => u.role === 'farmer').length
      });

      // Log farmer details for debugging
      const farmers = uniqueUsers.filter(u => u.role === 'farmer');
      console.log('👨‍🌾 Farmer details:', farmers.map(f => ({
        name: f.name,
        phone: f.phoneNumber,
        totalRequests: f.totalRequests,
        completedRequests: f.completedRequests,
        pendingRequests: f.pendingRequests,
        serviceRequests: f.serviceRequests?.length
      })));

      // Apply role filter if specified
      let filteredUsers = uniqueUsers;
      if (filterRole) {
        filteredUsers = uniqueUsers.filter(user => user.role === filterRole);
        console.log(`🔍 Filtered by role '${filterRole}':`, filteredUsers.length);
      }

      // Apply active/inactive filter
      if (!showInactive) {
        filteredUsers = filteredUsers.filter(user => user.isActive);
        console.log('👥 Active users only:', filteredUsers.length);
      }

      setUsers(filteredUsers);
      
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      setError('Failed to load users. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      setActionLoading(userId);
      await updateUserStatus(userId, !currentStatus);
      await fetchAllUsers();
      alert(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate') => {
    if (selectedUsers.length === 0) {
      alert('Please select users first');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${selectedUsers.length} user(s)?`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const isActive = action === 'activate';
      
      await Promise.all(
        selectedUsers.map(userId => updateUserStatus(userId, isActive))
      );
      
      setSelectedUsers([]);
      await fetchAllUsers();
      alert(`Successfully ${action}d ${selectedUsers.length} user(s)`);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Failed to perform bulk action. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phoneNumber.includes(searchTerm) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.expertise && user.expertise.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.province && user.province.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.district && user.district.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate statistics from ALL users
  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    admins: users.filter(u => u.role === 'admin').length,
    graduates: users.filter(u => u.role === 'graduate').length,
    farmers: users.filter(u => u.role === 'farmer').length,
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'graduate': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'farmer': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return '👑';
      case 'graduate': return '🎓';
      case 'farmer': return '🌾';
      default: return '👤';
    }
  };

  const getRequestStats = (user: CombinedUser) => {
    if (user.role !== 'farmer') return null;
    
    const total = user.totalRequests || 0;
    const completed = user.completedRequests || 0;
    const pending = user.pendingRequests || (total - completed);
    
    return { total, completed, pending };
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <div className="text-lg text-gray-600">Loading users...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">❌ {error}</div>
          <button
            onClick={fetchAllUsers}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all platform users and their access</p>
        </div>
        <button
          onClick={fetchAllUsers}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center space-x-2 disabled:opacity-50"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white shadow rounded-lg p-4 border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-600">Active</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border-l-4 border-red-500">
          <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
          <div className="text-sm text-gray-600">Inactive</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border-l-4 border-purple-500">
          <div className="text-2xl font-bold text-purple-600">{stats.admins}</div>
          <div className="text-sm text-gray-600">Admins</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border-l-4 border-indigo-500">
          <div className="text-2xl font-bold text-indigo-600">{stats.graduates}</div>
          <div className="text-sm text-gray-600">Graduates</div>
        </div>
        <div className="bg-white shadow rounded-lg p-4 border-l-4 border-yellow-500">
          <div className="text-2xl font-bold text-yellow-600">{stats.farmers}</div>
          <div className="text-sm text-gray-600">Farmers</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, phone, email, expertise, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <svg 
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="">All Roles</option>
              <option value="farmer">Farmers</option>
              <option value="graduate">Graduates</option>
              <option value="admin">Admins</option>
            </select>

            <label className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-md">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">Show Inactive Users</span>
            </label>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between bg-blue-50 border border-blue-200 rounded-md p-3">
            <span className="text-sm font-medium text-blue-900 mb-2 sm:mb-0">
              {selectedUsers.length} user(s) selected
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                Activate Selected
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
              >
                Deactivate Selected
              </button>
              <button
                onClick={() => setSelectedUsers([])}
                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length && users.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Information
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role & Details
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registered
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center space-y-3">
                      <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      <div className="text-gray-500 text-lg">
                        {searchTerm ? 'No users found matching your search' : 'No users found'}
                      </div>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="text-green-600 hover:text-green-700 text-sm"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const requestStats = getRequestStats(user);
                  
                  return (
                    <tr 
                      key={user._id} 
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedUsers.includes(user._id) ? 'bg-blue-50' : ''
                      } ${!user.isActive ? 'opacity-70' : ''}`}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={() => handleSelectUser(user._id)}
                          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-semibold text-lg">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                              <span>{user.name}</span>
                              {!user.isActive && (
                                <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">INACTIVE</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center space-x-1">
                              <span>📱</span>
                              <span>{user.phoneNumber}</span>
                            </div>
                            {user.email && (
                              <div className="text-sm text-gray-500 flex items-center space-x-1">
                                <span>✉️</span>
                                <span>{user.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="space-y-2">
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                            {getRoleIcon(user.role)} {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          </span>
                          
                          {/* Role-specific details */}
                          {user.role === 'graduate' && user.expertise && (
                            <div className="text-xs text-gray-600">
                              <strong>Expertise:</strong> {user.expertise}
                            </div>
                          )}
                          
                          {(user.province || user.district) && (
                            <div className="text-xs text-gray-600">
                              <strong>Location:</strong> {[user.province, user.district].filter(Boolean).join(', ')}
                            </div>
                          )}
                          
                          {user.role === 'farmer' && requestStats && (
                            <div className="space-y-1">
                              <div className="text-xs text-gray-600">
                                <strong>Requests:</strong> {requestStats.completed}/{requestStats.total} completed
                              </div>
                              {requestStats.pending > 0 && (
                                <div className="text-xs text-yellow-600">
                                  <strong>Pending:</strong> {requestStats.pending}
                                </div>
                              )}
                              {user.serviceRequests && user.serviceRequests.length > 0 && (
                                <div className="text-xs text-blue-600">
                                  <strong>Services:</strong> {user.serviceRequests.length} total
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          <span className={`mr-1 h-2 w-2 rounded-full ${
                            user.isActive ? 'bg-green-600' : 'bg-red-600'
                          }`}></span>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(user.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleStatusToggle(user._id, user.isActive)}
                          disabled={actionLoading === user._id}
                          className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            user.isActive 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          } ${actionLoading === user._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {actionLoading === user._id ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </>
                          ) : (
                            <>
                              {user.isActive ? '🚫 Deactivate' : '✅ Activate'}
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
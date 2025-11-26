import api from './api';

export interface PlatformStats {
  totalFarmers: number;
  totalGraduates: number;
  activeRequests: number;
  completedServices: number;
  pendingRegistrations: number;
  revenueThisMonth: number;
}

export interface User {
  _id: string;
  phoneNumber: string;
  name: string;
  email?: string;
  role: 'farmer' | 'graduate' | 'admin';
  isActive: boolean;
  createdAt: string;
}

export interface ServiceRequest {
  _id: string;
  serviceType: string;
  description: string;
  status: string;
  location: {
    province: string;
    district: string;
    sector: string;
    cell: string;
  };
  farmer: {
    province: string;
    district: string;
    sector: string;
    cell: string;
    user: {
      name: string;
      phoneNumber: string;
    };
  };
  graduate?: {
    expertise: string;
    province: string;
    district: string;
    user: {
      name: string;
      phoneNumber: string;
    };
  };
  
  farmerPhone?: string;
  farmerName?: string;
  ussdId?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsData {
  serviceRequestsByType: Array<{ _id: string; count: number }>;
  requestsByStatus: Array<{ _id: string; count: number }>;
  requestsByProvince: Array<{ _id: string; count: number }>;
}

// Platform Statistics
export const getPlatformStats = async (): Promise<PlatformStats> => {
  const response = await api.get('/admin/stats');
  return response.data;
};

// User Management
export const getUsers = async (role?: string, page: number = 1, limit: number = 10): Promise<{
  users: User[];
  totalPages: number;
  currentPage: number;
  total: number;
}> => {
  const params = { role, page, limit };
  const response = await api.get('/admin/users', { params });
  return response.data;
};

export const updateUserStatus = async (userId: string, isActive: boolean): Promise<{ message: string; user: User }> => {
  const response = await api.patch(`/admin/users/${userId}/status`, { isActive });
  return response.data;
};

// Graduates Management
export const getGraduates = async (): Promise<any[]> => {
  const response = await api.get('/admin/graduates');
  return response.data;
};

// Farmers Management  
export const getFarmers = async (): Promise<any[]> => {
  const response = await api.get('/admin/farmers');
  return response.data;
};

// Service Requests Management
export const getServiceRequests = async (status?: string, page: number = 1, limit: number = 10): Promise<{
  requests: ServiceRequest[];
  totalPages: number;
  currentPage: number;
  total: number;
}> => {
  const params = { status, page, limit };
  const response = await api.get('/admin/service-requests', { params });
  return response.data;
};

// Analytics
export const getAnalytics = async (): Promise<AnalyticsData> => {
  const response = await api.get('/admin/analytics');
  return response.data;
};
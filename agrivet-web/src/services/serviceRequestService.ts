// src/services/serviceRequestService.ts
import axios from 'axios';
import { ServiceRequest } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const serviceRequestService = {
  getAvailableRequests: async (filters?: { serviceType?: string; location?: string }) => {
    const params = new URLSearchParams();
    if (filters?.serviceType) params.append('serviceType', filters.serviceType);
    if (filters?.location) params.append('location', filters.location);
    
    console.log('📥 Fetching available requests with filters:', filters);
    const response = await api.get(`/service-requests/available?${params}`);
    console.log('📦 Received available requests:', response.data);
    
    // Transform the data: copy _id to id for frontend compatibility
    const transformedData = response.data.map((request: any) => ({
      ...request,
      id: request._id // Copy _id to id for frontend
    }));
    
    console.log('🔄 Transformed requests:', transformedData);
    return transformedData;
  },

  acceptRequest: async (requestId: string) => {
    console.log('📤 Making API call to accept request:', requestId);
    
    if (!requestId || requestId === 'undefined') {
      console.error('❌ Invalid request ID in service:', requestId);
      throw new Error(`Invalid request ID: ${requestId}`);
    }
    
    try {
      console.log('🌐 Calling endpoint:', `/service-requests/${requestId}/accept`);
      const response = await api.post(`/service-requests/${requestId}/accept`);
      console.log('✅ Request accepted successfully in service:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ API error accepting request in service:', error);
      console.error('❌ Error details:', error.response?.data);
      throw error;
    }
  },

  updateStatus: async (requestId: string, status: string, notes?: string) => {
    const response = await api.patch(`/service-requests/${requestId}/status`, { status, notes });
    return response.data;
  },

  getMyAssignments: async () => {
    const response = await api.get('/service-requests/my-assignments');
    return response.data;
  },
};
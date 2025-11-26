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
    
    console.log('🌐 === FRONTEND: FETCHING AVAILABLE REQUESTS ===');
    console.log('📥 Filters:', filters);
    console.log('🔗 URL:', `/service-requests/available?${params}`);
    
    const response = await api.get(`/service-requests/available?${params}`);
    
    console.log('📦 Raw API Response:', response.data);
    console.log('📊 Number of requests:', response.data.length);
    
    // Log each request in detail
    response.data.forEach((request: any, index: number) => {
      console.log(`\n📋 Frontend Request ${index + 1}:`);
      console.log('  Raw request object keys:', Object.keys(request));
      console.log('  _id:', request._id);
      console.log('  id:', request.id);
      console.log('  farmer (if populated):', request.farmer);
      console.log('  farmerName:', request.farmerName);
      console.log('  farmerPhone:', request.farmerPhone);
      console.log('  serviceType:', request.serviceType);
      console.log('  description:', request.description?.substring(0, 50));
      console.log('  location:', request.location);
      console.log('  status:', request.status);
      console.log('  Full request object:', JSON.stringify(request, null, 2));
    });
    
    // Transform the data: copy _id to id for frontend compatibility
    const transformedData = response.data.map((request: any) => {
      const transformed = {
        ...request,
        id: request._id || request.id // Use _id if id doesn't exist
      };
      
      console.log('\n🔄 Transformed request:', {
        originalId: request.id,
        original_id: request._id,
        transformedId: transformed.id,
        farmerName: transformed.farmerName,
        farmerPhone: transformed.farmerPhone
      });
      
      return transformed;
    });
    
    console.log('\n✅ Final transformed data:', transformedData);
    console.log('🌐 === FRONTEND: FETCH COMPLETE ===\n');
    
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
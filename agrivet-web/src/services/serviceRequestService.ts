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
    
    const response = await api.get(`/service-requests/available?${params}`);
    return response.data;
  },

  acceptRequest: async (requestId: string) => {
    const response = await api.post(`/service-requests/${requestId}/accept`);
    return response.data;
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
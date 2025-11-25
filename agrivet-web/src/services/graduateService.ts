// src/services/graduateService.ts
import axios from 'axios';
import { Graduate } from '../types';

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

export const graduateService = {
  getGraduates: async (filters?: { specialization?: string; location?: string }) => {
    const params = new URLSearchParams();
    if (filters?.specialization) params.append('specialization', filters.specialization);
    if (filters?.location) params.append('location', filters.location);
    
    const response = await api.get(`/graduates?${params}`);
    return response.data;
  },

  // ADD THIS: Get current logged-in graduate - uses /profile endpoint
  getCurrentGraduate: async (): Promise<Graduate> => {
    const response = await api.get('/graduates/profile');
    return response.data;
  },

  getGraduateProfile: async (graduateId: string) => {
    const response = await api.get(`/graduates/${graduateId}`);
    return response.data;
  },

  updateProfile: async (updates: Partial<Graduate>) => {
    const response = await api.patch('/graduates/profile', updates);
    return response.data;
  },

  updateAvailability: async (isAvailable: boolean) => {
    const response = await api.patch('/graduates/availability', { isAvailable });
    return response.data;
  },

  getGraduateStats: async (graduateId: string) => {
    const response = await api.get(`/graduates/${graduateId}/stats`);
    return response.data;
  },
};
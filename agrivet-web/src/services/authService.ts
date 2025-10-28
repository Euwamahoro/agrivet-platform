// src/services/authService.ts
import axios from 'axios';
// Remove unused import - Graduate is not used
import { User } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL;

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

export const authService = {
  login: async (credentials: { phoneNumber: string; password: string }) => {    
    try {
      // ADD /api to the path
      const response = await api.post('/api/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  registerAdmin: async (adminData: { phoneNumber: string; name: string; email?: string; password: string }) => {
    // ADD /api to the path
    const response = await api.post('/api/auth/register/admin', adminData);
    return response.data;
  },

  registerGraduate: async (graduateData: any) => {
    console.log('🔄 Sending registration request:', graduateData);
    
    try {
      // ADD /api to the path
      const response = await api.post('/api/auth/register/graduate', graduateData);
      return response.data;
    } catch (error: any) {
      console.error('❌ Registration failed:', error.response?.data || error.message);
      throw error;
    }
  },

  getCurrentUser: async (): Promise<User> => {
    // ADD /api to the path
    const response = await api.get('/api/auth/me');
    return response.data;
  },
};
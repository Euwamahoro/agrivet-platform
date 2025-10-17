// src/services/authService.ts
import axios from 'axios';
import { User, Graduate } from '../types';

const API_BASE_URL ='http://localhost:5000/api';

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
    console.log('🔄 Sending login request:', credentials);
    
    try {
      const response = await api.post('/auth/login', credentials);
      console.log('✅ Login successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      throw error;
    }
  },

registerAdmin: async (adminData: { phoneNumber: string; name: string; email?: string; password: string }) => {
  const response = await api.post('/auth/register/admin', adminData);
  return response.data;
},

  registerGraduate: async (graduateData: any) => {
    console.log('🔄 Sending registration request:', graduateData);
    
    try {
      const response = await api.post('/auth/register/graduate', graduateData);
      console.log('✅ Registration successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Registration failed:', error.response?.data || error.message);
      throw error;
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
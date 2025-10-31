// src/services/authService.ts - FIXED VERSION
import api from './api'; // ✅ Use the shared axios instance
import { User } from '../types';

export const authService = {
  login: async (credentials: { phoneNumber: string; password: string }) => {    
    try {
      // ✅ FIXED: Removed /api prefix (it's in baseURL now)
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  registerAdmin: async (adminData: { phoneNumber: string; name: string; email?: string; password: string }) => {
    // ✅ FIXED: Removed /api prefix
    const response = await api.post('/auth/register/admin', adminData);
    return response.data;
  },

  registerGraduate: async (graduateData: any) => {
    console.log('🔄 Sending registration request:', graduateData);
    
    try {
      // ✅ FIXED: Removed /api prefix
      const response = await api.post('/auth/register/graduate', graduateData);
      return response.data;
    } catch (error: any) {
      console.error('❌ Registration failed:', error.response?.data || error.message);
      throw error;
    }
  },

  getCurrentUser: async (): Promise<User> => {
    // ✅ FIXED: Removed /api prefix
    const response = await api.get('/auth/me');
    return response.data;
  },
};
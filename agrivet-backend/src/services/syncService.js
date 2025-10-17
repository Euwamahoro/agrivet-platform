// src/services/syncService.js - UPDATED FILE
const axios = require('axios');

class SyncService {
  constructor() {
    this.ussdApiBase = process.env.USSD_API_URL || 'http://localhost:3001/api';
    this.webApiBase = process.env.WEB_API_URL || 'http://localhost:5000/api';
  }

  // Sync graduate from web to USSD system (EXISTING - KEEP THIS)
  async syncGraduateToUSSD(graduateData) {
    try {
      console.log('🔄 Syncing graduate to USSD system:', graduateData.phoneNumber);
      
      const response = await axios.post(`${this.ussdApiBase}/graduates/sync`, {
        phoneNumber: graduateData.phoneNumber,
        name: graduateData.name,
        expertise: graduateData.expertise,
        province: graduateData.province,
        district: graduateData.district,
        sector: graduateData.sector,
        cell: graduateData.cell
      }, {
        timeout: 10000
      });
      console.log('✅ Graduate synced successfully to USSD:', response.data);
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('USSD API is not available. Make sure the USSD backend is running.');
      } else if (error.response) {
        throw new Error(`USSD system error: ${error.response.data.error || error.response.statusText}`);
      } else if (error.request) {
        throw new Error('No response from USSD system. Check network connection.');
      } else {
        throw new Error(`Sync failed: ${error.message}`);
      }
    }
  }

  // NEW: Sync data from USSD to Web
  async syncFromUSSDToWeb() {
    try {
      console.log('🔄 Starting sync from USSD to Web...');

      // 1. Get farmers from USSD
      const farmersResponse = await axios.get(`${this.ussdApiBase}/farmers/sync`);
      const farmers = farmersResponse.data.data || [];
      console.log(`📋 Found ${farmers.length} farmers in USSD`);

      // 2. Get service requests from USSD
      const requestsResponse = await axios.get(`${this.ussdApiBase}/service-requests/sync`);
      const serviceRequests = requestsResponse.data.data || [];
      console.log(`📋 Found ${serviceRequests.length} service requests in USSD`);

      // 3. Sync farmers to web - REMOVED AUTHORIZATION HEADER
      if (farmers.length > 0) {
        await axios.post(`${this.webApiBase}/sync/farmers/sync`, {
          farmers: farmers
        });
        console.log(`✅ Synced ${farmers.length} farmers to web`);
      }

      // 4. Sync service requests to web - REMOVED AUTHORIZATION HEADER
      if (serviceRequests.length > 0) {
        await axios.post(`${this.webApiBase}/sync/service-requests/sync`, {
          serviceRequests: serviceRequests
        });
        console.log(`✅ Synced ${serviceRequests.length} service requests to web`);
      }

      console.log('🎉 USSD to Web sync completed successfully');
      return {
        farmers: farmers.length,
        serviceRequests: serviceRequests.length
      };
    } catch (error) {
      console.error('❌ USSD to Web sync failed:', error.message);
      throw new Error(`USSD to Web sync failed: ${error.message}`);
    }
  }

  // Get graduates from USSD system (EXISTING - KEEP THIS)
  async getGraduatesFromUSSD() {
    try {
      const response = await axios.get(`${this.ussdApiBase}/graduates/sync`, {
        timeout: 10000
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching graduates from USSD:', error.message);
      throw new Error('Failed to fetch graduates from USSD system');
    }
  }

  // NEW: Get sync status - REMOVED AUTHORIZATION HEADER (since we removed auth from the route)
  async getSyncStatus() {
    try {
      const response = await axios.get(`${this.webApiBase}/sync/status`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting sync status:', error.message);
      throw new Error('Failed to get sync status');
    }
  }
}

module.exports = new SyncService();
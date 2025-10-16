const axios = require('axios');

class SyncService {
  constructor() {
    this.ussdApiBase = process.env.USSD_API_URL || 'http://localhost:3000/api';
  }

  // Sync graduate from web to USSD system
  async syncGraduateToUSSD(graduateData) {
  try {
    console.log('🔄 Syncing graduate to USSD system:', graduateData.phoneNumber);
    
    const response = await axios.post(`${this.ussdApiBase}/graduates/sync`, {
      phoneNumber: graduateData.phoneNumber,
      name: graduateData.name,
      expertise: graduateData.expertise, // Use 'expertise' directly now
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
        // USSD API returned an error response
        throw new Error(`USSD system error: ${error.response.data.error || error.response.statusText}`);
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('No response from USSD system. Check network connection.');
      } else {
        throw new Error(`Sync failed: ${error.message}`);
      }
    }
  }

  // Get graduates from USSD system (optional - for syncing existing data)
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
}

module.exports = new SyncService();
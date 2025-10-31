// src/services/syncService.js - COMPLETE UPDATED VERSION
const axios = require('axios');

class SyncService {
  constructor() {
    // Use environment variables with fallback to actual deployed URLs
    this.ussdApiBase = process.env.USSD_API_URL || 'https://agrivet-ussd.onrender.com';
    this.webApiBase = process.env.WEB_API_URL || 'https://agrivet-backend.up.railway.app';
    
    console.log('🔧 Sync Service URLs:', {
      ussd: this.ussdApiBase,
      web: this.webApiBase
    });
  }

  // Sync from USSD to Web (Primary sync method)
  async syncFromUSSDToWeb() {
    try {
      console.log('🔄 Starting sync from USSD to Web...');
      console.log('📡 USSD API:', this.ussdApiBase);
      console.log('📡 Web API:', this.webApiBase);

      let farmers = [];
      let serviceRequests = [];

      // 1. Get farmers from USSD
      try {
        console.log('📥 Fetching farmers from USSD...');
        const farmersResponse = await axios.get(`${this.ussdApiBase}/api/farmers/sync`, {
          timeout: 15000,
          validateStatus: function (status) {
            return status < 500; // Resolve only if status code is less than 500
          }
        });
        
        if (farmersResponse.data && farmersResponse.data.success) {
          farmers = farmersResponse.data.data || [];
          console.log(`📋 Found ${farmers.length} farmers in USSD`);
        } else {
          console.log('⚠️ No farmers data found in USSD response');
        }
      } catch (farmersError) {
        console.error('❌ Failed to fetch farmers from USSD:', farmersError.message);
        // Continue with other sync operations
      }

      // 2. Get service requests from USSD
      try {
        console.log('📥 Fetching service requests from USSD...');
        const requestsResponse = await axios.get(`${this.ussdApiBase}/api/service-requests/sync`, {
          timeout: 15000,
          validateStatus: function (status) {
            return status < 500;
          }
        });
        
        if (requestsResponse.data && requestsResponse.data.success) {
          serviceRequests = requestsResponse.data.data || [];
          console.log(`📋 Found ${serviceRequests.length} service requests in USSD`);
        } else {
          console.log('⚠️ No service requests data found in USSD response');
        }
      } catch (requestsError) {
        console.error('❌ Failed to fetch service requests from USSD:', requestsError.message);
        // Continue with other sync operations
      }

      let farmersSynced = 0;
      let requestsSynced = 0;

      // 3. Sync farmers to web
      if (farmers.length > 0) {
        try {
          console.log('🔄 Syncing farmers to web...');
          const farmersSyncResponse = await axios.post(`${this.webApiBase}/api/sync/farmers`, {
            farmers: farmers
          }, {
            timeout: 15000,
            validateStatus: function (status) {
              return status < 500;
            }
          });
          
          if (farmersSyncResponse.data && farmersSyncResponse.data.success) {
            farmersSynced = farmers.length;
            console.log(`✅ Synced ${farmersSynced} farmers to web`);
          } else {
            console.log('⚠️ Farmers sync completed but with warnings');
          }
        } catch (farmersSyncError) {
          console.error('❌ Failed to sync farmers to web:', farmersSyncError.message);
        }
      } else {
        console.log('ℹ️ No farmers to sync');
      }

      // 4. Sync service requests to web
      if (serviceRequests.length > 0) {
        try {
          console.log('🔄 Syncing service requests to web...');
          const requestsSyncResponse = await axios.post(`${this.webApiBase}/api/sync/service-requests`, {
            serviceRequests: serviceRequests
          }, {
            timeout: 15000,
            validateStatus: function (status) {
              return status < 500;
            }
          });
          
          if (requestsSyncResponse.data && requestsSyncResponse.data.success) {
            requestsSynced = serviceRequests.length;
            console.log(`✅ Synced ${requestsSynced} service requests to web`);
          } else {
            console.log('⚠️ Service requests sync completed but with warnings');
          }
        } catch (requestsSyncError) {
          console.error('❌ Failed to sync service requests to web:', requestsSyncError.message);
        }
      } else {
        console.log('ℹ️ No service requests to sync');
      }

      console.log('🎉 USSD to Web sync completed successfully');
      return {
        success: true,
        farmers: farmersSynced,
        serviceRequests: requestsSynced,
        message: `Synced ${farmersSynced} farmers and ${requestsSynced} service requests from USSD to Web`
      };
    } catch (error) {
      console.error('❌ USSD to Web sync failed:', error);
      
      let errorMessage = 'Sync failed';
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = `Cannot connect to API. Check URLs: USSD=${this.ussdApiBase}, Web=${this.webApiBase}`;
      } else if (error.response) {
        errorMessage = `API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        errorMessage = 'No response received from API. Check if services are running.';
      } else {
        errorMessage = `Sync failed: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  }

  // Sync from Web to USSD
  async syncFromWebToUSSD() {
    try {
      console.log('🔄 Starting sync from Web to USSD...');

      let graduates = [];
      let serviceRequests = [];

      // 1. Get graduates from Web
      try {
        console.log('📥 Fetching graduates from Web...');
        const graduatesResponse = await axios.get(`${this.webApiBase}/api/graduates/sync`, {
          timeout: 15000,
          validateStatus: function (status) {
            return status < 500;
          }
        });
        
        if (graduatesResponse.data && graduatesResponse.data.success) {
          graduates = graduatesResponse.data.data || [];
          console.log(`📋 Found ${graduates.length} graduates in Web`);
        } else {
          console.log('⚠️ No graduates data found in Web response');
        }
      } catch (graduatesError) {
        console.error('❌ Failed to fetch graduates from Web:', graduatesError.message);
      }

      // 2. Get service requests from Web
      try {
        console.log('📥 Fetching service requests from Web...');
        const requestsResponse = await axios.get(`${this.webApiBase}/api/service-requests/sync`, {
          timeout: 15000,
          validateStatus: function (status) {
            return status < 500;
          }
        });
        
        if (requestsResponse.data && requestsResponse.data.success) {
          serviceRequests = requestsResponse.data.data || [];
          console.log(`📋 Found ${serviceRequests.length} service requests in Web`);
        } else {
          console.log('⚠️ No service requests data found in Web response');
        }
      } catch (requestsError) {
        console.error('❌ Failed to fetch service requests from Web:', requestsError.message);
      }

      let graduatesSynced = 0;
      let requestsSynced = 0;

      // 3. Sync graduates to USSD
      if (graduates.length > 0) {
        try {
          console.log('🔄 Syncing graduates to USSD...');
          for (const graduate of graduates) {
            try {
              await this.syncGraduateToUSSD(graduate);
              graduatesSynced++;
            } catch (gradError) {
              console.error(`❌ Failed to sync graduate ${graduate.phoneNumber}:`, gradError.message);
            }
          }
          console.log(`✅ Synced ${graduatesSynced} graduates to USSD`);
        } catch (gradSyncError) {
          console.error('❌ Failed to sync graduates to USSD:', gradSyncError.message);
        }
      } else {
        console.log('ℹ️ No graduates to sync');
      }

      // 4. Sync service requests to USSD
      if (serviceRequests.length > 0) {
        try {
          console.log('🔄 Syncing service requests to USSD...');
          const requestsSyncResponse = await axios.post(`${this.ussdApiBase}/api/sync/service-requests`, {
            serviceRequests: serviceRequests
          }, {
            timeout: 15000,
            validateStatus: function (status) {
              return status < 500;
            }
          });
          
          if (requestsSyncResponse.data && requestsSyncResponse.data.success) {
            requestsSynced = serviceRequests.length;
            console.log(`✅ Synced ${requestsSynced} service requests to USSD`);
          } else {
            console.log('⚠️ Service requests sync completed but with warnings');
          }
        } catch (requestsSyncError) {
          console.error('❌ Failed to sync service requests to USSD:', requestsSyncError.message);
        }
      } else {
        console.log('ℹ️ No service requests to sync');
      }

      console.log('🎉 Web to USSD sync completed successfully');
      return {
        success: true,
        graduates: graduatesSynced,
        serviceRequests: requestsSynced,
        message: `Synced ${graduatesSynced} graduates and ${requestsSynced} service requests from Web to USSD`
      };
    } catch (error) {
      console.error('❌ Web to USSD sync failed:', error);
      throw new Error(`Web to USSD sync failed: ${error.message}`);
    }
  }

  // Sync graduate from web to USSD system (individual graduate)
  async syncGraduateToUSSD(graduateData) {
    try {
      console.log('🔄 Syncing graduate to USSD system:', graduateData.phoneNumber);
      
      const response = await axios.post(`${this.ussdApiBase}/api/graduates/sync`, {
        phoneNumber: graduateData.phoneNumber,
        name: graduateData.name,
        expertise: graduateData.expertise,
        province: graduateData.province,
        district: graduateData.district,
        sector: graduateData.sector,
        cell: graduateData.cell,
        location: graduateData.location
      }, {
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500;
        }
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

  // Get graduates from USSD system
  async getGraduatesFromUSSD() {
    try {
      const response = await axios.get(`${this.ussdApiBase}/api/graduates/sync`, {
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500;
        }
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching graduates from USSD:', error.message);
      throw new Error('Failed to fetch graduates from USSD system');
    }
  }

  // Get sync status
  async getSyncStatus() {
    try {
      const response = await axios.get(`${this.webApiBase}/api/sync/status`, {
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500;
        }
      });
      return response.data.data || {};
    } catch (error) {
      console.error('Error getting sync status:', error.message);
      // Return default status instead of throwing error
      return {
        ussdToWeb: { success: false, lastSync: null, error: error.message },
        webToUSSD: { success: false, lastSync: null, error: error.message }
      };
    }
  }

  // Two-way sync (both directions)
  async twoWaySync() {
    try {
      console.log('🔄 Starting two-way synchronization...');
      
      const ussdToWebResult = await this.syncFromUSSDToWeb();
      const webToUSSDResult = await this.syncFromWebToUSSD();
      
      console.log('🎉 Two-way sync completed successfully');
      return {
        success: true,
        ussdToWeb: ussdToWebResult,
        webToUSSD: webToUSSDResult,
        message: 'Two-way synchronization completed successfully'
      };
    } catch (error) {
      console.error('❌ Two-way sync failed:', error);
      throw new Error(`Two-way sync failed: ${error.message}`);
    }
  }
}

module.exports = new SyncService();
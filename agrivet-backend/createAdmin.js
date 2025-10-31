// testSync.js - TEST SYNC ENDPOINTS
const axios = require('axios');

async function testSync() {
  console.log('🔄 TESTING SYNC ENDPOINTS\n');

  const baseURL = 'https://agrivet.up.railway.app';

  try {
    // Test 1: Check if USSD endpoints are accessible
    console.log('1. Testing USSD endpoints...');
    try {
      const ussdResponse = await axios.get('https://agrivet-ussd.onrender.com/api/farmers/sync', {
        timeout: 10000
      });
      console.log('   ✅ USSD farmers endpoint:', ussdResponse.data);
    } catch (ussdError) {
      console.log('   ❌ USSD farmers endpoint error:', ussdError.message);
    }

    try {
      const ussdRequests = await axios.get('https://agrivet-ussd.onrender.com/api/service-requests/sync', {
        timeout: 10000
      });
      console.log('   ✅ USSD requests endpoint:', ussdRequests.data);
    } catch (ussdError) {
      console.log('   ❌ USSD requests endpoint error:', ussdError.message);
    }

    // Test 2: Test the sync endpoint
    console.log('\n2. Testing sync endpoint...');
    const syncResponse = await axios.get(`${baseURL}/api/test-sync`);
    console.log('   ✅ Sync endpoint response:', syncResponse.data);

    // Test 3: Check sync status
    console.log('\n3. Checking sync status...');
    const statusResponse = await axios.get(`${baseURL}/api/sync/status`);
    console.log('   ✅ Sync status:', statusResponse.data);

  } catch (error) {
    console.error('❌ Sync test failed:', error.message);
  }
}

testSync();
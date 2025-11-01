// testDatabaseStructure.js - CHECK DATABASE STRUCTURE AND DATA
const axios = require('axios');

async function testDatabaseStructure() {
  console.log('🔍 CHECKING DATABASE STRUCTURE AND DATA\n');

  const ussdBaseURL = 'https://agrivet-ussd.onrender.com';
  const webBaseURL = 'https://agrivet.up.railway.app';

  try {
    // Test 1: Check USSD Farmers Table Structure
    console.log('1. 📋 CHECKING USSD FARMERS TABLE STRUCTURE...');
    try {
      const farmersResponse = await axios.get(`${ussdBaseURL}/api/farmers/sync`, {
        timeout: 10000
      });
      
      console.log('   ✅ USSD Farmers endpoint accessible');
      console.log('   📊 Total farmers:', farmersResponse.data.data.length);
      
      if (farmersResponse.data.data.length > 0) {
        const sampleFarmer = farmersResponse.data.data[0];
        console.log('   🔍 Sample farmer structure:');
        console.log('      ID:', sampleFarmer.id);
        console.log('      Phone:', sampleFarmer.phone_number);
        console.log('      Name:', sampleFarmer.name);
        console.log('      Location:', `${sampleFarmer.province}, ${sampleFarmer.district}, ${sampleFarmer.sector}, ${sampleFarmer.cell}`);
        console.log('      Created:', sampleFarmer.createdAt);
        console.log('      Updated:', sampleFarmer.updatedAt);
        console.log('   📋 All farmer fields:', Object.keys(sampleFarmer));
      } else {
        console.log('   ⚠️ No farmers found in USSD database');
      }
    } catch (error) {
      console.log('   ❌ USSD farmers endpoint error:', error.message);
    }

    // Test 2: Check USSD Service Requests Table Structure
    console.log('\n2. 📋 CHECKING USSD SERVICE REQUESTS TABLE STRUCTURE...');
    try {
      const requestsResponse = await axios.get(`${ussdBaseURL}/api/service-requests/sync`, {
        timeout: 10000
      });
      
      console.log('   ✅ USSD Service Requests endpoint accessible');
      console.log('   📊 Total service requests:', requestsResponse.data.data.length);
      
      if (requestsResponse.data.data.length > 0) {
        const sampleRequest = requestsResponse.data.data[0];
        console.log('   🔍 Sample service request structure:');
        console.log('      ID:', sampleRequest.id);
        console.log('      Service Type:', sampleRequest.service_type);
        console.log('      Description:', sampleRequest.description);
        console.log('      Status:', sampleRequest.status);
        console.log('      Farmer Phone:', sampleRequest.farmer_phone);
        console.log('      Farmer ID:', sampleRequest.farmer_id);
        console.log('      Graduate Phone:', sampleRequest.graduate_phone);
        console.log('      Location:', `${sampleRequest.province}, ${sampleRequest.district}, ${sampleRequest.sector}, ${sampleRequest.cell}`);
        console.log('      Created:', sampleRequest.created_at);
        console.log('      Updated:', sampleRequest.updated_at);
        console.log('   📋 All service request fields:', Object.keys(sampleRequest));
        
        // Check if farmer_phone is null for all requests
        const requestsWithPhone = requestsResponse.data.data.filter(req => req.farmer_phone);
        const requestsWithoutPhone = requestsResponse.data.data.filter(req => !req.farmer_phone);
        console.log(`   📊 Farmer Phone Stats: ${requestsWithPhone.length} with phone, ${requestsWithoutPhone.length} without phone`);
        
        // Check service_type availability
        const requestsWithServiceType = requestsResponse.data.data.filter(req => req.service_type);
        const requestsWithoutServiceType = requestsResponse.data.data.filter(req => !req.service_type);
        console.log(`   📊 Service Type Stats: ${requestsWithServiceType.length} with type, ${requestsWithoutServiceType.length} without type`);
      } else {
        console.log('   ⚠️ No service requests found in USSD database');
      }
    } catch (error) {
      console.log('   ❌ USSD service requests endpoint error:', error.message);
    }

    // Test 3: Check USSD Graduates Table Structure
    console.log('\n3. 📋 CHECKING USSD GRADUATES TABLE STRUCTURE...');
    try {
      const graduatesResponse = await axios.get(`${ussdBaseURL}/api/graduates/sync`, {
        timeout: 10000
      });
      
      console.log('   ✅ USSD Graduates endpoint accessible');
      console.log('   📊 Total graduates:', graduatesResponse.data.data.length);
      
      if (graduatesResponse.data.data.length > 0) {
        const sampleGraduate = graduatesResponse.data.data[0];
        console.log('   🔍 Sample graduate structure:');
        console.log('      ID:', sampleGraduate.id);
        console.log('      Phone:', sampleGraduate.phone_number);
        console.log('      Name:', sampleGraduate.name);
        console.log('      Expertise:', sampleGraduate.expertise);
        console.log('      Location:', `${sampleGraduate.province}, ${sampleGraduate.district}, ${sampleGraduate.sector}, ${sampleGraduate.cell}`);
        console.log('   📋 All graduate fields:', Object.keys(sampleGraduate));
      } else {
        console.log('   ⚠️ No graduates found in USSD database');
      }
    } catch (error) {
      console.log('   ❌ USSD graduates endpoint error:', error.message);
    }

    // Test 4: Check Web Database Status
    console.log('\n4. 📋 CHECKING WEB DATABASE STATUS...');
    try {
      const statusResponse = await axios.get(`${webBaseURL}/api/sync/status`, {
        timeout: 10000
      });
      
      console.log('   ✅ Web sync status endpoint accessible');
      console.log('   📊 Web Database Stats:');
      console.log('      Total Farmers:', statusResponse.data.data.farmers);
      console.log('      USSD Farmers:', statusResponse.data.data.ussdFarmers);
      console.log('      Total Service Requests:', statusResponse.data.data.serviceRequests);
      console.log('      USSD Service Requests:', statusResponse.data.data.ussdServiceRequests);
    } catch (error) {
      console.log('   ❌ Web sync status endpoint error:', error.message);
    }

    // Test 5: Debug USSD Service Request Data
    console.log('\n5. 🐛 DEBUGGING USSD SERVICE REQUEST DATA...');
    try {
      // Try to access a debug endpoint if it exists
      const debugResponse = await axios.get(`${ussdBaseURL}/api/debug/service-requests`, {
        timeout: 10000
      });
      console.log('   ✅ Debug endpoint response:', debugResponse.data);
    } catch (error) {
      console.log('   ⚠️ Debug endpoint not available:', error.message);
    }

    // Test 6: Check Database Schema (if possible)
    console.log('\n6. 🗄️ CHECKING DATABASE SCHEMA INFO...');
    console.log('   ℹ️ To check exact database schema, you may need to:');
    console.log('      - Check your USSD models definition');
    console.log('      - Check database migration files');
    console.log('      - Use database client to inspect tables directly');

  } catch (error) {
    console.error('❌ Database structure test failed:', error.message);
  }

  console.log('\n📋 SUMMARY OF ISSUES TO FIX:');
  console.log('   1. Farmer phone numbers in service requests');
  console.log('   2. Service types in service requests'); 
  console.log('   3. Database column structure alignment');
}

testDatabaseStructure();
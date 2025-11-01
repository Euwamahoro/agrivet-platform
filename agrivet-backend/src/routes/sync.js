// src/routes/sync.js - COMPLETE UPDATED VERSION WITH LOGGING
const express = require('express');
const Farmer = require('../models/Farmer');
const ServiceRequest = require('../models/serviceRequest');
const Graduate = require('../models/Graduate');

const router = express.Router();

// Sync farmers from USSD to Web
router.post('/farmers/sync', async (req, res) => {
  try {
    const { farmers } = req.body;
    
    console.log(`\n🔄 ===== SYNC ROUTE: FARMERS SYNC STARTED =====`);
    console.log(`📥 Received ${farmers?.length || 0} farmers from USSD`);
    console.log('📋 Request body structure:', {
      hasFarmers: !!farmers,
      farmersType: Array.isArray(farmers) ? 'array' : typeof farmers,
      farmersLength: farmers?.length || 0
    });

    if (!farmers || farmers.length === 0) {
      console.log('❌ No farmers data received in request body');
      return res.json({ 
        success: true, 
        message: 'No farmers to sync',
        data: [] 
      });
    }

    console.log('👥 First farmer in request:', farmers[0]);

    const syncedFarmers = await Promise.all(
      farmers.map(async (farmerData, index) => {
        try {
          console.log(`\n🔄 Processing farmer ${index + 1}/${farmers.length}:`, {
            id: farmerData.id,
            phone: farmerData.phone_number,
            name: farmerData.name
          });

          // Check if farmer already exists by ussdId or phone
          const existingFarmer = await Farmer.findOne({
            $or: [
              { ussdId: farmerData.id },
              { phone: farmerData.phone_number }
            ]
          });

          if (existingFarmer) {
            console.log(`✅ Farmer already exists: ${existingFarmer.name} (${existingFarmer.phone})`);
            return existingFarmer;
          }

          // Create new farmer with USSD data
          const farmer = new Farmer({
            phone: farmerData.phone_number,
            name: farmerData.name,
            province: farmerData.province,
            district: farmerData.district,
            sector: farmerData.sector,
            cell: farmerData.cell,
            locationText: `${farmerData.province}, ${farmerData.district}, ${farmerData.sector}, ${farmerData.cell}`,
            ussdId: farmerData.id,
            totalRequests: 0,
            completedRequests: 0
          });

          await farmer.save();
          console.log(`🎉 Farmer created successfully: ${farmer.name} (${farmer.phone})`);
          console.log(`📝 MongoDB ID: ${farmer._id}, USSD ID: ${farmer.ussdId}`);
          return farmer;
        } catch (error) {
          console.error(`❌ Failed to sync farmer ${farmerData.phone_number}:`, error.message);
          console.error('🔧 Farmer sync error details:', error);
          return null;
        }
      })
    );

    const successfulSyncs = syncedFarmers.filter(farmer => farmer !== null);
    console.log(`\n📊 Farmer sync summary:`);
    console.log(`   Total received: ${farmers.length}`);
    console.log(`   Successfully synced: ${successfulSyncs.length}`);
    console.log(`   Failed: ${farmers.length - successfulSyncs.length}`);

    res.json({
      success: true,
      message: `Synced ${successfulSyncs.length} farmers from USSD`,
      data: successfulSyncs
    });
  } catch (error) {
    console.error('❌ Error syncing farmers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to sync farmers from USSD' 
    });
  }
});

// Sync service requests from USSD to Web
router.post('/service-requests/sync', async (req, res) => {
  try {
    const { serviceRequests } = req.body;
    
    console.log(`\n🔄 ===== SYNC ROUTE: SERVICE REQUESTS SYNC STARTED =====`);
    console.log(`📥 Received ${serviceRequests?.length || 0} service requests from USSD`);
    console.log('📋 Request body structure:', {
      hasServiceRequests: !!serviceRequests,
      serviceRequestsType: Array.isArray(serviceRequests) ? 'array' : typeof serviceRequests,
      serviceRequestsLength: serviceRequests?.length || 0
    });

    if (!serviceRequests || serviceRequests.length === 0) {
      console.log('❌ No service requests data received in request body');
      return res.json({ 
        success: true, 
        message: 'No service requests to sync',
        data: [] 
      });
    }

    console.log('📋 First service request in request:', serviceRequests[0]);

    const syncedRequests = await Promise.all(
      serviceRequests.map(async (requestData, index) => {
        try {
          console.log(`\n🔄 Processing service request ${index + 1}/${serviceRequests.length}:`, {
            id: requestData.id,
            service_type: requestData.service_type,
            status: requestData.status
          });

          // Check if request already exists
          const existingRequest = await ServiceRequest.findOne({ ussdId: requestData.id });
          if (existingRequest) {
            console.log(`✅ Service request already exists: ${existingRequest._id}`);
            return existingRequest;
          }

          // Find the corresponding farmer in MongoDB by ussdId or phone
          let farmer = await Farmer.findOne({ 
            $or: [
              { ussdId: requestData.farmer_id },
              { phone: requestData.farmer_phone }
            ]
          });

          if (!farmer) {
            console.warn(`❌ No matching farmer found for USSD ID: ${requestData.farmer_id} or phone: ${requestData.farmer_phone}`);
            
            // Try to create a placeholder farmer if none exists
            if (requestData.farmer_phone) {
              console.log(`🔄 Creating placeholder farmer for phone: ${requestData.farmer_phone}`);
              farmer = new Farmer({
                phone: requestData.farmer_phone,
                name: 'Farmer from USSD',
                province: requestData.province || 'Unknown',
                district: requestData.district || 'Unknown',
                sector: requestData.sector || 'Unknown',
                cell: requestData.cell || 'Unknown',
                locationText: `${requestData.province}, ${requestData.district}, ${requestData.sector}, ${requestData.cell}`,
                ussdId: requestData.farmer_id,
                totalRequests: 1,
                completedRequests: 0
              });
              await farmer.save();
              console.log(`✅ Created placeholder farmer: ${farmer._id}`);
            } else {
              console.log('❌ Cannot create farmer - no phone number provided');
              return null;
            }
          }

          console.log(`✅ Found farmer: ${farmer.name} (${farmer.phone})`);

          // Find graduate if assigned
          let graduate = null;
          if (requestData.graduate_phone) {
            graduate = await Graduate.findOne({ 
              phoneNumber: requestData.graduate_phone 
            });
            if (graduate) {
              console.log(`✅ Found graduate: ${graduate.name}`);
            } else {
              console.warn(`⚠️ No graduate found for phone: ${requestData.graduate_phone}`);
            }
          }

          // Create service request in MongoDB
          const request = new ServiceRequest({
            farmer: farmer._id,
            graduate: graduate ? graduate._id : undefined,
            serviceType: requestData.service_type,
            description: requestData.description,
            status: requestData.status === 'no_match' ? 'pending' : requestData.status,
            location: {
              province: requestData.province,
              district: requestData.district,
              sector: requestData.sector,
              cell: requestData.cell
            },
            ussdId: requestData.id,
            assignedAt: requestData.assigned_at,
            createdAt: requestData.created_at,
            updatedAt: requestData.updated_at
          });

          await request.save();
          console.log(`🎉 Service request created successfully: ${request._id}`);
          console.log(`📝 MongoDB ID: ${request._id}, USSD ID: ${request.ussdId}, Status: ${request.status}`);
          return request;
        } catch (error) {
          console.error(`❌ Failed to sync service request ${requestData.id}:`, error.message);
          console.error('🔧 Request sync error details:', error);
          return null;
        }
      })
    );

    // Filter out failed syncs
    const successfulSyncs = syncedRequests.filter(req => req !== null);
    console.log(`\n📊 Service request sync summary:`);
    console.log(`   Total received: ${serviceRequests.length}`);
    console.log(`   Successfully synced: ${successfulSyncs.length}`);
    console.log(`   Failed: ${serviceRequests.length - successfulSyncs.length}`);

    res.json({
      success: true,
      message: `Synced ${successfulSyncs.length} service requests from USSD`,
      data: successfulSyncs
    });
  } catch (error) {
    console.error('❌ Error syncing service requests:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to sync service requests from USSD' 
    });
  }
});

// Get sync status (for debugging)
router.get('/status', async (req, res) => {
  try {
    const farmerCount = await Farmer.countDocuments();
    const serviceRequestCount = await ServiceRequest.countDocuments();
    const ussdServiceRequestCount = await ServiceRequest.countDocuments({ ussdId: { $exists: true } });
    const ussdFarmerCount = await Farmer.countDocuments({ ussdId: { $exists: true } });

    console.log(`\n📊 ===== SYNC STATUS CHECK =====`);
    console.log(`   Total Farmers: ${farmerCount}`);
    console.log(`   USSD Farmers: ${ussdFarmerCount}`);
    console.log(`   Total Service Requests: ${serviceRequestCount}`);
    console.log(`   USSD Service Requests: ${ussdServiceRequestCount}`);

    res.json({
      success: true,
      data: {
        farmers: farmerCount,
        serviceRequests: serviceRequestCount,
        ussdServiceRequests: ussdServiceRequestCount,
        ussdFarmers: ussdFarmerCount
      }
    });
  } catch (error) {
    console.error('❌ Error getting sync status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get sync status' 
    });
  }
});

module.exports = router;
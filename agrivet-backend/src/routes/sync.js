// src/routes/sync.js - COMPLETE UPDATED VERSION
const express = require('express');
const Farmer = require('../models/Farmer');
const ServiceRequest = require('../models/serviceRequest');
const Graduate = require('../models/Graduate');
const router = express.Router();

// POST /api/sync/farmers - Receive farmers from USSD
router.post('/farmers', async (req, res) => {
  try {
    console.log(`\n🔄 ===== SYNC ROUTE: FARMERS SYNC STARTED =====`);
    const { farmers } = req.body;
    
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
        synced: 0
      });
    }

    console.log('📋 First farmer in request:', farmers[0]);

    let syncedCount = 0;
    const syncedFarmers = [];

    for (const farmerData of farmers) {
      try {
        console.log(`\n🔄 Processing farmer: ${farmerData.phone_number} (${farmerData.name})`);

        // Check if farmer already exists by phone number or USSD ID
        let farmer = await Farmer.findOne({ 
          $or: [
            { phone: farmerData.phone_number },
            { ussdId: farmerData.id }
          ]
        });

        if (farmer) {
          console.log(`✅ Farmer already exists: ${farmer.phone}`);
          // Update existing farmer if needed
          if (!farmer.ussdId && farmerData.id) {
            farmer.ussdId = farmerData.id;
            await farmer.save();
            console.log(`📝 Updated farmer with USSD ID: ${farmerData.id}`);
          }
          syncedFarmers.push(farmer);
          continue;
        }

        // Create new farmer
        farmer = new Farmer({
          phone: farmerData.phone_number,
          name: farmerData.name || 'Farmer from USSD',
          province: farmerData.province || 'Unknown',
          district: farmerData.district || 'Unknown',
          sector: farmerData.sector || 'Unknown',
          cell: farmerData.cell || 'Unknown',
          locationText: `${farmerData.province || 'Unknown'}, ${farmerData.district || 'Unknown'}`,
          ussdId: farmerData.id,
          totalRequests: 0,
          completedRequests: 0
        });

        await farmer.save();
        syncedCount++;
        syncedFarmers.push(farmer);
        console.log(`🎉 Created new farmer: ${farmer.phone} (${farmer._id})`);

      } catch (error) {
        console.error(`❌ Failed to sync farmer ${farmerData.phone_number}:`, error.message);
      }
    }

    console.log(`\n📊 Farmers sync summary:`);
    console.log(`   Total received: ${farmers.length}`);
    console.log(`   Newly synced: ${syncedCount}`);
    console.log(`   Already existed: ${farmers.length - syncedCount}`);

    res.json({
      success: true,
      message: `Synced ${syncedCount} farmers from USSD`,
      synced: syncedCount,
      data: syncedFarmers
    });

  } catch (error) {
    console.error('❌ Error syncing farmers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to sync farmers from USSD' 
    });
  }
});

// POST /api/sync/service-requests - Receive service requests from USSD
router.post('/service-requests', async (req, res) => {
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
            status: requestData.status,
            farmer_phone: requestData.farmer_phone // FIXED: was farmerPhone
          });

          // Check if request already exists
          const existingRequest = await ServiceRequest.findOne({ ussdId: requestData.id });
          if (existingRequest) {
            console.log(`✅ Service request already exists: ${existingRequest._id}`);
            return existingRequest;
          }

          // Find the corresponding farmer in MongoDB by phone
          let farmer = await Farmer.findOne({ 
            phone: requestData.farmer_phone 
          });

          if (!farmer) {
            console.warn(`❌ No matching farmer found for phone: ${requestData.farmer_phone}`);
            
            // Create a placeholder farmer
            console.log(`🔄 Creating placeholder farmer for phone: ${requestData.farmer_phone}`);
            farmer = new Farmer({
              phone: requestData.farmer_phone,
              name: 'Farmer from USSD',
              province: requestData.province || 'Unknown',
              district: requestData.district || 'Unknown',
              sector: requestData.sector || 'Unknown',
              cell: requestData.cell || 'Unknown',
              locationText: `${requestData.province || 'Unknown'}, ${requestData.district || 'Unknown'}`,
              totalRequests: 1,
              completedRequests: 0
            });
            await farmer.save();
            console.log(`✅ Created placeholder farmer: ${farmer._id}`);
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
            farmerPhone: requestData.farmer_phone, // FIXED: was farmerPhone
            farmerName: farmer.name,
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
            updatedAt: requestData.updated_at,
            source: 'ussd' // Mark as from USSD
          });

          await request.save();
          console.log(`🎉 Service request created successfully: ${request._id}`);
          console.log(`📝 MongoDB ID: ${request._id}, USSD ID: ${request.ussdId}, Status: ${request.status}, Farmer Phone: ${request.farmerPhone}`);
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

// GET /api/sync/status - Get sync status
router.get('/status', async (req, res) => {
  try {
    const totalFarmers = await Farmer.countDocuments();
    const totalServiceRequests = await ServiceRequest.countDocuments();
    const ussdServiceRequests = await ServiceRequest.countDocuments({ source: 'ussd' });
    
    res.json({
      success: true,
      data: {
        totalFarmers,
        totalServiceRequests,
        ussdServiceRequests,
        webServiceRequests: totalServiceRequests - ussdServiceRequests,
        lastSync: new Date().toISOString()
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
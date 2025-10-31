// src/routes/sync.js - UPDATED FOR YOUR MODEL STRUCTURE
const express = require('express');
const Farmer = require('../models/Farmer');
const ServiceRequest = require('../models/serviceRequest');
const Graduate = require('../models/Graduate');

const router = express.Router();

// Sync farmers from USSD to Web
router.post('/farmers/sync', async (req, res) => {
  try {
    const { farmers } = req.body;
    
    console.log(`🔄 DEBUG SYNC ROUTE - Farmers sync called with ${farmers?.length || 0} farmers`);
    console.log(`🔄 DEBUG SYNC ROUTE - First farmer data:`, farmers?.[0]);

    if (!farmers || farmers.length === 0) {
      console.log('❌ DEBUG SYNC ROUTE - No farmers data received');
      return res.json({ 
        success: true, 
        message: 'No farmers to sync',
        data: [] 
      });
    }

    const syncedFarmers = await Promise.all(
      farmers.map(async (farmerData) => {
        try {
          console.log(`🔄 DEBUG SYNC ROUTE - Processing farmer: ${farmerData.phone_number}`);
          console.log(`🔄 DEBUG SYNC ROUTE - Farmer data:`, farmerData);
          
          // Check if farmer already exists by ussdId or phone
          const existingFarmer = await Farmer.findOne({
            $or: [
              { ussdId: farmerData.id },
              { phone: farmerData.phone_number }
            ]
          });

          if (existingFarmer) {
            console.log(`✅ DEBUG SYNC ROUTE - Farmer already exists: ${existingFarmer.name}`);
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
          console.log(`✅ DEBUG SYNC ROUTE - Farmer created: ${farmer.name} (${farmer.phone})`);
          return farmer;
        } catch (error) {
          console.error(`❌ DEBUG SYNC ROUTE - Failed to sync farmer ${farmerData.phone_number}:`, error.message);
          console.error(`❌ DEBUG SYNC ROUTE - Farmer sync error details:`, error);
          return null;
        }
      })
    );

    const successfulSyncs = syncedFarmers.filter(farmer => farmer !== null);
    console.log(`✅ DEBUG SYNC ROUTE - Successfully synced ${successfulSyncs.length} farmers`);

    res.json({
      success: true,
      message: `Synced ${successfulSyncs.length} farmers from USSD`,
      data: successfulSyncs
    });
  } catch (error) {
    console.error('❌ DEBUG SYNC ROUTE - Error syncing farmers:', error);
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
    
    console.log(`🔄 DEBUG SYNC ROUTE - Service requests sync called with ${serviceRequests?.length || 0} requests`);
    console.log(`🔄 DEBUG SYNC ROUTE - First request data:`, serviceRequests?.[0]);

    if (!serviceRequests || serviceRequests.length === 0) {
      console.log('❌ DEBUG SYNC ROUTE - No service requests data received');
      return res.json({ 
        success: true, 
        message: 'No service requests to sync',
        data: [] 
      });
    }

    const syncedRequests = await Promise.all(
      serviceRequests.map(async (requestData) => {
        try {
          console.log(`🔄 DEBUG SYNC ROUTE - Processing request:`, requestData);
          
          // Check if request already exists
          const existingRequest = await ServiceRequest.findOne({ ussdId: requestData.id });
          if (existingRequest) {
            console.log(`✅ DEBUG SYNC ROUTE - Request already exists: ${existingRequest._id}`);
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
            console.warn(`❌ DEBUG SYNC ROUTE - No matching farmer found for USSD ID: ${requestData.farmer_id} or phone: ${requestData.farmer_phone}`);
            
            // Try to create a placeholder farmer if none exists
            if (requestData.farmer_phone) {
              console.log(`🔄 DEBUG SYNC ROUTE - Creating placeholder farmer for phone: ${requestData.farmer_phone}`);
              farmer = new Farmer({
                phone: requestData.farmer_phone,
                name: 'Farmer from USSD', // Default name
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
              console.log(`✅ DEBUG SYNC ROUTE - Created placeholder farmer: ${farmer._id}`);
            } else {
              return null;
            }
          }

          console.log(`✅ DEBUG SYNC ROUTE - Found farmer: ${farmer.name} (${farmer.phone})`);

          // Find graduate if assigned
          let graduate = null;
          if (requestData.graduate_phone) {
            graduate = await Graduate.findOne({ 
              phoneNumber: requestData.graduate_phone 
            });
            if (graduate) {
              console.log(`✅ DEBUG SYNC ROUTE - Found graduate: ${graduate.name}`);
            } else {
              console.warn(`⚠️ DEBUG SYNC ROUTE - No graduate found for phone: ${requestData.graduate_phone}`);
            }
          }

          // Create service request in MongoDB
          const request = new ServiceRequest({
            farmer: farmer._id,
            graduate: graduate ? graduate._id : undefined,
            serviceType: requestData.service_type,
            description: requestData.description,
            status: requestData.status === 'no_match' ? 'pending' : requestData.status, // Map 'no_match' to 'pending'
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
          console.log(`✅ DEBUG SYNC ROUTE - Service request created: ${request._id} (Status: ${request.status})`);
          return request;
        } catch (error) {
          console.error(`❌ DEBUG SYNC ROUTE - Failed to sync service request ${requestData.id}:`, error.message);
          console.error(`❌ DEBUG SYNC ROUTE - Request sync error details:`, error);
          return null;
        }
      })
    );

    // Filter out failed syncs
    const successfulSyncs = syncedRequests.filter(req => req !== null);
    console.log(`✅ DEBUG SYNC ROUTE - Successfully synced ${successfulSyncs.length} service requests`);

    res.json({
      success: true,
      message: `Synced ${successfulSyncs.length} service requests from USSD`,
      data: successfulSyncs
    });
  } catch (error) {
    console.error('❌ DEBUG SYNC ROUTE - Error syncing service requests:', error);
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

    console.log(`📊 DEBUG SYNC STATUS - Farmers: ${farmerCount}, USSD Farmers: ${ussdFarmerCount}`);
    console.log(`📊 DEBUG SYNC STATUS - Requests: ${serviceRequestCount}, USSD Requests: ${ussdServiceRequestCount}`);

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
    console.error('❌ DEBUG SYNC STATUS - Error getting sync status:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to get sync status' 
    });
  }
});

module.exports = router;
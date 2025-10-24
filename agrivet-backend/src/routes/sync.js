// src/routes/sync.js - UPDATED FILE
const express = require('express');
const Farmer = require('../models/Farmer');
const ServiceRequest = require('../models/serviceRequest');
const Graduate = require('../models/Graduate');

const router = express.Router();

// Sync farmers from USSD to Web - REMOVED AUTH MIDDLEWARE
router.post('/farmers/sync', async (req, res) => {
  try {
    const { farmers } = req.body;
    
    console.log(`🔄 Syncing ${farmers.length} farmers from USSD to Web`);

    // In sync.js - use this with the UPDATED Farmer model
const syncedFarmers = await Promise.all(
  farmers.map(async (farmerData) => {
    try {
      const farmer = await Farmer.findOneAndUpdate(
        { phone: farmerData.phone_number },
        {
          phone: farmerData.phone_number,
          name: farmerData.name,
          province: farmerData.province,
          district: farmerData.district,
          sector: farmerData.sector,
          cell: farmerData.cell,
          locationText: farmerData.location_text,
          ussdId: farmerData.id
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Synced farmer: ${farmer.name} (${farmer.phone})`);
      return farmer;
    } catch (error) {
      console.error(`❌ Failed to sync farmer ${farmerData.phone_number}:`, error.message);
      return null;
    }
  })
);

    // Filter out failed syncs
    const successfulSyncs = syncedFarmers.filter(farmer => farmer !== null);

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

// Sync service requests from USSD to Web - REMOVED AUTH MIDDLEWARE
router.post('/service-requests/sync', async (req, res) => {
  try {
    const { serviceRequests } = req.body;
    
    console.log(`🔄 Syncing ${serviceRequests.length} service requests from USSD to Web`);

    const syncedRequests = await Promise.all(
      serviceRequests.map(async (requestData) => {
        try {
          // Find the corresponding farmer in MongoDB by phone number
          const farmer = await Farmer.findOne({ 
            phoneNumber: requestData.farmer_phone 
          });

          if (!farmer) {
            console.warn(`❌ No matching farmer found for phone: ${requestData.farmer_phone}`);
            return null;
          }

          // Find graduate if assigned
          let graduate = null;
          if (requestData.graduate_phone) {
            graduate = await Graduate.findOne({ 
              phoneNumber: requestData.graduate_phone 
            });
          }

          // Create or update service request in MongoDB
          const request = await ServiceRequest.findOneAndUpdate(
            { ussdId: requestData.id },
            {
              farmer: farmer._id,
              graduate: graduate ? graduate._id : undefined,
              serviceType: requestData.service_type,
              description: requestData.description,
              status: requestData.status,
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
            },
            { upsert: true, new: true }
          );

          console.log(`✅ Synced service request: ${request._id} (Status: ${request.status})`);
          return request;
        } catch (error) {
          console.error(`❌ Failed to sync service request ${requestData.id}:`, error.message);
          return null;
        }
      })
    );

    // Filter out failed syncs
    const successfulSyncs = syncedRequests.filter(req => req !== null);

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

// Get sync status (for debugging) - REMOVED AUTH MIDDLEWARE
router.get('/status', async (req, res) => {
  try {
    const farmerCount = await Farmer.countDocuments();
    const serviceRequestCount = await ServiceRequest.countDocuments();
    const ussdServiceRequestCount = await ServiceRequest.countDocuments({ ussdId: { $exists: true } });

    res.json({
      success: true,
      data: {
        farmers: farmerCount,
        serviceRequests: serviceRequestCount,
        ussdServiceRequests: ussdServiceRequestCount
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
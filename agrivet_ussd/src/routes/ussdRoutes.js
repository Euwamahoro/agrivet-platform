const express = require('express');
const router = express.Router();
const ussdController = require('../controllers/ussdController');
const { Graduate, Farmer, ServiceRequest, sequelize } = require('../models');

const weatherService = require('../services/weatherService');

// The main endpoint for USSD gateway callbacks
router.post('/ussd', ussdController.handleUssdRequest);

// GET /api/graduates/sync - Get graduates for web platform
router.get('/api/graduates/sync', async (req, res) => {
  try {
    const graduates = await Graduate.findAll({
      attributes: ['id', 'phone_number', 'name', 'expertise', 'province', 'district', 'sector', 'cell', 'is_available', 'created_at']
    });
    
    res.json({
      success: true,
      data: graduates
    });
  } catch (error) {
    console.error('Error fetching graduates:', error);
    res.status(500).json({ error: 'Failed to fetch graduates' });
  }
});

// POST /api/graduates/sync - Add graduate from web platform
router.post('/api/graduates/sync', async (req, res) => {
  try {
    const { phoneNumber, name, expertise, province, district, sector, cell } = req.body;
    
    const graduate = await Graduate.create({
      phone_number: phoneNumber,
      name,
      expertise,
      province,
      district, 
      sector,
      cell,
      is_available: true,
      location: sequelize.fn('ST_GeomFromText', 'POINT(0 0)')
    });
    
    res.json({
      success: true,
      message: 'Graduate synced to USSD system',
      data: graduate
    });
  } catch (error) {
    console.error('Error syncing graduate:', error);
    res.status(500).json({ error: 'Failed to sync graduate' });
  }
});

// GET /api/farmers/sync - Get farmers for web platform
router.get('/api/farmers/sync', async (req, res) => {
  try {
    const farmers = await Farmer.findAll({
      attributes: ['id', 'phone_number', 'name', 'location_text', 'province', 'district', 'sector', 'cell', 'createdAt', 'updatedAt']
    });
    
    res.json({
      success: true,
      data: farmers
    });
  } catch (error) {
    console.error('Error fetching farmers:', error);
    res.status(500).json({ error: 'Failed to fetch farmers' });
  }
});

// UPDATED: GET /api/service-requests/sync - Get service requests for web platform
router.get('/api/service-requests/sync', async (req, res) => {
  try {
    console.log('📋 DEBUG - Fetching service requests from USSD database...');
    
    const requests = await ServiceRequest.findAll({
      include: [
        {
          model: Farmer,
          as: 'farmer',
          attributes: ['id', 'phone_number', 'province', 'district', 'sector', 'cell'],
          required: false
        },
        {
          model: Graduate, 
          as: 'graduate',
          attributes: ['id', 'phone_number', 'province', 'district', 'sector', 'cell'],
          required: false
        }
      ],
      attributes: ['id', 'service_type', 'description', 'status', 'farmer_id', 'graduate_id', 'createdAt', 'updatedAt'] // REMOVED farmerPhone from here
    });
    
    console.log(`📋 DEBUG - Found ${requests.length} service requests`);
    
    // Format response with farmer/graduate phone numbers and location
    const formattedRequests = requests.map(req => {
      console.log('🔍 DEBUG - Raw service request data:', {
        id: req.id,
        farmer_id: req.farmer_id,
        hasFarmer: !!req.farmer,
        farmerPhoneFromRelation: req.farmer?.phone_number,
        service_type: req.service_type
      });
      
      // Use location from the associated farmer (since service requests inherit farmer's location)
      const location = req.farmer || req.graduate;
      
      const formattedRequest = {
        id: req.id,
        service_type: req.service_type,
        description: req.description,
        status: req.status,
        province: location?.province || null,
        district: location?.district || null,
        sector: location?.sector || null,
        cell: location?.cell || null,
        assigned_at: req.graduate_id ? req.updatedAt : null,
        created_at: req.createdAt,
        updated_at: req.updatedAt,
        // Use farmer phone from the relation (since farmerPhone column doesn't exist yet)
        farmer_phone: req.farmer?.phone_number || null,
        graduate_phone: req.graduate?.phone_number || null,
        farmer_id: req.farmer_id // Include farmer_id for debugging
      };
      
      console.log('📤 DEBUG - Formatted service request:', {
        id: formattedRequest.id,
        farmer_phone: formattedRequest.farmer_phone,
        has_farmer_phone: !!formattedRequest.farmer_phone,
        farmer_id: formattedRequest.farmer_id
      });
      
      return formattedRequest;
    });
    
    console.log('📊 DEBUG - Sync summary:', {
      total_requests: formattedRequests.length,
      requests_with_farmer_phone: formattedRequests.filter(req => req.farmer_phone).length,
      requests_without_farmer_phone: formattedRequests.filter(req => !req.farmer_phone).length
    });
    
    res.json({
      success: true,
      data: formattedRequests
    });
  } catch (error) {
    console.error('❌ DEBUG - Error fetching service requests:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch service requests',
      details: error.message 
    });
  }
});

// UPDATED: Debug endpoint to check service request data structure
router.get('/api/debug/service-requests', async (req, res) => {
  try {
    console.log('🐛 DEBUG - Checking service request data structure...');
    
    // Get raw service request without includes to see the actual stored data
    const rawRequest = await ServiceRequest.findOne({
      attributes: ['id', 'service_type', 'description', 'status', 'farmer_id', 'graduate_id', 'createdAt', 'updatedAt'], // REMOVED farmerPhone from here
      order: [['createdAt', 'DESC']]
    });
    
    console.log('🐛 DEBUG - Raw service request structure:', {
      id: rawRequest?.id,
      farmer_id: rawRequest?.farmer_id,
      service_type: rawRequest?.service_type,
      dataValues: rawRequest?.dataValues
    });
    
    res.json({
      success: true,
      data: rawRequest
    });
  } catch (error) {
    console.error('❌ DEBUG - Error in debug endpoint:', error);
    res.status(500).json({ 
      success: false,
      error: 'Debug endpoint failed',
      details: error.message 
    });
  }
});

module.exports = router;
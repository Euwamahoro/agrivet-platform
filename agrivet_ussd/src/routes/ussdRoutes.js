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

// NEW: GET /api/farmers/sync - Get farmers for web platform
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

// NEW: GET /api/service-requests/sync - Get service requests for web platform
router.get('/api/service-requests/sync', async (req, res) => {
  try {
    console.log('📋 Fetching service requests from USSD database...');
    
    const requests = await ServiceRequest.findAll({
      include: [
        {
          model: Farmer,
          as: 'farmer',
          attributes: ['phone_number', 'province', 'district', 'sector', 'cell'],
          required: false
        },
        {
          model: Graduate, 
          as: 'graduate',
          attributes: ['phone_number', 'province', 'district', 'sector', 'cell'],
          required: false
        }
      ],
      attributes: ['id', 'service_type', 'description', 'status', 'farmer_id', 'graduate_id', 'createdAt', 'updatedAt']
    });
    
    console.log(`📋 Found ${requests.length} service requests`);
    
    // Format response with farmer/graduate phone numbers and location
    const formattedRequests = requests.map(req => {
      // Use location from the associated farmer (since service requests inherit farmer's location)
      const location = req.farmer || req.graduate;
      
      return {
        id: req.id,
        service_type: req.service_type,
        description: req.description,
        status: req.status,
        province: location?.province || null,
        district: location?.district || null,
        sector: location?.sector || null,
        cell: location?.cell || null,
        assigned_at: req.graduate_id ? req.updatedAt : null, // Use updatedAt when graduate is assigned
        created_at: req.createdAt,
        updated_at: req.updatedAt,
        farmer_phone: req.farmer?.phone_number || null,
        graduate_phone: req.graduate?.phone_number || null
      }
    });
    
    res.json({
      success: true,
      data: formattedRequests
    });
  } catch (error) {
    console.error('❌ Error fetching service requests:', error);
    res.status(500).json({ 
      error: 'Failed to fetch service requests',
      details: error.message 
    });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const ussdController = require('../controllers/ussdController');
const { Graduate, Farmer, ServiceRequest, sequelize } = require('../models');

const weatherService = require('../services/weatherService');

// The main endpoint for USSD gateway callbacks
router.post('/ussd', ussdController.handleUssdRequest);

// ===== DEBUG ENDPOINTS =====

// Debug endpoint to check farmers associated with service requests
router.get('/api/debug/farmers-with-requests', async (req, res) => {
  try {
    console.log('🐛 DEBUG - Checking farmers associated with service requests...');
    
    const requestsWithFarmers = await ServiceRequest.findAll({
      include: [{
        model: Farmer,
        as: 'farmer',
        attributes: ['id', 'phone_number', 'name', 'province', 'district', 'sector', 'cell']
      }],
      limit: 10
    });
    
    const detailedInfo = requestsWithFarmers.map(req => ({
      request_id: req.id,
      farmer_id: req.farmer_id,
      farmer_exists: !!req.farmer,
      farmer_phone: req.farmer?.phone_number,
      farmer_name: req.farmer?.name,
      farmer_location: req.farmer ? `${req.farmer.province}, ${req.farmer.district}` : 'No farmer'
    }));
    
    console.log('🐛 DEBUG - Farmers with requests:', detailedInfo);
    
    res.json({
      success: true,
      data: detailedInfo
    });
  } catch (error) {
    console.error('❌ DEBUG - Error checking farmers:', error);
    res.status(500).json({ 
      success: false,
      error: 'Debug endpoint failed' 
    });
  }
});

// Debug endpoint to check database structure
router.get('/api/debug/database-structure', async (req, res) => {
  try {
    console.log('🐛 DEBUG - Checking database structure...');
    
    // Check service_requests table structure
    const serviceRequestColumns = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'service_requests'
    `);
    
    // Check farmers table structure  
    const farmerColumns = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'farmers'
    `);
    
    // Check actual data in service_requests
    const serviceRequestsData = await sequelize.query(`
      SELECT id, service_type, farmer_phone, farmer_id, description, status
      FROM service_requests 
      LIMIT 5
    `);
    
    // Check actual data in farmers
    const farmersData = await sequelize.query(`
      SELECT id, phone_number, name 
      FROM farmers 
      LIMIT 5
    `);
    
    console.log('🐛 DEBUG - Service Requests Columns:', serviceRequestColumns[0]);
    console.log('🐛 DEBUG - Farmers Columns:', farmerColumns[0]);
    console.log('🐛 DEBUG - Service Requests Data:', serviceRequestsData[0]);
    console.log('🐛 DEBUG - Farmers Data:', farmersData[0]);
    
    res.json({
      success: true,
      service_requests_columns: serviceRequestColumns[0],
      farmers_columns: farmerColumns[0],
      service_requests_data: serviceRequestsData[0],
      farmers_data: farmersData[0]
    });
  } catch (error) {
    console.error('❌ DEBUG - Error checking database:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug endpoint for detailed service request analysis
router.get('/api/debug/service-requests-detailed', async (req, res) => {
  try {
    console.log('🐛 DEBUG - Detailed service request analysis...');
    
    const requests = await ServiceRequest.findAll({
      include: [{
        model: Farmer,
        as: 'farmer',
        attributes: ['id', 'phone_number', 'name']
      }],
      raw: true,
      nest: true
    });
    
    console.log('🐛 DEBUG - Raw database data:', JSON.stringify(requests, null, 2));
    
    const farmers = await Farmer.findAll({
      attributes: ['id', 'phone_number', 'name'],
      limit: 5,
      raw: true
    });
    
    console.log('🐛 DEBUG - Farmer table sample:', JSON.stringify(farmers, null, 2));
    
    res.json({
      success: true,
      service_requests: requests,
      farmers_sample: farmers
    });
  } catch (error) {
    console.error('❌ DEBUG - Error in detailed analysis:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== FIX ENDPOINTS =====

// Fix missing service types in existing records
router.post('/api/fix-missing-service-types', async (req, res) => {
  try {
    console.log('🔧 DEBUG - Fixing missing service types...');
    
    const [updatedCount] = await ServiceRequest.update({
      service_type: 'agronomy'
    }, {
      where: {
        service_type: null
      }
    });
    
    console.log(`🔧 DEBUG - Fixed ${updatedCount} service requests`);
    
    res.json({
      success: true,
      fixed_count: updatedCount,
      message: 'Missing service types fixed'
    });
  } catch (error) {
    console.error('❌ DEBUG - Error fixing service types:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fix existing service requests with farmer phones and service types
router.post('/api/fix-existing-requests', async (req, res) => {
  try {
    console.log('🔧 Fixing existing service requests...');
    
    const serviceRequests = await ServiceRequest.findAll({
      include: [{
        model: Farmer,
        as: 'farmer'
      }]
    });
    
    let fixedCount = 0;
    
    for (const request of serviceRequests) {
      let needsUpdate = false;
      
      // Fix missing farmerPhone
      if (!request.farmerPhone && request.farmer && request.farmer.phone_number) {
        request.farmerPhone = request.farmer.phone_number;
        needsUpdate = true;
        console.log(`🔧 Fixed farmer phone for request ${request.id}: ${request.farmer.phone_number}`);
      }
      
      // Fix missing serviceType
      if (!request.serviceType) {
        request.serviceType = 'agronomy';
        needsUpdate = true;
        console.log(`🔧 Fixed service type for request ${request.id}`);
      }
      
      if (needsUpdate) {
        await request.save();
        fixedCount++;
      }
    }
    
    console.log(`🔧 Fixed ${fixedCount} service requests`);
    
    res.json({
      success: true,
      fixed_count: fixedCount,
      message: `Fixed ${fixedCount} service requests`
    });
  } catch (error) {
    console.error('❌ Error fixing existing requests:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== SYNC ENDPOINTS =====

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
        }
      ],
      attributes: ['id', 'service_type', 'description', 'status', 'farmer_id', 'farmer_phone', 'graduate_id', 'createdAt', 'updatedAt'] // ADDED farmer_phone
    });
    
    console.log(`📋 DEBUG - Found ${requests.length} service requests`);
    
    // Get ALL farmers as backup to ensure we have phone numbers
    const allFarmers = await Farmer.findAll({
      attributes: ['id', 'phone_number', 'province', 'district', 'sector', 'cell']
    });
    
    const farmerMap = new Map();
    allFarmers.forEach(farmer => {
      farmerMap.set(farmer.id, farmer);
    });
    
    // Format response with guaranteed farmer data
    const formattedRequests = requests.map(req => {
      // Try multiple sources for farmer phone
      const farmerPhone = 
        req.farmer_phone || // First try the stored farmer_phone
        req.farmer?.phone_number || // Then try the associated farmer
        (farmerMap.get(req.farmer_id)?.phone_number) || // Then try our farmer map
        null;
      
      // Use location from the associated farmer
      const location = req.farmer || farmerMap.get(req.farmer_id);
      
      const formattedRequest = {
        id: req.id,
        farmer_id: req.farmer_id,
        farmer_phone: farmerPhone,
        service_type: req.service_type || 'agronomy', // Fallback for service type
        description: req.description,
        status: req.status,
        province: location?.province || null,
        district: location?.district || null,
        sector: location?.sector || null,
        cell: location?.cell || null,
        assigned_at: req.graduate_id ? req.updatedAt : null,
        created_at: req.createdAt,
        updated_at: req.updatedAt
      };
      
      console.log('📤 DEBUG - Formatted service request:', {
        id: formattedRequest.id,
        farmer_phone: formattedRequest.farmer_phone,
        service_type: formattedRequest.service_type,
        has_farmer_phone: !!formattedRequest.farmer_phone
      });
      
      return formattedRequest;
    });
    
    console.log('📊 DEBUG - Final sync summary:', {
      total_requests: formattedRequests.length,
      requests_with_farmer_phone: formattedRequests.filter(req => req.farmer_phone).length,
      requests_without_farmer_phone: formattedRequests.filter(req => !req.farmer_phone).length,
      requests_with_service_type: formattedRequests.filter(req => req.service_type).length
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

// Debug endpoint to check service request data structure
router.get('/api/debug/service-requests', async (req, res) => {
  try {
    console.log('🐛 DEBUG - Checking service request data structure...');
    
    const rawRequest = await ServiceRequest.findOne({
      attributes: ['id', 'service_type', 'farmer_phone', 'description', 'status', 'farmer_id', 'graduate_id', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });
    
    console.log('🐛 DEBUG - Raw service request structure:', {
      id: rawRequest?.id,
      farmer_id: rawRequest?.farmer_id,
      farmer_phone: rawRequest?.farmer_phone,
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
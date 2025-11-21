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
    const [serviceRequestColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'service_requests'
    `);
    
    // Check farmers table structure  
    const [farmerColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'farmers'
    `);
    
    // Check actual data in service_requests
    const [serviceRequestsData] = await sequelize.query(`
      SELECT id, service_type, farmer_phone, farmer_id, description, status
      FROM service_requests 
      LIMIT 5
    `);
    
    // Check actual data in farmers
    const [farmersData] = await sequelize.query(`
      SELECT id, phone_number, name 
      FROM farmers 
      LIMIT 5
    `);
    
    console.log('🐛 DEBUG - Service Requests Columns:', serviceRequestColumns);
    console.log('🐛 DEBUG - Farmers Columns:', farmerColumns);
    console.log('🐛 DEBUG - Service Requests Data:', serviceRequestsData);
    console.log('🐛 DEBUG - Farmers Data:', farmersData);
    
    res.json({
      success: true,
      service_requests_columns: serviceRequestColumns,
      farmers_columns: farmerColumns,
      service_requests_data: serviceRequestsData,
      farmers_data: farmersData
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

// Fix farmer_phone for all service requests using SQL (more reliable)
router.post('/api/fix-farmer-phones-sql', async (req, res) => {
  try {
    console.log('🔧 Fixing farmer phones using SQL...');
    
    const [result] = await sequelize.query(`
      UPDATE service_requests 
      SET farmer_phone = farmers.phone_number
      FROM farmers 
      WHERE service_requests.farmer_id = farmers.id 
      AND service_requests.farmer_phone IS NULL
    `);
    
    console.log(`🔧 Fixed farmer phones for ${result} service requests`);
    
    // Verify the fix
    const [verification] = await sequelize.query(`
      SELECT COUNT(*) as total, 
             COUNT(farmer_phone) as with_phone,
             COUNT(*) - COUNT(farmer_phone) as without_phone
      FROM service_requests
    `);
    
    res.json({
      success: true,
      fixed_count: result,
      verification: verification[0],
      message: `Fixed farmer phones for ${result} service requests`
    });
  } catch (error) {
    console.error('❌ Error fixing farmer phones:', error);
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
      // ✅ CRITICAL FIX: Include farmer_phone in attributes
      attributes: ['id', 'service_type', 'farmer_phone', 'description', 'status', 'farmer_id', 'graduate_id', 'createdAt', 'updatedAt']
    });
    
    console.log(`📋 DEBUG - Found ${requests.length} service requests`);
    
    // Debug each request to see what data we're getting
    requests.forEach((req, index) => {
      console.log(`🔍 DEBUG [${index + 1}/${requests.length}]:`, {
        id: req.id,
        service_type: req.service_type,
        farmer_phone: req.farmer_phone, // This should now show the actual phone!
        farmer_id: req.farmer_id,
        has_farmer_phone: !!req.farmer_phone
      });
    });
    
    // Format response - SIMPLIFIED and more reliable
    const formattedRequests = requests.map(req => {
      const formattedRequest = {
        id: req.id,
        farmer_id: req.farmer_id,
        farmer_phone: req.farmer_phone, // Direct from the database column
        service_type: req.service_type,
        description: req.description,
        status: req.status,
        province: req.farmer?.province || null,
        district: req.farmer?.district || null,
        sector: req.farmer?.sector || null,
        cell: req.farmer?.cell || null,
        assigned_at: req.graduate_id ? req.updatedAt : null,
        created_at: req.createdAt,
        updated_at: req.updatedAt
      };
      
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

// Quick health check for service requests
router.get('/api/debug/service-requests-health', async (req, res) => {
  try {
    const [health] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_requests,
        COUNT(farmer_phone) as requests_with_phone,
        COUNT(service_type) as requests_with_service_type,
        COUNT(*) - COUNT(farmer_phone) as missing_phones,
        COUNT(*) - COUNT(service_type) as missing_service_types
      FROM service_requests
    `);
    
    console.log('🏥 DEBUG - Service Requests Health:', health[0]);
    
    res.json({
      success: true,
      data: health[0]
    });
  } catch (error) {
    console.error('❌ DEBUG - Error in health check:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router(); // ✅ Use router here
const ussdController = require('../controllers/ussdController');
const { Graduate, sequelize } = require('../models'); // Add this import

// The main endpoint for USSD gateway callbacks
router.post('/ussd', ussdController.handleUssdRequest);

// GET /api/graduates/sync - Get graduates for web platform
router.get('/api/graduates/sync', async (req, res) => { // ✅ Changed app to router
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
router.post('/api/graduates/sync', async (req, res) => { // ✅ Changed app to router
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

module.exports = router;
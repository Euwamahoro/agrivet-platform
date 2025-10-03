const express = require('express');
const router = express.Router();
const ussdController = require('../controllers/ussdController');

// The main endpoint for USSD gateway callbacks
router.post('/ussd', ussdController.handleUssdRequest);

module.exports = router;
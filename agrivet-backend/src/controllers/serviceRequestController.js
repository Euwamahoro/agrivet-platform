// src/controllers/serviceRequestController.js
const ServiceRequest = require('../models/serviceRequest');
const Graduate = require('../models/Graduate');
const Farmer = require('../models/Farmer');

exports.getAvailableRequests = async (req, res) => {
  try {
    console.log('🔍 === GET AVAILABLE REQUESTS START ===');
    console.log('📥 Query params:', req.query);
    
    const { serviceType, location } = req.query;
    
    let filter = { 
      status: 'pending',
      graduate: null 
    };
    
    if (serviceType) {
      filter.serviceType = serviceType;
    }
    
    if (location) {
      filter['location.district'] = new RegExp(location, 'i');
    }

    console.log('🔎 Filter being used:', JSON.stringify(filter, null, 2));

    const requests = await ServiceRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`📊 Found ${requests.length} requests`);
    
    // Log each request in detail
    requests.forEach((request, index) => {
      console.log(`\n📋 Request ${index + 1}:`);
      console.log('  _id:', request._id);
      console.log('  id field exists?', request.id ? 'YES' : 'NO');
      console.log('  farmer (ObjectId):', request.farmer);
      console.log('  farmerName:', request.farmerName);
      console.log('  farmerPhone:', request.farmerPhone);
      console.log('  serviceType:', request.serviceType);
      console.log('  description:', request.description?.substring(0, 50));
      console.log('  location:', JSON.stringify(request.location));
      console.log('  status:', request.status);
      console.log('  createdAt:', request.createdAt);
    });

    console.log('\n📤 Sending response with', requests.length, 'requests');
    console.log('🔍 === GET AVAILABLE REQUESTS END ===\n');

    res.json(requests);
  } catch (error) {
    console.error('❌ Get available requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    console.log('🔍 === ACCEPT REQUEST START ===');
    console.log('📥 Request ID:', req.params.requestId);
    
    const { requestId } = req.params;
    
    // Find the graduate
    const graduate = await Graduate.findOne({ user: req.user._id });
    if (!graduate) {
      console.error('❌ Graduate profile not found for user:', req.user._id);
      return res.status(404).json({ error: 'Graduate profile not found' });
    }
    
    console.log('✅ Graduate found:', graduate._id);
    console.log('✅ Graduate available?', graduate.isAvailable);
    
    if (!graduate.isAvailable) {
      console.error('❌ Graduate is not available');
      return res.status(400).json({ error: 'You must be available to accept requests' });
    }

    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      console.error('❌ Service request not found:', requestId);
      return res.status(404).json({ error: 'Service request not found' });
    }

    console.log('✅ Request found:', {
      _id: request._id,
      status: request.status,
      graduate: request.graduate,
      farmerName: request.farmerName,
      farmerPhone: request.farmerPhone
    });

    if (request.status !== 'pending' || request.graduate) {
      console.error('❌ Request is no longer available:', {
        status: request.status,
        graduate: request.graduate
      });
      return res.status(400).json({ error: 'Request is no longer available' });
    }

    // Update request
    request.graduate = graduate._id;
    request.status = 'assigned';
    request.assignedAt = new Date();
    
    await request.save();
    
    console.log('✅ Request updated and saved');
    console.log('📤 Sending response');
    console.log('🔍 === ACCEPT REQUEST END ===\n');

    res.json(request);
  } catch (error) {
    console.error('❌ Accept request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, notes } = req.body;

    const request = await ServiceRequest.findOne({
      _id: requestId,
      graduate: await Graduate.findOne({ user: req.user._id })
    });

    if (!request) {
      return res.status(404).json({ error: 'Service request not found or access denied' });
    }

    // Validate status transition
    const validTransitions = {
      assigned: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };

    if (!validTransitions[request.status]?.includes(status)) {
      return res.status(400).json({ error: 'Invalid status transition' });
    }

    // Update request
    request.status = status;
    
    if (notes) {
      request.serviceNotes = notes;
    }

    if (status === 'in_progress') {
      request.startedAt = new Date();
    } else if (status === 'completed') {
      request.completedAt = new Date();
      
      // Update graduate stats
      await Graduate.findByIdAndUpdate(request.graduate, {
        $inc: { totalServices: 1, completedServices: 1 }
      });
    }

    await request.save();

    res.json(request);
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getMyAssignments = async (req, res) => {
  try {
    const graduate = await Graduate.findOne({ user: req.user._id });
    if (!graduate) {
      return res.status(404).json({ error: 'Graduate profile not found' });
    }

    const requests = await ServiceRequest.find({ graduate: graduate._id })
      .sort({ updatedAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get my assignments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
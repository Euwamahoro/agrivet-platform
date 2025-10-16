// src/controllers/serviceRequestController.js
const ServiceRequest = require('../models/serviceRequest');
const Graduate = require('../models/Graduate');
const Farmer = require('../models/Farmer');

exports.getAvailableRequests = async (req, res) => {
  try {
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

    const requests = await ServiceRequest.find(filter)
      .populate('farmer', 'province district sector cell')
      .populate('farmer.user', 'name phoneNumber')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(requests);
  } catch (error) {
    console.error('Get available requests error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Find the graduate
    const graduate = await Graduate.findOne({ user: req.user._id });
    if (!graduate) {
      return res.status(404).json({ error: 'Graduate profile not found' });
    }
    
    if (!graduate.isAvailable) {
      return res.status(400).json({ error: 'You must be available to accept requests' });
    }

    const request = await ServiceRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: 'Service request not found' });
    }

    if (request.status !== 'pending' || request.graduate) {
      return res.status(400).json({ error: 'Request is no longer available' });
    }

    // Update request
    request.graduate = graduate._id;
    request.status = 'assigned';
    request.assignedAt = new Date();
    
    await request.save();

    // Populate response data
    await request.populate('farmer', 'province district sector cell');
    await request.populate('farmer.user', 'name phoneNumber');
    await request.populate('graduate');

    res.json(request);
  } catch (error) {
    console.error('Accept request error:', error);
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

    // Populate response data
    await request.populate('farmer', 'province district sector cell');
    await request.populate('farmer.user', 'name phoneNumber');
    await request.populate('graduate');

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
      .populate('farmer', 'province district sector cell')
      .populate('farmer.user', 'name phoneNumber')
      .sort({ updatedAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Get my assignments error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
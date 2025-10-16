// src/controllers/graduateController.js
const Graduate = require('../models/Graduate');
const User = require('../models/User');

exports.getGraduateProfile = async (req, res) => {
  try {
    const graduate = await Graduate.findOne({ user: req.user._id })
      .populate('user', 'name phoneNumber email');
    
    if (!graduate) {
      return res.status(404).json({ error: 'Graduate profile not found' });
    }

    res.json(graduate);
  } catch (error) {
    console.error('Get graduate profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateGraduateProfile = async (req, res) => {
  try {
    const {
      name,
      email,
      specialization,
      province,
      district,
      sector,
      cell,
      qualifications,
      experience
    } = req.body;

    // Update user information
    if (name || email) {
      await User.findByIdAndUpdate(req.user._id, {
        ...(name && { name }),
        ...(email && { email })
      });
    }

    // Update graduate profile
    const graduate = await Graduate.findOneAndUpdate(
      { user: req.user._id },
      {
        ...(specialization && { specialization }),
        ...(province && { province }),
        ...(district && { district }),
        ...(sector && { sector }),
        ...(cell && { cell }),
        ...(qualifications && { qualifications: Array.isArray(qualifications) ? qualifications : [qualifications] }),
        ...(experience && { experience: parseInt(experience) })
      },
      { new: true, runValidators: true }
    ).populate('user', 'name phoneNumber email');

    if (!graduate) {
      return res.status(404).json({ error: 'Graduate profile not found' });
    }

    res.json(graduate);
  } catch (error) {
    console.error('Update graduate profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateAvailability = async (req, res) => {
  try {
    const { isAvailable } = req.body;

    const graduate = await Graduate.findOneAndUpdate(
      { user: req.user._id },
      { isAvailable },
      { new: true, runValidators: true }
    ).populate('user', 'name phoneNumber email');

    if (!graduate) {
      return res.status(404).json({ error: 'Graduate profile not found' });
    }

    res.json(graduate);
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getAvailableGraduates = async (req, res) => {
  try {
    const { serviceType, location, district, sector } = req.query;
    
    let filter = { isAvailable: true };
    
    if (serviceType && serviceType !== 'both') {
      filter.specialization = { $in: [serviceType, 'both'] };
    }
    
    if (district) {
      filter.district = new RegExp(district, 'i');
    }
    
    if (sector) {
      filter.sector = new RegExp(sector, 'i');
    }

    const graduates = await Graduate.find(filter)
      .populate('user', 'name phoneNumber email')
      .select('-__v')
      .sort({ rating: -1, experience: -1 });

    res.json(graduates);
  } catch (error) {
    console.error('Get available graduates error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Graduate = require('../models/Graduate');
const Farmer = require('../models/Farmer');
const jwtConfig = require('../config/jwt');
const syncService = require('../services/syncService'); // Add this import

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
};

exports.login = async (req, res) => {
  try {

    console.log('🔐 Login attempt:', req.body.phoneNumber); // Add this
    const { phoneNumber, password } = req.body;

    // Find user by phone number
    const user = await User.findOne({ phoneNumber });
    console.log('👤 User found:', user ? 'Yes' : 'No'); // Add this
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Get additional user data based on role
    let userData = { ...user.toObject() };
    delete userData.password;

    if (user.role === 'graduate') {
      const graduate = await Graduate.findOne({ user: user._id });
      userData.graduateProfile = graduate;
    } else if (user.role === 'farmer') {
      const farmer = await Farmer.findOne({ user: user._id });
      userData.farmerProfile = farmer;
    }

    const token = generateToken(user._id);

    res.json({
      user: userData,
      token
    });
  } catch (error) {
    onsole.error('❌ Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// src/controllers/authController.js - Update registerGraduate
exports.registerGraduate = async (req, res) => {
  try {
    const {
      phoneNumber,
      name,
      email,
      password,
      specialization, // This will map to 'expertise'
      province,
      district,
      sector,
      cell,
      qualifications,
      experience
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this phone number already exists' });
    }

    // Create user in MongoDB (web database)
    const user = new User({
      phoneNumber,
      name,
      email,
      password,
      role: 'graduate'
    });

    await user.save();

    // Create graduate profile in MongoDB - using USSD-compatible fields
    const graduate = new Graduate({
      user: user._id,
      phoneNumber, // Add phoneNumber to match USSD
      name, // Add name to match USSD
      expertise: specialization, // Map 'specialization' to 'expertise'
      province,
      district,
      sector,
      cell,
      // Web-only fields
      qualifications: Array.isArray(qualifications) ? qualifications : [qualifications],
      experience: parseInt(experience),
      isAvailable: true
    });

    await graduate.save();

    // SYNC: Also add to USSD PostgreSQL database
    try {
      await syncService.syncGraduateToUSSD({
        phoneNumber,
        name,
        expertise: specialization, // Use 'expertise' for USSD
        province,
        district,
        sector,
        cell
      });
      console.log('✅ Graduate synced to USSD system successfully');
    } catch (syncError) {
      console.warn('⚠️ Graduate created in web but failed to sync with USSD:', syncError.message);
    }

    const userData = { ...user.toObject() };
    delete userData.password;
    userData.graduateProfile = graduate;

    const token = generateToken(user._id);

    res.status(201).json({
      user: userData,
      token,
      message: 'Graduate registered successfully'
    });
  } catch (error) {
    console.error('Graduate registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    let userData = { ...req.user.toObject() };
    delete userData.password;

    if (req.user.role === 'graduate') {
      const graduate = await Graduate.findOne({ user: req.user._id });
      userData.graduateProfile = graduate;
    } else if (req.user.role === 'farmer') {
      const farmer = await Farmer.findOne({ user: req.user._id });
      userData.farmerProfile = farmer;
    }

    res.json({ user: userData });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
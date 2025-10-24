// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Graduate = require('../models/Graduate');
const Farmer = require('../models/Farmer');
const jwtConfig = require('../config/jwt');
const syncService = require('../services/syncService');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
};

exports.login = async (req, res) => {
  try {
    console.log('🔐 Login attempt:', req.body.phoneNumber);
    const { phoneNumber, password } = req.body;

    // Find user by phone number
    const user = await User.findOne({ phoneNumber });
    console.log('👤 User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('❌ User not found with phone:', phoneNumber);
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    // Debug password comparison
    console.log('🔐 Comparing password...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('🔐 Password match:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Password does not match for user:', user.phoneNumber);
      return res.status(401).json({ error: 'Invalid phone number or password' });
    }

    if (!user.isActive) {
      console.log('❌ User account is deactivated:', user.phoneNumber);
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    console.log('✅ Login successful for user:', user.phoneNumber, 'Role:', user.role);

    // Get additional user data based on role
    let userData = { ...user.toObject() };
    delete userData.password;

    if (user.role === 'graduate') {
      const graduate = await Graduate.findOne({ user: user._id });
      userData.graduateProfile = graduate;
      console.log('🎓 Graduate profile loaded');
    } else if (user.role === 'farmer') {
      const farmer = await Farmer.findOne({ user: user._id });
      userData.farmerProfile = farmer;
      console.log('👨‍🌾 Farmer profile loaded');
    } else if (user.role === 'admin') {
      console.log('👑 Admin user logged in');
    }

    const token = generateToken(user._id);
    console.log('🔑 Token generated for user:', user._id);

    res.json({
      user: userData,
      token
    });
  } catch (error) {
    console.error('❌ Login error:', error); // FIXED: Added 'c' to console
    res.status(500).json({ error: 'Server error during login' });
  }
};

// Add this to your authController.js
exports.registerAdmin = async (req, res) => {
  try {
    console.log('📝 Admin registration attempt:', req.body.phoneNumber);
    
    const { phoneNumber, name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      console.log('❌ Admin user already exists:', phoneNumber);
      return res.status(400).json({ error: 'User with this phone number already exists' });
    }

    // Create admin user - password will be automatically hashed by pre-save hook
    const user = new User({
      phoneNumber,
      name,
      email,
      password,
      role: 'admin'
    });

    await user.save();
    console.log('✅ Admin user created:', user._id);

    const userData = { ...user.toObject() };
    delete userData.password;

    const token = generateToken(user._id);
    console.log('✅ Admin registration completed successfully');

    res.status(201).json({
      user: userData,
      token,
      message: 'Admin registered successfully'
    });
  } catch (error) {
    console.error('❌ Admin registration error:', error);
    res.status(500).json({ error: 'Server error during admin registration' });
  }
};

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

    console.log('📝 Graduate registration attempt:', phoneNumber);

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      console.log('❌ User already exists:', phoneNumber);
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
    console.log('✅ User created:', user._id);

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
    console.log('✅ Graduate profile created:', graduate._id);

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
    console.log('✅ Graduate registration completed successfully');

    res.status(201).json({
      user: userData,
      token,
      message: 'Graduate registered successfully'
    });
  } catch (error) {
    console.error('❌ Graduate registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    console.log('👤 Getting current user:', req.user._id);
    
    let userData = { ...req.user.toObject() };
    delete userData.password;

    if (req.user.role === 'graduate') {
      const graduate = await Graduate.findOne({ user: req.user._id });
      userData.graduateProfile = graduate;
      console.log('🎓 Loaded graduate profile for current user');
    } else if (req.user.role === 'farmer') {
      const farmer = await Farmer.findOne({ user: req.user._id });
      userData.farmerProfile = farmer;
      console.log('👨‍🌾 Loaded farmer profile for current user');
    } else if (req.user.role === 'admin') {
      console.log('👑 Current user is admin');
    }

    res.json({ user: userData });
  } catch (error) {
    console.error('❌ Get current user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
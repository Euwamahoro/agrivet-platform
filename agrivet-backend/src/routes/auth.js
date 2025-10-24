// src/routes/auth.js
const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

console.log('✅ Auth routes loaded');

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('phoneNumber').isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], (req, res, next) => {
  console.log('🔐 Login request received:', {
    phoneNumber: req.body.phoneNumber,
    passwordLength: req.body.password ? req.body.password.length : 0,
    headers: req.headers
  });
  next();
}, handleValidationErrors, authController.login);

console.log('✅ Login route configured');

// In src/routes/auth.js - Add this route
router.post('/register/admin', [
  body('phoneNumber').isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits'),
  body('name').notEmpty().withMessage('Name is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('email').optional().isEmail().withMessage('Valid email is required')
], (req, res, next) => {
  console.log('📝 Admin registration request received:', {
    phoneNumber: req.body.phoneNumber,
    name: req.body.name,
    email: req.body.email,
    passwordLength: req.body.password ? req.body.password.length : 0
  });
  next();
}, handleValidationErrors, authController.registerAdmin);


// @route   POST /api/auth/register/graduate
// @desc    Register a new graduate
// @access  Public
// src/routes/auth.js - Update the register route
router.post('/register/graduate', [
  body('phoneNumber').isLength({ min: 10, max: 10 }).withMessage('Phone number must be 10 digits'),
  body('name').notEmpty().withMessage('Name is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('specialization').isIn(['agronomy', 'veterinary', 'both']).withMessage('Invalid specialization'),
  body('province').notEmpty().withMessage('Province is required'),
  body('district').notEmpty().withMessage('District is required'),
  body('experience').isInt({ min: 0 }).withMessage('Experience must be a positive number')
], (req, res, next) => {
  console.log('📝 Registration request received:', {
    phoneNumber: req.body.phoneNumber,
    name: req.body.name,
    specialization: req.body.specialization,
    province: req.body.province,
    district: req.body.district,
    experience: req.body.experience,
    passwordLength: req.body.password ? req.body.password.length : 0
  });
  next();
}, handleValidationErrors, authController.registerGraduate);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, authController.getCurrentUser);

module.exports = router;
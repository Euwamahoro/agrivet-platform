// src/routes/graduates.js
const express = require('express');
const { body } = require('express-validator');
const graduateController = require('../controllers/graduateController');
const { auth, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// All routes are protected and require graduate role
router.use(auth, requireRole(['graduate']));

// @route   GET /api/graduates/profile
// @desc    Get graduate profile
// @access  Private (Graduate)
router.get('/profile', graduateController.getGraduateProfile);

// @route   PATCH /api/graduates/profile
// @desc    Update graduate profile
// @access  Private (Graduate)
router.patch('/profile', [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('specialization').optional().isIn(['agronomy', 'veterinary', 'both']).withMessage('Invalid specialization'),
  body('experience').optional().isInt({ min: 0 }).withMessage('Experience must be a positive number')
], handleValidationErrors, graduateController.updateGraduateProfile);

// @route   PATCH /api/graduates/availability
// @desc    Update graduate availability
// @access  Private (Graduate)
router.patch('/availability', [
  body('isAvailable').isBoolean().withMessage('Availability must be a boolean')
], handleValidationErrors, graduateController.updateAvailability);

// @route   GET /api/graduates/available
// @desc    Get available graduates (for matching)
// @access  Public (for now, might restrict later)
router.get('/available', graduateController.getAvailableGraduates);

module.exports = router;
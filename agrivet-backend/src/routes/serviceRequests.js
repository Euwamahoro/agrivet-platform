// src/routes/serviceRequests.js
const express = require('express');
const { body } = require('express-validator');
const serviceRequestController = require('../controllers/serviceRequestController');
const { auth, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// @route   GET /api/service-requests/available
// @desc    Get available service requests
// @access  Private (Graduate)
router.get('/available', auth, requireRole(['graduate']), serviceRequestController.getAvailableRequests);

// @route   POST /api/service-requests/:requestId/accept
// @desc    Accept a service request
// @access  Private (Graduate)
router.post('/:requestId/accept', auth, requireRole(['graduate']), serviceRequestController.acceptRequest);

// @route   PATCH /api/service-requests/:requestId/status
// @desc    Update request status
// @access  Private (Graduate)
router.patch('/:requestId/status', [
  body('status').isIn(['in_progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('notes').optional().isLength({ max: 1000 }).withMessage('Notes too long')
], handleValidationErrors, auth, requireRole(['graduate']), serviceRequestController.updateRequestStatus);

// @route   GET /api/service-requests/my-assignments
// @desc    Get graduate's assignments
// @access  Private (Graduate)
router.get('/my-assignments', auth, requireRole(['graduate']), serviceRequestController.getMyAssignments);

module.exports = router;
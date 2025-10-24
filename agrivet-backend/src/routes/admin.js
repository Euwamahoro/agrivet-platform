// src/routes/admin.js
const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

const router = express.Router();

// All admin routes require admin role
router.use(auth, requireRole(['admin']));

// @route   GET /api/admin/stats
// @desc    Get platform statistics
// @access  Private (Admin)
router.get('/stats', adminController.getPlatformStats);

// @route   GET /api/admin/users
// @desc    Get all users with filtering
// @access  Private (Admin)
router.get('/users', adminController.getUsers);

// @route   GET /api/admin/graduates
// @desc    Get all graduates
// @access  Private (Admin)
router.get('/graduates', adminController.getGraduates);

// @route   GET /api/admin/farmers
// @desc    Get all farmers
// @access  Private (Admin)
router.get('/farmers', adminController.getFarmers);

// @route   GET /api/admin/service-requests
// @desc    Get all service requests
// @access  Private (Admin)
router.get('/service-requests', adminController.getServiceRequests);

// @route   PATCH /api/admin/users/:userId/status
// @desc    Activate/deactivate user
// @access  Private (Admin)
router.patch('/users/:userId/status', adminController.updateUserStatus);

// @route   GET /api/admin/analytics
// @desc    Get platform analytics
// @access  Private (Admin)
router.get('/analytics', adminController.getAnalytics);

module.exports = router;
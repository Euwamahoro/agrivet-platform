// src/models/ServiceRequest.js - Add ussdId field
const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true
  },
  graduate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Graduate'
  },
  serviceType: {
    type: String,
    enum: ['agronomy', 'veterinary'],
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'no_match'],
    default: 'pending'
  },
  location: {
    province: { type: String, required: true },
    district: { type: String, required: true },
    sector: { type: String, required: true },
    cell: { type: String, required: true }
  },
  // NEW: Track USSD reference
  ussdId: {
    type: String, // Store the USSD PostgreSQL UUID
    unique: true,
    sparse: true // Allows null for web-originated requests
  },
  assignedAt: {
    type: Date
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  serviceNotes: {
    type: String,
    maxlength: 1000
  },
  farmerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  farmerFeedback: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
serviceRequestSchema.index({ farmer: 1, createdAt: -1 });
serviceRequestSchema.index({ graduate: 1, status: 1 });
serviceRequestSchema.index({ status: 1, serviceType: 1 });
serviceRequestSchema.index({ 'location.district': 1, 'location.sector': 1 });
serviceRequestSchema.index({ ussdId: 1 }); // NEW: Index for USSD ID lookup

module.exports = mongoose.models.ServiceRequest || mongoose.model('ServiceRequest', serviceRequestSchema);
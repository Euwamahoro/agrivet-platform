// src/models/Graduate.js (Web Backend - MongoDB)
const mongoose = require('mongoose');

const graduateSchema = new mongoose.Schema({
  // Keep user reference for web authentication
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Match USSD fields exactly
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  expertise: {  // Changed from 'specialization' to match USSD
    type: String,
    enum: ['agronomy', 'veterinary', 'both'],
    required: true
  },
  province: {
    type: String,
    required: true
  },
  district: {
    type: String,
    required: true
  },
  sector: {
    type: String,
    required: true
  },
  cell: {
    type: String,
    required: true
  },
  // Web-only fields (not synced to USSD)
  qualifications: [{
    type: String
  }],
  experience: {
    type: Number,
    min: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalServices: {
    type: Number,
    default: 0
  },
  completedServices: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
graduateSchema.index({ province: 1, district: 1, sector: 1 });
graduateSchema.index({ expertise: 1, isAvailable: 1 });

module.exports = mongoose.model('Graduate', graduateSchema);
// src/models/Farmer.js - UPDATED
const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  // Existing fields
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Made optional for synced farmers
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
  locationText: {
    type: String
  },
  totalRequests: {
    type: Number,
    default: 0
  },
  completedRequests: {
    type: Number,
    default: 0
  },
  
  // NEW FIELDS FOR SYNC
  phone: {
    type: String,
    required: false, // Optional for existing farmers
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: false // Optional for existing farmers
  },
  ussdId: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Farmer', farmerSchema);
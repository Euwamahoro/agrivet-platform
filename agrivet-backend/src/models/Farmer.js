// src/models/Farmer.js
const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Farmer', farmerSchema);
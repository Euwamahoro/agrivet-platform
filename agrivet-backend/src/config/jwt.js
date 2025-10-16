// src/config/jwt.js
module.exports = {
  secret: process.env.JWT_SECRET || 'agrivet-super-secret-key',
  expiresIn: '30d',
};
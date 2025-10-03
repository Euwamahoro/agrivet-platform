const { Graduate } = require('../models');
const geospatialService = require('./geospatialService'); // NEW: Import geospatialService
const { SERVICE_TYPE_AGRONOMY, SERVICE_TYPE_VETERINARY, SERVICE_TYPE_BOTH } = require('../utils/constants');


const findGraduateByPhoneNumber = async (phoneNumber) => {
  return Graduate.findOne({ where: { phoneNumber } });
};

// NEW FUNCTION: Find available graduates based on location and expertise
const findAvailableGraduates = async (farmerLocation, serviceType) => {
  const { province, district, sector, cell } = farmerLocation;

  // Define expertise query: graduate must match serviceType, or have 'both'
  const expertiseQuery = {
    [serviceType]: true, // e.g., { agronomy: true } if 'agronomy'
    [SERVICE_TYPE_BOTH]: true // Always include graduates with 'both' expertise
  };

  // Step 1: Find in same Cell
  let graduates = await geospatialService.findGraduatesInArea(
    province, district, sector, cell, expertiseQuery
  );

  if (graduates.length > 0) {
    // For now, just return the first one found. In a real system,
    // you'd have more sophisticated selection (e.g., nearest, rating, availability).
    return graduates[0]; 
  }

  // Step 2: If no match in Cell, find in same Sector
  graduates = await geospatialService.findGraduatesInArea(
    province, district, sector, null, expertiseQuery // Pass null for cell
  );
  if (graduates.length > 0) {
    return graduates[0];
  }

  // Step 3: If no match in Sector, find in same District
  graduates = await geospatialService.findGraduatesInArea(
    province, district, null, null, expertiseQuery // Pass null for sector and cell
  );
  if (graduates.length > 0) {
    return graduates[0];
  }

  // Step 4: If no match in District, find in same Province
  graduates = await geospatialService.findGraduatesInArea(
    province, null, null, null, expertiseQuery // Pass null for district, sector, cell
  );
  if (graduates.length > 0) {
    return graduates[0];
  }

  // No match found across all levels
  return null;
};

// This function will need a way to register graduates, likely through a web interface,
// as planned. For now, we assume graduates are pre-populated in the DB for testing.
// const registerGraduate = async (phoneNumber, name, expertise, locationGeometry) => { ... };

// For testing purposes, you might want a simple function to add a test graduate manually
// This would be in `db/seeds/` usually, not here in the service directly.
const addTestGraduate = async (phoneNumber, name, expertise, lat, lon) => {
  try {
    const newGraduate = await Graduate.create({
      phoneNumber,
      name,
      expertise,
      isAvailable: true,
      location: {
        type: 'Point',
        coordinates: [lon, lat] // GeoJSON: [longitude, latitude]
      }
    });
    return newGraduate;
  } catch (error) {
    console.error('Error adding test graduate:', error);
    throw error;
  }
};


module.exports = {
  findGraduateByPhoneNumber,
  findAvailableGraduates,
  addTestGraduate, // Only for development/testing
};
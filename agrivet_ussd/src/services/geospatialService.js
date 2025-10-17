const { Graduate, Sequelize } = require('../models');

// Helper to construct location query based on administrative level
const buildLocationQuery = (province, district, sector, cell) => {
  let query = {};
  if (province) query.province = province;
  if (district) query.district = district;
  if (sector) query.sector = sector;
  if (cell) query.cell = cell;
  return query;
};

// Helper to construct expertise query
const buildExpertiseQuery = (serviceType) => {
  // A graduate's expertise can be 'agronomy', 'veterinary', or 'both'
  // If serviceType is 'agronomy', we need graduates with 'agronomy' OR 'both'
  // If serviceType is 'veterinary', we need graduates with 'veterinary' OR 'both'
  if (!serviceType) return {};

  return {
    [Sequelize.Op.or]: [
      { expertise: serviceType },
      { expertise: 'both' },
    ]
  };
};


// Main function to find graduates in a specified administrative area
const findGraduatesInArea = async (province, district, sector, cell, expertiseType) => {
  const locationConditions = buildLocationQuery(province, district, sector, cell);
  const expertiseConditions = buildExpertiseQuery(expertiseType);

  try {
    const graduates = await Graduate.findAll({
      where: {
        isAvailable: true, // Only find available graduates
        ...locationConditions,
        ...expertiseConditions,
      },
      // You can add ordering by distance if 'location' geometry is available for farmers
      // order: Sequelize.literal('ST_Distance(location, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326))'),
      // replacements: { lon: farmerLon, lat: farmerLat }, // if farmer location is a Point
    });
    return graduates;
  } catch (error) {
    console.error('Error finding graduates in area:', error);
    throw error;
  }
};

module.exports = {
  findGraduatesInArea,
};
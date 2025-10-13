const { Graduate } = require('../models');
const geospatialService = require('./geospatialService');
const { SERVICE_TYPE_BOTH } = require('../utils/constants');

/**
 * Find a graduate by phone number
 * @param {string} phoneNumber - The graduate's phone number
 * @returns {Promise<Graduate|null>} - Found graduate or null
 */
const findGraduateByPhoneNumber = async (phoneNumber) => {
  try {
    return await Graduate.findOne({ where: { phoneNumber } });
  } catch (error) {
    console.error('Error finding graduate by phone number:', error);
    throw error;
  }
};

/**
 * Find available graduates based on location and expertise
 * Searches in hierarchical order: Cell → Sector → District → Province
 * @param {Object} farmerLocation - The farmer's location data
 * @param {string} farmerLocation.province - Province name
 * @param {string} farmerLocation.district - District name  
 * @param {string} farmerLocation.sector - Sector name
 * @param {string} farmerLocation.cell - Cell name
 * @param {string} serviceType - Required service type ('agronomy' or 'veterinary')
 * @returns {Promise<Graduate|null>} - First available graduate found, or null
 */
const findAvailableGraduates = async (farmerLocation, serviceType) => {
  const { province, district, sector, cell } = farmerLocation;

  // Validate serviceType
  if (!serviceType || (serviceType !== 'agronomy' && serviceType !== 'veterinary')) {
    console.error('Invalid service type:', serviceType);
    return null;
  }

  try {
    // Step 1: Find in same Cell (most specific)
    console.log(`Searching for ${serviceType} graduates in cell: ${cell}`);
    let graduates = await geospatialService.findGraduatesInArea(
      province, district, sector, cell, serviceType
    );

    if (graduates.length > 0) {
      console.log(`Found ${graduates.length} graduate(s) in cell`);
      return graduates[0]; 
    }

    // Step 2: If no match in Cell, find in same Sector
    console.log(`No graduates in cell, searching in sector: ${sector}`);
    graduates = await geospatialService.findGraduatesInArea(
      province, district, sector, null, serviceType
    );
    if (graduates.length > 0) {
      console.log(`Found ${graduates.length} graduate(s) in sector`);
      return graduates[0];
    }

    // Step 3: If no match in Sector, find in same District
    console.log(`No graduates in sector, searching in district: ${district}`);
    graduates = await geospatialService.findGraduatesInArea(
      province, district, null, null, serviceType
    );
    if (graduates.length > 0) {
      console.log(`Found ${graduates.length} graduate(s) in district`);
      return graduates[0];
    }

    // Step 4: If no match in District, find in same Province
    console.log(`No graduates in district, searching in province: ${province}`);
    graduates = await geospatialService.findGraduatesInArea(
      province, null, null, null, serviceType
    );
    if (graduates.length > 0) {
      console.log(`Found ${graduates.length} graduate(s) in province`);
      return graduates[0];
    }

    // No match found across all levels
    console.log('No graduates found in any location level');
    return null;

  } catch (error) {
    console.error('Error in findAvailableGraduates:', error);
    throw error;
  }
};

/**
 * Get all available graduates (for admin purposes)
 * @returns {Promise<Array<Graduate>>} - Array of all available graduates
 */
const getAllAvailableGraduates = async () => {
  try {
    return await Graduate.findAll({
      where: { isAvailable: true },
      order: [['name', 'ASC']]
    });
  } catch (error) {
    console.error('Error getting all available graduates:', error);
    throw error;
  }
};

/**
 * Register a new graduate (for web interface)
 * @param {string} phoneNumber - Graduate's phone number
 * @param {string} name - Graduate's full name
 * @param {string} expertise - 'agronomy', 'veterinary', or 'both'
 * @param {number} lat - Latitude coordinate
 * @param {number} lon - Longitude coordinate
 * @returns {Promise<Graduate>} - Newly created graduate
 */
const registerGraduate = async (phoneNumber, name, expertise, lat, lon) => {
  try {
    // Validate expertise
    const validExpertise = ['agronomy', 'veterinary', 'both'];
    if (!validExpertise.includes(expertise)) {
      throw new Error(`Invalid expertise. Must be one of: ${validExpertise.join(', ')}`);
    }

    // Check if graduate already exists
    const existingGraduate = await findGraduateByPhoneNumber(phoneNumber);
    if (existingGraduate) {
      throw new Error('Graduate with this phone number already exists');
    }

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

    console.log(`Graduate registered successfully: ${name} (${phoneNumber})`);
    return newGraduate;
  } catch (error) {
    console.error('Error registering graduate:', error);
    throw error;
  }
};

/**
 * Update graduate availability status
 * @param {string} graduateId - Graduate's UUID
 * @param {boolean} isAvailable - New availability status
 * @returns {Promise<Graduate>} - Updated graduate
 */
const updateGraduateAvailability = async (graduateId, isAvailable) => {
  try {
    const graduate = await Graduate.findByPk(graduateId);
    if (!graduate) {
      throw new Error('Graduate not found');
    }

    graduate.isAvailable = isAvailable;
    await graduate.save();

    console.log(`Graduate ${graduate.name} availability updated to: ${isAvailable}`);
    return graduate;
  } catch (error) {
    console.error('Error updating graduate availability:', error);
    throw error;
  }
};

/**
 * DEVELOPMENT/TESTING ONLY: Add a test graduate
 * @param {string} phoneNumber - Test graduate's phone number
 * @param {string} name - Test graduate's name
 * @param {string} expertise - 'agronomy', 'veterinary', or 'both'
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Graduate>} - Created test graduate
 */
const addTestGraduate = async (phoneNumber, name, expertise, lat, lon) => {
  try {
    console.warn('⚠️  addTestGraduate is for development/testing only!');
    
    const newGraduate = await Graduate.create({
      phoneNumber,
      name,
      expertise,
      isAvailable: true,
      location: {
        type: 'Point',
        coordinates: [lon, lat]
      }
    });

    console.log(`Test graduate added: ${name} (${phoneNumber}) - ${expertise}`);
    return newGraduate;
  } catch (error) {
    console.error('Error adding test graduate:', error);
    throw error;
  }
};

module.exports = {
  findGraduateByPhoneNumber,
  findAvailableGraduates,
  getAllAvailableGraduates,
  registerGraduate,
  updateGraduateAvailability,
  addTestGraduate, // Only for development/testing
};
const { Farmer } = require('../models');

const findFarmerByPhoneNumber = async (phoneNumber) => {
  return Farmer.findOne({ where: { phoneNumber } });
};

const registerFarmer = async (phoneNumber, name, province, district, sector, cell) => {
  try {
    const newFarmer = await Farmer.create({
      phoneNumber,
      name,
      province,
      district,
      sector,
      cell,
    });
    return newFarmer;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      // This case should ideally be handled before calling registerFarmer
      console.warn(`Attempted to register existing farmer: ${phoneNumber}`);
      return null; // Or throw a specific error
    }
    console.error('Error registering farmer:', error);
    throw error;
  }
};

const updateFarmer = async (phoneNumber, updates) => {
  try {
    const [updatedRows] = await Farmer.update(updates, {
      where: { phoneNumber },
      returning: true, // Return the updated record
    });
    if (updatedRows > 0) {
      return Farmer.findOne({ where: { phoneNumber } }); // Fetch the updated record
    }
    return null; // Farmer not found or no update
  } catch (error) {
    console.error('Error updating farmer:', error);
    throw error;
  }
};

module.exports = {
  findFarmerByPhoneNumber,
  registerFarmer,
  updateFarmer,
};
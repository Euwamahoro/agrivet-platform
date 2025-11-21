const { Farmer } = require('../models');

const findFarmerByPhoneNumber = async (phoneNumber) => {
  console.log('🔍 DEBUG - Finding farmer by phone:', phoneNumber);
  
  const farmer = await Farmer.findOne({ 
    where: { phone_number: phoneNumber } // ✅ FIXED: Use phone_number
  });
  
  console.log('🔍 DEBUG - Farmer found:', {
    found: !!farmer,
    farmerId: farmer?.id,
    farmerPhone: farmer?.phoneNumber, // This should now work
    hasPhoneNumber: !!farmer?.phoneNumber
  });
  
  if (farmer) {
    console.log('✅ DEBUG - Farmer data:', {
      id: farmer.id,
      phoneNumber: farmer.phoneNumber, // JavaScript property
      phone_number: farmer.phone_number, // Database column
      name: farmer.name
    });
  }
  
  return farmer;
};

const registerFarmer = async (phoneNumber, name, province, district, sector, cell) => {
  try {
    console.log('🔍 DEBUG - Registering farmer with phone:', phoneNumber);
    
    const newFarmer = await Farmer.create({
      phoneNumber, // Sequelize maps this to phone_number column
      name,
      province,
      district,
      sector,
      cell,
    });
    
    console.log('✅ DEBUG - Farmer registered:', {
      id: newFarmer.id,
      phoneNumber: newFarmer.phoneNumber
    });
    
    return newFarmer;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.warn(`Attempted to register existing farmer: ${phoneNumber}`);
      return null;
    }
    console.error('Error registering farmer:', error);
    throw error;
  }
};

const updateFarmer = async (phoneNumber, updates) => {
  try {
    const [updatedRows] = await Farmer.update(updates, {
      where: { phone_number: phoneNumber }, // ✅ FIXED: Use phone_number here too
      returning: true,
    });
    if (updatedRows > 0) {
      return Farmer.findOne({ where: { phone_number: phoneNumber } }); // ✅ FIXED
    }
    return null;
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
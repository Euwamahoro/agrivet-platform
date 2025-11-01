const { ServiceRequest } = require('../models');
const { REQUEST_STATUS_PENDING, REQUEST_STATUS_NO_MATCH } = require('../utils/constants');

const createServiceRequest = async (farmerId, farmerPhone, graduateId, serviceType, description, status = REQUEST_STATUS_PENDING) => {
  try {
    console.log(`📝 Creating service request for farmer: ${farmerId}, phone: ${farmerPhone}`);
    
    const newRequest = await ServiceRequest.create({
      farmerId,
      farmerPhone, // ADDED: Store farmer phone for sync
      graduateId,
      serviceType,
      description,
      status,
    });
    
    console.log(`✅ Service request created: ${newRequest.id} for farmer ${farmerPhone}`);
    return newRequest;
  } catch (error) {
    console.error('❌ Error creating service request:', error);
    throw error;
  }
};

const findRequestById = async (requestId) => {
  return ServiceRequest.findByPk(requestId);
};

const findRequestsByFarmerId = async (farmerId) => {
  return ServiceRequest.findAll({
    where: { farmerId },
    order: [['createdAt', 'DESC']]
  });
};

const updateRequestStatus = async (requestId, status) => {
  try {
    const request = await ServiceRequest.findByPk(requestId);
    if (request) {
      request.status = status;
      await request.save();
      return request;
    }
    return null;
  } catch (error) {
    console.error('Error updating request status:', error);
    throw error;
  }
};

module.exports = {
  createServiceRequest,
  findRequestById,
  findRequestsByFarmerId,
  updateRequestStatus,
};
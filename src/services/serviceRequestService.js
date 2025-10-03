const { ServiceRequest } = require('../models');
const { REQUEST_STATUS_PENDING, REQUEST_STATUS_NO_MATCH } = require('../utils/constants');

const createServiceRequest = async (farmerId, graduateId, serviceType, description, status = REQUEST_STATUS_PENDING) => {
  try {
    const newRequest = await ServiceRequest.create({
      farmerId,
      graduateId,
      serviceType,
      description,
      status,
    });
    return newRequest;
  } catch (error) {
    console.error('Error creating service request:', error);
    throw error;
  }
};

const findRequestById = async (requestId) => {
  return ServiceRequest.findByPk(requestId);
};

// You can add more functions here for fetching requests by farmerId, updating status, etc.
// For Phase 4, `createServiceRequest` is the primary one needed.

module.exports = {
  createServiceRequest,
  findRequestById,
};
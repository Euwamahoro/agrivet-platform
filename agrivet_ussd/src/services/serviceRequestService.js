const { ServiceRequest } = require('../models');
const { REQUEST_STATUS_PENDING, REQUEST_STATUS_NO_MATCH } = require('../utils/constants');

// In serviceRequestService.js - MODIFIED with better logging
const createServiceRequest = async (farmerId, farmerPhone, graduateId, serviceType, description, status = REQUEST_STATUS_PENDING) => {
  try {
    console.log('🔍 DEBUG - ServiceRequest.create() called with:', {
      farmerId,
      farmerPhone,
      graduateId,
      serviceType,
      description,
      status
    });

    // Validate serviceType is not undefined
    if (!serviceType) {
      console.error('❌ DEBUG - serviceType is undefined! Using default: agronomy');
      serviceType = 'agronomy';
    }

    const newRequest = await ServiceRequest.create({
      farmerId,
      farmerPhone, // This will now work after model update
      graduateId,
      serviceType,
      description,
      status,
    });

    console.log('✅ DEBUG - ServiceRequest created successfully:', {
      id: newRequest.id,
      service_type: newRequest.serviceType,
      farmer_phone: newRequest.farmerPhone, // This should now show the phone
      farmer_id: newRequest.farmerId
    });

    return newRequest;
  } catch (error) {
    console.error('❌ DEBUG - Error creating service request:', error);
    throw error;
  }
};

module.exports = {
  createServiceRequest,
  findRequestById,
  findRequestsByFarmerId,
  updateRequestStatus,
};
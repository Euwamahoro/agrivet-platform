// services/serviceRequestService.js
const { ServiceRequest } = require('../models');
const { REQUEST_STATUS_PENDING, REQUEST_STATUS_NO_MATCH } = require('../utils/constants');

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

    // Validate required fields
    if (!farmerPhone) {
      throw new Error('farmerPhone is required but was not provided');
    }
    
    if (!serviceType) {
      console.warn('⚠️ serviceType is undefined! Using default: agronomy');
      serviceType = 'agronomy';
    }

    const newRequest = await ServiceRequest.create({
      farmerId,
      farmerPhone,
      graduateId,
      serviceType,
      description,
      status,
    });

    console.log('✅ DEBUG - ServiceRequest created successfully:', {
      id: newRequest.id,
      service_type: newRequest.serviceType,
      farmer_phone: newRequest.farmerPhone,
      farmer_id: newRequest.farmerId,
      description_length: newRequest.description?.length || 0
    });

    return newRequest;
  } catch (error) {
    console.error('❌ DEBUG - Error creating service request:', error.message);
    console.error('❌ DEBUG - Error details:', {
      farmerId,
      farmerPhone,
      serviceType,
      hasFarmerPhone: !!farmerPhone,
      hasServiceType: !!serviceType
    });
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
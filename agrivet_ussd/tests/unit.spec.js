// tests/unit.spec.js - FINAL FIXED VERSION
const serviceRequestService = require('../src/services/serviceRequestService');
const farmerService = require('../src/services/farmerService');
const graduateService = require('../src/services/graduateService');
const ussdService = require('../src/services/ussdService');
const { Farmer, ServiceRequest, Graduate } = require('../src/models');
const { REQUEST_STATUS_PENDING, REQUEST_STATUS_NO_MATCH } = require('../src/utils/constants');

// Mock all models
jest.mock('../src/models', () => ({
  Farmer: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
  },
  ServiceRequest: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
  },
  Graduate: {
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
  }
}));

// Properly mock geospatial service to avoid Sequelize.Op error
jest.mock('../src/services/geospatialService', () => ({
  findGraduatesInArea: jest.fn().mockImplementation((province, district, sector, cell, expertiseType) => {
    // Return mock data based on parameters
    if (expertiseType === 'veterinary' && cell === 'Kinyaga') {
      return Promise.resolve([
        {
          id: 'grad-001',
          name: 'Test Graduate',
          expertise: 'veterinary',
          province: 'Kigali',
          district: 'Gasabo',
          is_available: true
        }
      ]);
    } else {
      return Promise.resolve([]);
    }
  })
}));

// ============================================================================
// UNIT TESTING OUTPUTS - ALL SERVICES & MODELS
// ============================================================================

describe('4.2.3 UNIT TESTING OUTPUTS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // SERVICE REQUEST SERVICE TESTS
  describe('ServiceRequestService Unit Tests', () => {
    it('should create service request with valid data', async () => {
      const mockRequest = {
        id: 'req-001',
        farmerId: 'farmer-123',
        farmerPhone: '+250788123456',
        serviceType: 'agronomy',
        status: REQUEST_STATUS_PENDING
      };

      ServiceRequest.create.mockResolvedValue(mockRequest);

      const result = await serviceRequestService.createServiceRequest(
        'farmer-123', '+250788123456', null, 'agronomy', 'Test description'
      );

      expect(ServiceRequest.create).toHaveBeenCalled();
      expect(result.id).toBe('req-001');
    });

    it('should find requests by farmer ID', async () => {
      const mockRequests = [
        { id: 'req-001', farmerId: 'farmer-123', serviceType: 'agronomy' }
      ];

      ServiceRequest.findAll.mockResolvedValue(mockRequests);

      const result = await serviceRequestService.findRequestsByFarmerId('farmer-123');

      expect(ServiceRequest.findAll).toHaveBeenCalledWith({
        where: { farmerId: 'farmer-123' },
        order: [['createdAt', 'DESC']]
      });
      expect(result).toHaveLength(1);
    });

    it('should update request status', async () => {
      const mockRequest = {
        id: 'req-001',
        status: 'pending',
        save: jest.fn().mockResolvedValue(true)
      };

      ServiceRequest.findByPk.mockResolvedValue(mockRequest);

      const result = await serviceRequestService.updateRequestStatus('req-001', 'completed');

      expect(mockRequest.status).toBe('completed');
      expect(mockRequest.save).toHaveBeenCalled();
    });
  });

  // FARMER SERVICE TESTS
  describe('FarmerService Unit Tests', () => {
    it('should register new farmer', async () => {
      const mockFarmer = {
        id: 'farmer-001',
        phone_number: '+250788123456',
        name: 'Test Farmer'
      };

      Farmer.create.mockResolvedValue(mockFarmer);

      const result = await farmerService.registerFarmer(
        '+250788123456', 'Test Farmer', 'Kigali', 'Gasabo', 'Bumbogo', 'Kinyaga'
      );

      expect(Farmer.create).toHaveBeenCalled();
      expect(result.phone_number).toBe('+250788123456');
    });

    it('should find farmer by phone number', async () => {
      const mockFarmer = {
        id: 'farmer-001',
        phone_number: '+250788123456',
        name: 'Test Farmer'
      };

      Farmer.findOne.mockResolvedValue(mockFarmer);

      const result = await farmerService.findFarmerByPhoneNumber('+250788123456');

      expect(Farmer.findOne).toHaveBeenCalledWith({
        where: { phoneNumber: '+250788123456' }
      });
      expect(result.phone_number).toBe('+250788123456');
    });
  });

  // GRADUATE SERVICE TESTS - FIXED TO AVOID ACTUAL GEOSPATIAL SERVICE CALLS
  describe('GraduateService Unit Tests', () => {
    it('should find available graduates by location and expertise', async () => {
      const mockGraduate = {
        id: 'grad-001',
        name: 'Test Graduate',
        expertise: 'veterinary',
        province: 'Kigali',
        district: 'Gasabo',
        is_available: true
      };

      // The geospatial service is already mocked to return data for veterinary + Kinyaga
      const location = { province: 'Kigali', district: 'Gasabo', sector: 'Bumbogo', cell: 'Kinyaga' };
      const result = await graduateService.findAvailableGraduates(location, 'veterinary');

      // Check the actual parameters being passed
      const geospatialService = require('../src/services/geospatialService');
      expect(geospatialService.findGraduatesInArea).toHaveBeenCalledWith(
        'Kigali', 'Gasabo', 'Bumbogo', 'Kinyaga', 'veterinary'
      );
      
      // Your service returns a SINGLE object (graduates[0]), not an array
      expect(result).toEqual(mockGraduate);
      expect(result.id).toBe('grad-001');
      expect(result.expertise).toBe('veterinary');
    });

    it('should handle no graduates found', async () => {
      const location = { province: 'Kigali', district: 'Gasabo', sector: 'Bumbogo', cell: 'Kinyaga' };
      const result = await graduateService.findAvailableGraduates(location, 'agronomy');

      const geospatialService = require('../src/services/geospatialService');
      expect(geospatialService.findGraduatesInArea).toHaveBeenCalled();
      expect(result).toBeNull(); // Your service returns null when no graduates found
    });

    it('should handle invalid service type', async () => {
      const location = { province: 'Kigali', district: 'Gasabo', sector: 'Bumbogo', cell: 'Kinyaga' };
      const result = await graduateService.findAvailableGraduates(location, 'invalid-type');

      expect(result).toBeNull(); // Should return null for invalid service type
    });
  });

  // USSD SERVICE TESTS
  describe('USSD Service Unit Tests', () => {
    it('should generate language selection menu', () => {
      const menu = ussdService.getLanguageSelectionMenu();
      
      expect(menu).toContain('Welcome to AgriVet');
      expect(menu).toContain('English');
      expect(menu).toContain('Kinyarwanda');
      expect(menu).toContain('Kiswahili');
    });

    it('should generate main menu for registered farmer', async () => {
      const mockFarmer = { 
        name: 'Test Farmer',
        phone_number: '+250788123456' 
      };
      Farmer.findOne.mockResolvedValue(mockFarmer);

      const menu = await ussdService.getDynamicMainMenu('en', '+250788123456');
      
      expect(menu).toContain('Welcome to AgriVet');
      expect(menu).toContain('Request Service');
      expect(menu).toContain('Weather Information');
    });

    it('should generate main menu for unregistered farmer', async () => {
      Farmer.findOne.mockResolvedValue(null);

      const menu = await ussdService.getDynamicMainMenu('en', '+250788999999');
      
      expect(menu).toContain('Welcome to AgriVet');
      expect(menu).toContain('Register as Farmer');
    });

    it('should generate service type menu', () => {
      const menu = ussdService.getServiceTypeMenu('en');
      
      expect(menu).toContain('Select service type');
      expect(menu).toContain('Agronomy');
      expect(menu).toContain('Veterinary');
      expect(menu).toContain('Back to Main Menu');
    });

    it('should get translated messages', () => {
      const message = ussdService.getTranslatedMessage('welcome_message', 'en');
      expect(typeof message).toBe('string');
    });
  });

  // ERROR HANDLING TESTS
  describe('Error Handling Unit Tests', () => {
    it('should handle database errors in service request creation', async () => {
      ServiceRequest.create.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        serviceRequestService.createServiceRequest(
          'farmer-123', '+250788123456', null, 'agronomy', 'Test'
        )
      ).rejects.toThrow('Database connection failed');
    });

    it('should handle errors in farmer lookup', async () => {
      Farmer.findOne.mockRejectedValue(new Error('Database error'));

      await expect(
        farmerService.findFarmerByPhoneNumber('+250788123456')
      ).rejects.toThrow('Database error');
    });
  });
});
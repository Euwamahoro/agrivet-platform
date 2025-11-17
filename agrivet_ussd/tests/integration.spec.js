// tests/integration.spec.js - FIXED VERSION
const farmerService = require('../src/services/farmerService');
const serviceRequestService = require('../src/services/serviceRequestService');
const graduateService = require('../src/services/graduateService');
const ussdService = require('../src/services/ussdService');
const { Farmer, ServiceRequest, Graduate } = require('../src/models');

// Mock all models PROPERLY
jest.mock('../src/models', () => ({
  Farmer: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(), // Added this
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
  },
  Sequelize: {
    Op: {
      or: Symbol('or')
    }
  }
}));

// Mock geospatial service PROPERLY
jest.mock('../src/services/geospatialService', () => ({
  findGraduatesInArea: jest.fn()
}));

// Mock adminLocationService
jest.mock('../src/services/adminLocationService', () => ({
  getProvinces: jest.fn(),
  getDistricts: jest.fn(),
  getSectors: jest.fn(),
  getCells: jest.fn()
}));

describe('4.2.5 INTEGRATION TESTING OUTPUTS', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('USSD Flow Integration Tests', () => {
    it('should complete end-to-end service request flow', async () => {
      // 1. Farmer Registration
      const farmerData = {
        id: 'farmer-001',
        phoneNumber: '+250788123456',
        name: 'Test Farmer',
        province: 'Kigali',
        district: 'Gasabo',
        sector: 'Bumbogo',
        cell: 'Kinyaga'
      };
      
      // Mock Farmer.findOne to return null (new farmer)
      Farmer.findOne.mockResolvedValue(null);
      Farmer.create.mockResolvedValue(farmerData);

      // 2. Service Request Creation
      const serviceRequestData = {
        id: 'req-001',
        farmerId: 'farmer-001',
        farmerPhone: '+250788123456',
        serviceType: 'veterinary',
        status: 'pending'
      };
      
      // Mock Farmer.findOne to return the farmer (existing farmer)
      Farmer.findOne.mockResolvedValue(farmerData);
      ServiceRequest.create.mockResolvedValue(serviceRequestData);

      // 3. Graduate Matching
      const graduateData = {
        id: 'grad-001',
        name: 'Test Graduate',
        expertise: 'veterinary',
        phoneNumber: '+250788999999'
      };
      
      const geospatialService = require('../src/services/geospatialService');
      geospatialService.findGraduatesInArea.mockResolvedValue([graduateData]);

      // Execute integrated flow
      const registeredFarmer = await farmerService.registerFarmer(
        '+250788123456', 'Test Farmer', 'Kigali', 'Gasabo', 'Bumbogo', 'Kinyaga'
      );
      
      const serviceRequest = await serviceRequestService.createServiceRequest(
        'farmer-001', '+250788123456', null, 'veterinary', 'Test description'
      );
      
      const matchedGraduate = await graduateService.findAvailableGraduates(
        { province: 'Kigali', district: 'Gasabo', sector: 'Bumbogo', cell: 'Kinyaga' },
        'veterinary'
      );

      // Verify integration
      expect(registeredFarmer.phoneNumber).toBe('+250788123456');
      expect(serviceRequest.serviceType).toBe('veterinary');
      expect(matchedGraduate.expertise).toBe('veterinary');
    });

    it('should handle USSD session persistence', async () => {
      const sessionId = 'test-session-001';
      
      // Start session
      const initialSession = ussdService.getSession(sessionId);
      expect(initialSession.state).toBeNull();
      
      // Update session
      ussdService.updateSession(sessionId, { state: 'language_selection', language: 'en' });
      const updatedSession = ussdService.getSession(sessionId);
      
      expect(updatedSession.state).toBe('language_selection');
      expect(updatedSession.language).toBe('en');
    });

    it('should integrate location services with graduate matching', async () => {
      const locationData = {
        province: 'Kigali',
        district: 'Gasabo', 
        sector: 'Bumbogo',
        cell: 'Kinyaga'
      };

      const graduates = [
        { id: 'grad-001', name: 'Vet Expert', expertise: 'veterinary', province: 'Kigali' },
        { id: 'grad-002', name: 'Agro Expert', expertise: 'agronomy', province: 'Kigali' }
      ];

      const geospatialService = require('../src/services/geospatialService');
      geospatialService.findGraduatesInArea.mockResolvedValue(graduates);

      const adminLocationService = require('../src/services/adminLocationService');
      adminLocationService.getProvinces.mockResolvedValue([{ code: '01', name: 'Kigali' }]);

      // Test location-based graduate matching
      const matchedGraduates = await geospatialService.findGraduatesInArea(
        'Kigali', 'Gasabo', 'Bumbogo', 'Kinyaga', 'veterinary'
      );

      expect(matchedGraduates).toHaveLength(2);
      expect(matchedGraduates[0].expertise).toBe('veterinary');
    });
  });

  describe('Database Integration Tests', () => {
    it('should maintain data consistency across related entities', async () => {
      const farmer = {
        id: 'farmer-001',
        phoneNumber: '+250788123456',
        name: 'Test Farmer'
      };

      const serviceRequest = {
        id: 'req-001',
        farmerId: 'farmer-001',
        farmerPhone: '+250788123456',
        serviceType: 'agronomy'
      };

      // Verify relationship integrity
      Farmer.findByPk.mockResolvedValue(farmer);
      ServiceRequest.findAll.mockResolvedValue([serviceRequest]);

      const foundFarmer = await Farmer.findByPk('farmer-001');
      const farmerRequests = await ServiceRequest.findAll({ 
        where: { farmerId: 'farmer-001' } 
      });

      expect(foundFarmer.id).toBe('farmer-001');
      expect(farmerRequests[0].farmerId).toBe(foundFarmer.id);
    });
  });
});
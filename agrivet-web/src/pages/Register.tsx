// src/pages/Register.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerGraduate, clearError } from '../store/slices/authSlice';
import { RootState, AppDispatch } from '../store';

// Constants matching your USSD implementation exactly
const INTELLEX_API_BASE_URL = 'https://api.intellex.dev/traffic/pt/';
const INTELLEX_COUNTRY_CODE = 'RW';
const DIASPORA_PROVINCE_NAME = 'Diaspora';

// GUID endpoints from your USSD code
const INTELLEX_PROVINCES_GUID = '34f68e31-b590-49d5-9d17-6226d96ad0ae';
const INTELLEX_DISTRICTS_GUID = 'eb89b84d-f562-4410-b336-60a8f6754e5c';
const INTELLEX_SECTORS_GUID = '96023692-9f8b-4241-91bc-6b8240e14797';
const INTELLEX_CELLS_GUID = 'e8e7ddc7-9dc1-4462-b3d5-7e4f16a44e70';

// API Keys from environment variables
const API_KEYS = {
  provinces: process.env.REACT_APP_INTELLEX_PROVINCES_API_KEY,
  districts: process.env.REACT_APP_INTELLEX_DISTRICTS_API_KEY,
  sectors: process.env.REACT_APP_INTELLEX_SECTORS_API_KEY,
  cells: process.env.REACT_APP_INTELLEX_CELLS_API_KEY,
};

// Interfaces for location data
interface Location {
  code: string;
  name: string;
}

interface LocationState {
  provinces: Location[];
  districts: Location[];
  sectors: Location[];
  cells: Location[];
  loading: {
    provinces: boolean;
    districts: boolean;
    sectors: boolean;
    cells: boolean;
  };
  errors: {
    provinces: string;
    districts: string;
    sectors: string;
    cells: string;
  };
}

interface IntellexApiResponse {
  status: boolean;
  data: Location[];
  responseCode: number;
  message: string;
}

const Register: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, isLoading, error } = useSelector((state: RootState) => state.auth);

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    specialization: 'agronomy' as 'agronomy' | 'veterinary' | 'both',
    province: '',
    district: '',
    sector: '',
    cell: '',
    qualifications: '',
    experience: 0,
  });

  const [locationData, setLocationData] = useState<LocationState>({
    provinces: [],
    districts: [],
    sectors: [],
    cells: [],
    loading: {
      provinces: false,
      districts: false,
      sectors: false,
      cells: false,
    },
    errors: {
      provinces: '',
      districts: '',
      sectors: '',
      cells: '',
    }
  });

  const getApiHeaders = (apiKey: string, parentCode: string | null = null, type: string = 'Province') => {
    const headers: Record<string, string> = {
      'api-key': apiKey,
      'Countrycode': INTELLEX_COUNTRY_CODE,
    };

    // Add parent code header based on the type of request
    if (parentCode) {
      if (type === 'District') headers['Provincecode'] = parentCode;
      if (type === 'Sector') headers['Districtcode'] = parentCode;
      if (type === 'Cell') headers['Sectorcode'] = parentCode;
    }
    return headers;
  };

  const fetchLocationData = async (
    guid: string, 
    apiKey: string | undefined, 
    type: string, 
    parentCode: string | null = null
  ): Promise<Location[]> => {
    if (!apiKey) {
      const errorMsg = `${type} API key is missing`;
      setLocationData(prev => ({ 
        ...prev, 
        errors: { ...prev.errors, [type.toLowerCase() + 's']: errorMsg }
      }));
      return [];
    }

    const url = `${INTELLEX_API_BASE_URL}${guid}`;
    
    try {
      setLocationData(prev => ({ 
        ...prev, 
        loading: { ...prev.loading, [type.toLowerCase() + 's']: true },
        errors: { ...prev.errors, [type.toLowerCase() + 's']: '' }
      }));

      const response = await fetch(url, {
        method: 'GET',
        headers: getApiHeaders(apiKey, parentCode, type),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: IntellexApiResponse = await response.json();
      
      if (result.status && result.data) {
        // Filter out Diaspora for provinces
        let filteredData = result.data;
        if (type === 'Province') {
          filteredData = result.data.filter(item => item.name !== DIASPORA_PROVINCE_NAME);
        }

        return filteredData;
      } else {
        const errorMsg = `Intellex API error: ${result.message}`;
        setLocationData(prev => ({ 
          ...prev, 
          errors: { ...prev.errors, [type.toLowerCase() + 's']: errorMsg }
        }));
        return [];
      }
    } catch (error) {
      const errorMsg = `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setLocationData(prev => ({ 
        ...prev, 
        errors: { ...prev.errors, [type.toLowerCase() + 's']: errorMsg }
      }));
      return [];
    } finally {
      setLocationData(prev => ({ 
        ...prev, 
        loading: { ...prev.loading, [type.toLowerCase() + 's']: false } 
      }));
    }
  };

  // Fetch provinces on component mount
  useEffect(() => {
    const fetchProvinces = async () => {
      const provinces = await fetchLocationData(
        INTELLEX_PROVINCES_GUID, 
        API_KEYS.provinces, 
        'Province'
      );
      
      setLocationData(prev => ({ 
        ...prev, 
        provinces
      }));
    };

    fetchProvinces();
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!formData.province) {
        setLocationData(prev => ({ ...prev, districts: [] }));
        return;
      }

      const districts = await fetchLocationData(
        INTELLEX_DISTRICTS_GUID, 
        API_KEYS.districts, 
        'District', 
        formData.province
      );
      
      setLocationData(prev => ({ 
        ...prev, 
        districts
      }));
    };

    fetchDistricts();
  }, [formData.province]);

  // Fetch sectors when district changes
  useEffect(() => {
    const fetchSectors = async () => {
      if (!formData.district) {
        setLocationData(prev => ({ ...prev, sectors: [] }));
        return;
      }

      const sectors = await fetchLocationData(
        INTELLEX_SECTORS_GUID, 
        API_KEYS.sectors, 
        'Sector', 
        formData.district
      );
      
      setLocationData(prev => ({ 
        ...prev, 
        sectors
      }));
    };

    fetchSectors();
  }, [formData.district]);

  // Fetch cells when sector changes
  useEffect(() => {
    const fetchCells = async () => {
      if (!formData.sector) {
        setLocationData(prev => ({ ...prev, cells: [] }));
        return;
      }

      const cells = await fetchLocationData(
        INTELLEX_CELLS_GUID, 
        API_KEYS.cells, 
        'Cell', 
        formData.sector
      );
      
      setLocationData(prev => ({ 
        ...prev, 
        cells
      }));
    };

    fetchCells();
  }, [formData.sector]);

  // Reset dependent fields when parent changes
  useEffect(() => {
    if (formData.province) {
      setFormData(prev => ({
        ...prev,
        district: '',
        sector: '',
        cell: ''
      }));
    }
  }, [formData.province]);

  useEffect(() => {
    if (formData.district) {
      setFormData(prev => ({
        ...prev,
        sector: '',
        cell: ''
      }));
    }
  }, [formData.district]);

  useEffect(() => {
    if (formData.sector) {
      setFormData(prev => ({
        ...prev,
        cell: ''
      }));
    }
  }, [formData.sector]);

  useEffect(() => {
    if (user) {
      navigate('/graduate');
    }
  }, [user, navigate]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'experience' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const { confirmPassword, ...submitData } = formData;
    dispatch(registerGraduate(submitData));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Register as AgriVet Graduate
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join our network of agricultural and veterinary experts
          </p>
        </div>
        
        <form className="mt-8 space-y-8 bg-white rounded-2xl shadow-lg p-8" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* API Error Display */}
          {locationData.errors.provinces && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <strong>Location Data Error:</strong> {locationData.errors.provinces}
              <br />
              <span className="text-sm">Please check your API keys in the .env file</span>
            </div>
          )}

          <div className="space-y-8">
            {/* Personal Information */}
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    required
                    className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
                    placeholder="0781234567"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization *
                  </label>
                  <select
                    id="specialization"
                    name="specialization"
                    required
                    className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
                    value={formData.specialization}
                    onChange={handleChange}
                  >
                    <option value="agronomy">Agronomy</option>
                    <option value="veterinary">Veterinary</option>
                    <option value="both">Both (Dual Expertise)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Location & Professional Details */}
            <div className="border-b border-gray-200 pb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Location & Professional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Province */}
                <div>
                  <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-2">
                    Province *
                  </label>
                  <select
                    id="province"
                    name="province"
                    required
                    className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
                    value={formData.province}
                    onChange={handleChange}
                    disabled={locationData.loading.provinces}
                  >
                    <option value="">Select Province</option>
                    {locationData.provinces.map((province) => (
                      <option key={province.code} value={province.code}>
                        {province.name}
                      </option>
                    ))}
                  </select>
                  {locationData.loading.provinces && (
                    <p className="text-sm text-gray-500 mt-1">Loading provinces...</p>
                  )}
                  {locationData.errors.provinces && (
                    <p className="text-sm text-red-500 mt-1">Error: {locationData.errors.provinces}</p>
                  )}
                </div>

                {/* District */}
                <div>
                  <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
                    District *
                  </label>
                  <select
                    id="district"
                    name="district"
                    required
                    className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
                    value={formData.district}
                    onChange={handleChange}
                    disabled={!formData.province || locationData.loading.districts}
                  >
                    <option value="">{formData.province ? 'Select District' : 'Select Province first'}</option>
                    {locationData.districts.map((district) => (
                      <option key={district.code} value={district.code}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  {locationData.loading.districts && (
                    <p className="text-sm text-gray-500 mt-1">Loading districts...</p>
                  )}
                </div>

                {/* Sector */}
                <div>
                  <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-2">
                    Sector *
                  </label>
                  <select
                    id="sector"
                    name="sector"
                    required
                    className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
                    value={formData.sector}
                    onChange={handleChange}
                    disabled={!formData.district || locationData.loading.sectors}
                  >
                    <option value="">{formData.district ? 'Select Sector' : 'Select District first'}</option>
                    {locationData.sectors.map((sector) => (
                      <option key={sector.code} value={sector.code}>
                        {sector.name}
                      </option>
                    ))}
                  </select>
                  {locationData.loading.sectors && (
                    <p className="text-sm text-gray-500 mt-1">Loading sectors...</p>
                  )}
                </div>

                {/* Cell */}
                <div>
                  <label htmlFor="cell" className="block text-sm font-medium text-gray-700 mb-2">
                    Cell *
                  </label>
                  <select
                    id="cell"
                    name="cell"
                    required
                    className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
                    value={formData.cell}
                    onChange={handleChange}
                    disabled={!formData.sector || locationData.loading.cells}
                  >
                    <option value="">{formData.sector ? 'Select Cell' : 'Select Sector first'}</option>
                    {locationData.cells.map((cell) => (
                      <option key={cell.code} value={cell.code}>
                        {cell.name}
                      </option>
                    ))}
                  </select>
                  {locationData.loading.cells && (
                    <p className="text-sm text-gray-500 mt-1">Loading cells...</p>
                  )}
                </div>

                {/* Experience */}
                <div>
                  <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience *
                  </label>
                  <input
                    type="text"
                    id="experience"
                    name="experience"
                    required
                    min="0"
                    max="50"
                    className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
                    value={formData.experience}
                    onChange={handleChange}
                  />
                </div>

                {/* Qualifications - Full width */}
                <div className="md:col-span-2">
                  <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700 mb-2">
                    Qualifications *
                  </label>
                  <textarea
                    id="qualifications"
                    name="qualifications"
                    required
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
                    placeholder="List your degrees, certifications, etc."
                    value={formData.qualifications}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Account Security */}
            <div className="pb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Account Security</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    required
                    className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <Link
              to="/login"
              className="font-medium text-green-600 hover:text-green-500 transition duration-200"
            >
              Already have an account? Sign in
            </Link>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto py-3 px-8 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition duration-200 transform hover:scale-105"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </span>
              ) : (
                'Register'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
const axios = require('axios');
const config = require('../config'); 
const {
  INTELLEX_API_BASE_URL,
  INTELLEX_PROVINCES_GUID,
  INTELLEX_DISTRICTS_GUID,
  INTELLEX_SECTORS_GUID,
  INTELLEX_CELLS_GUID,
  INTELLEX_COUNTRY_CODE,
  DIASPORA_PROVINCE_NAME,
} = require('../utils/constants');

// Access specific API keys from config
const PROVINCES_API_KEY = config.intellexApi.provincesKey;
const DISTRICTS_API_KEY = config.intellexApi.districtsKey;
const SECTORS_API_KEY = config.intellexApi.sectorsKey;
const CELLS_API_KEY = config.intellexApi.cellsKey;

// Simple in-memory cache for API responses to reduce redundant calls
const cache = {}; // { 'provinces': [...], 'districts-05': [...] }

const getApiHeaders = (apiKey, parentCode = null, type = 'Province') => {
  const headers = {
    'api-key': apiKey, // Use the specific API key for the endpoint
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

const fetchData = async (guid, apiKey, type, parentCode = null) => {
  const cacheKey = `${type}-${parentCode || 'all'}`;
  if (cache[cacheKey]) {
    // console.log(`Cache hit for ${cacheKey}`); // Optional debug
    return cache[cacheKey];
  }
  // console.log(`Cache miss for ${cacheKey}, fetching from API...`); // Optional debug

  const url = `${INTELLEX_API_BASE_URL}${guid}`;
  try {
    const response = await axios.get(url, { headers: getApiHeaders(apiKey, parentCode, type) });
    if (response.data && response.data.status) {
      const data = response.data.data;
      // Filter out Diaspora for provinces
      const filteredData = type === 'Province' 
        ? data.filter(item => item.name !== DIASPORA_PROVINCE_NAME)
        : data;
      
      // Store in cache
      cache[cacheKey] = filteredData;
      return filteredData;
    } else {
      console.error(`Intellex API error for ${type} (code: ${response.data.responseCode}): ${response.data.message}`);
      return [];
    }
  } catch (error) {
    console.error(`Error fetching ${type} from Intellex API:`, error.message);
    if (error.response) {
      console.error('API Response Data:', error.response.data);
      console.error('API Response Status:', error.response.status);
      console.error('API Response Headers:', error.response.headers);
    }
    return [];
  }
};

const getProvinces = async () => {
  return fetchData(INTELLEX_PROVINCES_GUID, PROVINCES_API_KEY, 'Province');
};

const getDistricts = async (provinceCode) => {
  return fetchData(INTELLEX_DISTRICTS_GUID, DISTRICTS_API_KEY, 'District', provinceCode);
};

const getSectors = async (districtCode) => {
  return fetchData(INTELLEX_SECTORS_GUID, SECTORS_API_KEY, 'Sector', districtCode);
};

const getCells = async (sectorCode) => {
  return fetchData(INTELLEX_CELLS_GUID, CELLS_API_KEY, 'Cell', sectorCode);
};

module.exports = {
  getProvinces,
  getDistricts,
  getSectors,
  getCells,
};
const axios = require('axios');

class GeocodingService {
  constructor() {
    this.apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
    this.baseURL = 'https://maps.googleapis.com/maps/api/geocode/json';
  }

  async getCoordinatesForDistrict(district, province = 'Rwanda') {
    try {
      console.log(`📍 Geocoding: ${district}, ${province}`);
      
      const response = await axios.get(this.baseURL, {
        params: {
          address: `${district}, ${province}`,
          key: this.apiKey
        }
      });

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const { lat, lng } = response.data.results[0].geometry.location;
        console.log(`✅ Coordinates found: ${lat}, ${lng}`);
        return { lat, lng };
      }
      
      console.log('❌ No coordinates found for location:', response.data.status);
      return null;
    } catch (error) {
      console.error('❌ Geocoding error:', error.message);
      return null;
    }
  }
}

module.exports = new GeocodingService();
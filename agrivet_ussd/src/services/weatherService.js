const axios = require('axios');

class GeocodingService {
  constructor() {
    this.openWeatherApiKey = process.env.OPENWEATHER_API_KEY || 'af3ef58adc2c6d98b42aa785fb638cf5';
    this.baseURL = 'http://api.openweathermap.org/geo/1.0/direct';
  }

  async getCoordinatesForDistrict(district, province = 'Rwanda') {
    try {
      console.log(`📍 Geocoding: ${district}, ${province}`);
      
      const response = await axios.get(this.baseURL, {
        params: {
          q: `${district}, ${province}`,
          limit: 1,
          appid: this.openWeatherApiKey
        }
      });

      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        console.log(`✅ Coordinates found: ${lat}, ${lon}`);
        return { lat, lng: lon };
      }
      
      console.log('❌ No coordinates found for location');
      return null;
    } catch (error) {
      console.error('❌ Geocoding error:', error.message);
      return null;
    }
  }
}

module.exports = new GeocodingService();
const axios = require('axios');
const geocodingService = require('./geoCodingService');
const { Farmer } = require('../models');

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY || 'af3ef58adc2c6d98b42aa785fb638cf5';
    this.baseURL = 'https://api.openweathermap.org/data/3.0/onecall';
  }

  async getWeatherForFarmer(phoneNumber) {
    try {
      console.log(`🌤️ Getting weather for farmer: ${phoneNumber}`);
      
      // 1. Get farmer's location from database
      const farmer = await Farmer.findOne({ where: { phone_number: phoneNumber } });
      if (!farmer) {
        throw new Error('Farmer not found');
      }

      console.log(`📍 Farmer location: ${farmer.district}, ${farmer.province}`);

      // 2. Convert district to coordinates
      const coords = await geocodingService.getCoordinatesForDistrict(farmer.district, farmer.province);
      if (!coords) {
        throw new Error('Could not get coordinates for location');
      }

      // 3. Get weather data
      const weatherData = await this.getWeatherForecast(coords.lat, coords.lng);
      
      // 4. Format for USSD
      return this.formatWeatherForUSSD(weatherData, farmer.district);
      
    } catch (error) {
      console.error('❌ Error getting weather for farmer:', error.message);
      return null;
    }
  }

  async getWeatherForecast(lat, lon) {
    try {
      console.log(`📡 Fetching weather for coordinates: ${lat}, ${lon}`);
      
      const response = await axios.get(this.baseURL, {
        params: {
          lat,
          lon,
          exclude: 'minutely,hourly,alerts',
          units: 'metric', // Celsius
          appid: this.apiKey
        },
        timeout: 10000
      });
      
      console.log('✅ Weather data received');
      return response.data;
    } catch (error) {
      console.error('❌ Weather API error:', error.message);
      throw new Error('Weather service unavailable');
    }
  }

  formatWeatherForUSSD(weatherData, district) {
    const current = weatherData.current;
    const today = weatherData.daily[0];
    const tomorrow = weatherData.daily[1];
    
    return `END Weather for ${district}:

Now: ${Math.round(current.temp)}°C, ${this.capitalize(current.weather[0].description)}
Humidity: ${current.humidity}%
Rain: ${Math.round(today.pop * 100)}% chance

Tomorrow: ${Math.round(tomorrow.temp.day)}°C, ${this.capitalize(tomorrow.weather[0].description)}
Rain: ${Math.round(tomorrow.pop * 100)}% chance

Plan farming activities accordingly.`;
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

module.exports = new WeatherService();
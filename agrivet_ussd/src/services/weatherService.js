const axios = require('axios');
const geocodingService = require('./geocodingService');
const { Farmer } = require('../models');

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHERMAP_API_KEY || 'af3ef58adc2c6d98b42aa785fb638cf5';
    this.baseURL = 'https://api.openweathermap.org/data/2.5';
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

      // 3. Get weather data using Current Weather API (free)
      const weatherData = await this.getCurrentWeather(coords.lat, coords.lng);
      
      // 4. Format for USSD
      return this.formatWeatherForUSSD(weatherData, farmer.district);
      
    } catch (error) {
      console.error('❌ Error getting weather for farmer:', error.message);
      return null;
    }
  }

  async getCurrentWeather(lat, lon) {
    try {
      console.log(`📡 Fetching current weather for coordinates: ${lat}, ${lon}`);
      
      const response = await axios.get(`${this.baseURL}/weather`, {
        params: {
          lat,
          lon,
          units: 'metric', // Celsius
          appid: this.apiKey
        },
        timeout: 10000
      });
      
      console.log('✅ Current weather data received');
      return response.data;
    } catch (error) {
      console.error('❌ Weather API error:', error.response?.data || error.message);
      throw new Error('Weather service unavailable');
    }
  }

  formatWeatherForUSSD(weatherData, district) {
    const main = weatherData.main;
    const weather = weatherData.weather[0];
    const wind = weatherData.wind;
    
    return `END Weather for ${district}:

Now: ${Math.round(main.temp)}°C, ${this.capitalize(weather.description)}
Feels like: ${Math.round(main.feels_like)}°C
Humidity: ${main.humidity}%
Wind: ${wind.speed} m/s

Plan farming activities accordingly.`;
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

module.exports = new WeatherService();
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

      // 3. Get current weather AND forecast for rain data
      const [currentWeather, forecast] = await Promise.all([
        this.getCurrentWeather(coords.lat, coords.lng),
        this.getForecast(coords.lat, coords.lng)
      ]);
      
      // 4. Format for USSD
      return this.formatWeatherForUSSD(currentWeather, forecast, farmer.district);
      
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
          units: 'metric',
          appid: this.apiKey
        },
        timeout: 10000
      });
      
      console.log('✅ Current weather data received');
      return response.data;
    } catch (error) {
      console.error('❌ Current weather API error:', error.response?.data || error.message);
      throw new Error('Weather service unavailable');
    }
  }

  async getForecast(lat, lon) {
    try {
      console.log(`📡 Fetching forecast for coordinates: ${lat}, ${lon}`);
      
      const response = await axios.get(`${this.baseURL}/forecast`, {
        params: {
          lat,
          lon,
          units: 'metric',
          appid: this.apiKey
        },
        timeout: 10000
      });
      
      console.log('✅ Forecast data received');
      return response.data;
    } catch (error) {
      console.error('❌ Forecast API error:', error.response?.data || error.message);
      // Return null if forecast fails, we'll still show current weather
      return null;
    }
  }

  formatWeatherForUSSD(currentWeather, forecast, district) {
    const main = currentWeather.main;
    const weather = currentWeather.weather[0];
    const wind = currentWeather.wind;
    
    let message = `Weather for ${district}:\n\n`;
    message += `Now: ${Math.round(main.temp)}°C, ${this.capitalize(weather.description)}\n`;
    message += `Feels like: ${Math.round(main.feels_like)}°C\n`;
    message += `Humidity: ${main.humidity}%\n`;
    message += `Wind: ${wind.speed} m/s\n`;
    
    // Add rainfall probability if forecast data is available
    if (forecast && forecast.list && forecast.list.length > 0) {
      const next12Hours = forecast.list.slice(0, 4); // Next 12 hours (3-hour intervals)
      const maxRainChance = Math.max(...next12Hours.map(item => 
        item.pop ? Math.round(item.pop * 100) : 0
      ));
      
      if (maxRainChance > 0) {
        message += `Rain chance: ${maxRainChance}%\n`;
      } else {
        message += `Rain chance: 0%\n`;
      }
    }
    
    message += `\nPlan farming activities accordingly.`;
    
    return `END ${message}`;
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

module.exports = new WeatherService();
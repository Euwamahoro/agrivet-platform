const axios = require('axios');
const geocodingService = require('./geocodingService');
const { Farmer } = require('../models');
const i18n = require('../utils/i18n'); // Add i18n import

class WeatherService {
  constructor() {
    this.apiKey = process.env.OPENWEATHERMAP_API_KEY || 'af3ef58adc2c6d98b42aa785fb638cf5';
    this.baseURL = 'https://api.openweathermap.org/data/2.5';
  }

  async getWeatherForFarmer(phoneNumber, locale = 'en') {
    try {
      console.log(`🌤️ Getting weather for farmer: ${phoneNumber} in ${locale}`);
      
      // Set the language for translations
      i18n.setLocale(locale);
      
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
      
      // 4. Format for USSD with translations
      return this.formatWeatherForUSSD(currentWeather, forecast, farmer.district, locale);
      
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
      return null;
    }
  }

  formatWeatherForUSSD(currentWeather, forecast, district, locale) {
    const main = currentWeather.main;
    const weather = currentWeather.weather[0];
    const wind = currentWeather.wind;
    
    // Set locale for translations
    i18n.setLocale(locale);
    
    // Translate weather description
    const translatedWeather = this.translateWeatherDescription(weather.description, locale);
    
    let message = `${i18n.__('weather_for')} ${district}:\n\n`;
    message += `${i18n.__('now')}: ${Math.round(main.temp)}°C, ${translatedWeather}\n`;
    message += `${i18n.__('feels_like')}: ${Math.round(main.feels_like)}°C\n`;
    message += `${i18n.__('humidity')}: ${main.humidity}%\n`;
    message += `${i18n.__('wind')}: ${wind.speed} m/s\n`;
    
    // Add rainfall probability if forecast data is available
    if (forecast && forecast.list && forecast.list.length > 0) {
      const next12Hours = forecast.list.slice(0, 4);
      const maxRainChance = Math.max(...next12Hours.map(item => 
        item.pop ? Math.round(item.pop * 100) : 0
      ));
      
      message += `${i18n.__('rain_chance')}: ${maxRainChance}%\n`;
    }
    
    message += `\n${i18n.__('plan_farming_activities')}`;
    
    return `END ${message}`;
  }

  translateWeatherDescription(description, locale) {
    i18n.setLocale(locale);
    
    const weatherTranslations = {
      'clear sky': 'weather_clear_sky',
      'few clouds': 'weather_few_clouds',
      'scattered clouds': 'weather_scattered_clouds',
      'broken clouds': 'weather_broken_clouds',
      'overcast clouds': 'weather_overcast_clouds',
      'light rain': 'weather_light_rain',
      'moderate rain': 'weather_moderate_rain',
      'heavy rain': 'weather_heavy_rain',
      'thunderstorm': 'weather_thunderstorm',
      'snow': 'weather_snow',
      'mist': 'weather_mist',
      'fog': 'weather_fog',
      'drizzle': 'weather_drizzle'
    };
    
    const translationKey = weatherTranslations[description] || 'weather_unknown';
    return i18n.__(translationKey);
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

module.exports = new WeatherService();
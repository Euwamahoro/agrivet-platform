const i18n = require('../utils/i18n');
const {
  USSD_CONTINUE,
  USSD_END,
  LANG_EN_CODE,
  LANG_RW_CODE,
  LANG_SW_CODE,
  MENU_OPTION_REGISTER_FARMER,
  MENU_OPTION_REQUEST_SERVICE,
  MENU_OPTION_MY_REQUEST_STATUS,
  MENU_OPTION_CHANGE_LANGUAGE,
  MENU_OPTION_EXIT,
  NAV_BACK_TO_MAIN_MENU,
  MENU_OPTION_UPDATE_DETAILS,
} = require('../utils/constants');

const farmerService = require('./farmerService'); 
const adminLocationService = require('./adminLocationService');
const serviceRequestService = require('./serviceRequestService');

// Add the missing constant
const MAX_DESCRIPTION_LENGTH = 255;
const sessions = {};

const getSession = (sessionId) => {
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      state: null,
      language: LANG_EN_CODE,
      lastInput: null,
      farmerRegData: {},
    };
  }
  return sessions[sessionId];
};

const updateSession = (sessionId, data) => {
  sessions[sessionId] = { ...sessions[sessionId], ...data };
};

const clearSession = (sessionId) => {
  delete sessions[sessionId];
};

const buildUssdResponse = (message, type = USSD_CONTINUE) => {
  return `${type} ${message}`;
};

const getTranslatedMessage = (key, locale = LANG_EN_CODE, ...args) => {
  i18n.setLocale(locale);
  const translated = i18n.__(key, ...args);
  return translated;
};

const getLanguageSelectionMenu = () => {
  const message =
    `${getTranslatedMessage('welcome_language_selection', LANG_EN_CODE)}\n` +
    `${getTranslatedMessage('lang_option_en', LANG_EN_CODE)}\n` +
    `${getTranslatedMessage('lang_option_rw', LANG_EN_CODE)}\n` +
    `${getTranslatedMessage('lang_option_sw', LANG_EN_CODE)}`;
  return message;
};


const getServiceTypeMenu = (locale) => {
  const message = getTranslatedMessage('prompt_service_type', locale);
  return message;
};

const getIssueDescriptionPrompt = (locale) => {
  return getTranslatedMessage('prompt_issue_description', locale, { max: MAX_DESCRIPTION_LENGTH });
};

const getFarmerNotRegisteredMessage = (locale) => {
  return getTranslatedMessage('farmer_not_registered', locale);
};

const getFarmingTipsMenu = (locale) => {
  return getTranslatedMessage('farming_tips_menu', locale);
};

// Add this method to ussdService.js
const getRequestStatusDisplay = async (locale, phoneNumber) => {
  const requests = await serviceRequestService.findRequestsByFarmerPhone(phoneNumber);
  
  if (!requests || requests.length === 0) {
    return getTranslatedMessage('no_requests_found', locale);
  }

  let message = getTranslatedMessage('request_status_header', locale) + '\n';
  
  requests.forEach((request, index) => {
    const requestNumber = index + 1;
    const shortId = request.id.substring(0, 8);
    const serviceType = getTranslatedMessage(
      request.serviceType === 'agronomy' ? 'agronomy_service_name' : 'veterinary_service_name', 
      locale
    );
    const status = getTranslatedMessage(`request_status_${request.status}`, locale);
    const date = new Date(request.createdAt).toLocaleDateString(locale);
    
    message += `\n${requestNumber}. ${serviceType} (${shortId})\n`;
    message += `   ${getTranslatedMessage('status', locale)}: ${status}\n`;
    message += `   ${getTranslatedMessage('date', locale)}: ${date}\n`;
  });
  
  message += `\n${getTranslatedMessage('press 0 to go back', locale)}`;
  return message;
};

// New and Updated Menu Functions

const getDynamicMainMenu = async (locale, phoneNumber) => {
  const farmer = await farmerService.findFarmerByPhoneNumber(phoneNumber);
  let mainMenuItem1;

  if (farmer) {
    mainMenuItem1 = `${getTranslatedMessage('menu_option_update_details', locale)}`
  } else {
    mainMenuItem1 = `${getTranslatedMessage('menu_option_register_farmer', locale)}`;
  }

  const message =
    `${getTranslatedMessage('main_menu_welcome', locale)}\n` +
    `${mainMenuItem1}\n` +                           // 1. Register/Update
    `${getTranslatedMessage('menu_option_request_service', locale)}\n` +
    `${getTranslatedMessage('menu_option_weather_info', locale)}\n` +  
    `${getTranslatedMessage('menu_option_farming_tips', locale)}\n` +
    `${getTranslatedMessage('menu_option_my_request_status', locale)}\n` + 
    `${getTranslatedMessage('menu_option_change_language', locale)}\n` + 
    `${getTranslatedMessage('menu_option_exit', locale)}`;
  return message;
};

const getFarmerNamePrompt = (locale) => {
  return getTranslatedMessage('prompt_farmer_name', locale);
};

const getProvincesMenu = async (locale) => {
  const provinces = await adminLocationService.getProvinces();
  let menu = getTranslatedMessage('prompt_province_selection', locale);
  provinces.forEach((p, index) => {
    menu += `\n${index + 1}. ${p.name}`;
  });
  return { menu, data: provinces };
};

const getDistrictsMenu = async (locale, provinceCode) => {
  const districts = await adminLocationService.getDistricts(provinceCode);
  
  if (!districts || districts.length === 0) {
    console.warn(`No districts found for province code: ${provinceCode}`);
    return { menu: getTranslatedMessage('invalid_selection', locale), data: [] };
  }

  let menu = getTranslatedMessage('prompt_district_selection', locale);
  districts.forEach((d, index) => {
    menu += `\n${index + 1}. ${d.name}`;
  });
  return { menu, data: districts };
};

const getSectorsMenu = async (locale, districtCode) => {
  const sectors = await adminLocationService.getSectors(districtCode);
  
  if (!sectors || sectors.length === 0) {
    console.warn(`No sectors found for district code: ${districtCode}`);
    return { menu: getTranslatedMessage('invalid_selection', locale), data: [] };
  }

  let menu = getTranslatedMessage('prompt_sector_selection', locale);
  sectors.forEach((s, index) => {
    menu += `\n${index + 1}. ${s.name}`;
  });
  return { menu, data: sectors }; 
};

const getCellsMenu = async (locale, sectorCode) => {
  const cells = await adminLocationService.getCells(sectorCode);
  
  if (!cells || cells.length === 0) {
    console.warn(`No cells found for sector code: ${sectorCode}`);
    return { menu: getTranslatedMessage('invalid_selection', locale), data: [] };
  }

  let menu = getTranslatedMessage('prompt_cell_selection', locale);
  cells.forEach((c, index) => {
    menu += `\n${index + 1}. ${c.name}`;
  });
  return { menu, data: cells }; 
};

const getFeatureComingSoonMessage = (locale, featureName) => {
  return getTranslatedMessage(
    'feature_coming_soon',
    locale,
    featureName,
    NAV_BACK_TO_MAIN_MENU
  );
};

const getAlreadyRegisteredMessage = async (locale) => {
  return getTranslatedMessage('farmer_already_registered', locale) +
         `\n${NAV_BACK_TO_MAIN_MENU}. ${getTranslatedMessage('back_to_main_menu', locale)}`;
};

const getUpdateDetailsMenu = (locale) => {
  return getTranslatedMessage('update_details_intro', locale);
}

module.exports = {
  getSession,
  updateSession,
  clearSession,
  buildUssdResponse,
  getTranslatedMessage,
  getLanguageSelectionMenu,
  getDynamicMainMenu, 
  getFarmerNamePrompt,
  getProvincesMenu,
  getDistrictsMenu,
  getSectorsMenu,
  getCellsMenu,
  getFeatureComingSoonMessage,
  getAlreadyRegisteredMessage,
  getUpdateDetailsMenu,
  getServiceTypeMenu,
  getIssueDescriptionPrompt,
  getFarmerNotRegisteredMessage,
  getRequestStatusDisplay,
  getFarmingTipsMenu
};
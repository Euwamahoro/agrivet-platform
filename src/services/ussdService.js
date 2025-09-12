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
const rwanda = require('rwanda'); // Import the rwanda package
const farmerService = require('./farmerService'); // Import farmerService

// Simple in-memory session store (for development only)
const sessions = {};

const getSession = (sessionId) => {
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      state: null,
      language: LANG_EN_CODE,
      lastInput: null,
      farmerRegData: {}, // Store farmer registration data temporarily
      // Add other session data as needed (e.g., farmer details being collected)
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
  // console.log(`Requesting translation for key: '${key}', locale: '${locale}'`);
  const translated = i18n.__(key, ...args);
  // console.log(`Result: '${translated}'`);
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

// --- New and Updated Menu Functions ---

// Dynamically generate Main Menu based on farmer registration status
const getDynamicMainMenu = async (locale, phoneNumber) => {
  const farmer = await farmerService.findFarmerByPhoneNumber(phoneNumber);
  let mainMenuItem1;

  if (farmer) {
    mainMenuItem1 = getTranslatedMessage(
      'menu_option_update_details',
      locale
    ); // "1. Update My Details"
  } else {
    mainMenuItem1 = getTranslatedMessage(
      'menu_option_register_farmer',
      locale
    ); // "1. Register as Farmer"
  }

  const message =
    `${getTranslatedMessage('main_menu_welcome', locale)}\n` +
    `${mainMenuItem1}\n` +
    `${getTranslatedMessage('menu_option_request_service', locale)}\n` +
    `${getTranslatedMessage('menu_option_my_request_status', locale)}\n` +
    `${getTranslatedMessage('menu_option_change_language', locale)}\n` +
    `${getTranslatedMessage('menu_option_exit', locale)}`;
  return message;
};

const getFarmerNamePrompt = (locale) => {
  return getTranslatedMessage('prompt_farmer_name', locale);
};

const getProvincesMenu = (locale) => {
  const provinces = rwanda.Provinces(); // Returns ['East', 'Kigali', ...]
  let menu = getTranslatedMessage('prompt_province_selection', locale);
  provinces.forEach((p, index) => {
    menu += `\n${index + 1}. ${p}`; // CORRECT: Use 'p' directly
  });
  return { menu, data: provinces }; // data will now be array of strings
};

const getDistrictsMenu = (locale, provinceName) => {
  // CORRECT: rwanda.Districts expects province name directly as a string
  const districts = rwanda.Districts(provinceName); 

  if (!districts || districts.length === 0) return { menu: getTranslatedMessage('invalid_selection', locale), data: [] };

  let menu = getTranslatedMessage('prompt_district_selection', locale);
  districts.forEach((d, index) => {
    menu += `\n${index + 1}. ${d}`; // CORRECT: Use 'd' directly
  });
  return { menu, data: districts }; // data will now be array of strings
};

const getSectorsMenu = (locale, districtName) => {
  // CORRECT: rwanda.Sectors expects district name directly as a string
  const sectors = rwanda.Sectors(districtName); 
  
  if (!sectors || sectors.length === 0) return { menu: getTranslatedMessage('invalid_selection', locale), data: [] };

  let menu = getTranslatedMessage('prompt_sector_selection', locale);
  sectors.forEach((s, index) => {
    menu += `\n${index + 1}. ${s}`; // CORRECT: Use 's' directly
  });
  return { menu, data: sectors }; // data will now be array of strings
};


const getCellsMenu = (locale, sectorName) => {
  // CORRECT: rwanda.Cells expects sector name directly as a string
  const cells = rwanda.Cells(sectorName); 
  
  if (!cells || cells.length === 0) return { menu: getTranslatedMessage('invalid_selection', locale), data: [] };

  let menu = getTranslatedMessage('prompt_cell_selection', locale);
  cells.forEach((c, index) => {
    menu += `\n${index + 1}. ${c}`; // CORRECT: Use 'c' directly
  });
  return { menu, data: cells }; // data will now be array of strings
};


// Placeholder for feature coming soon acknowledgement
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
  getDynamicMainMenu, // Use this for main menu
  getFarmerNamePrompt,
  getProvincesMenu,
  getDistrictsMenu,
  getSectorsMenu,
  getCellsMenu,
  getFeatureComingSoonMessage,
  getAlreadyRegisteredMessage,
  getUpdateDetailsMenu,
};
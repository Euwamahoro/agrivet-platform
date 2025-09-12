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
} = require('../utils/constants');

// Simple in-memory session store (for development only)
// In production, use Redis or a similar dedicated session store
const sessions = {};

const getSession = (sessionId) => {
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      state: null, // e.g., 'LANGUAGE_SELECTION', 'MAIN_MENU', 'FARMER_REGISTRATION'
      language: LANG_EN_CODE, // Default language
      lastInput: null,
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
  console.log(`--- USSD Service: getTranslatedMessage ---`); 
  console.log(`Requesting translation for key: '${key}', locale: '${locale}'`);
  i18n.setLocale(locale);
  const translated = i18n.__(key, ...args);
  console.log(`Result: '${translated}'`);
  return i18n.__(key, ...args);
};

const getLanguageSelectionMenu = () => {
  const message =
    `${getTranslatedMessage('welcome_language_selection', LANG_EN_CODE)}\n` +
    `${getTranslatedMessage('lang_option_en', LANG_EN_CODE)}\n` +
    `${getTranslatedMessage('lang_option_rw', LANG_EN_CODE)}\n` +
    `${getTranslatedMessage('lang_option_sw', LANG_EN_CODE)}`;
  return message;
};

const getMainMenu = (locale) => {

  const message =
    `${getTranslatedMessage('main_menu_welcome', locale)}\n` +
    `${getTranslatedMessage('menu_option_register_farmer', locale)}\n` +
    `${getTranslatedMessage('menu_option_request_service', locale)}\n` +
    `${getTranslatedMessage('menu_option_my_request_status', locale)}\n` +
    `${getTranslatedMessage('menu_option_change_language', locale)}\n` +
    `${getTranslatedMessage('menu_option_exit', locale)}`;
  return message;
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

module.exports = {
  getSession,
  updateSession,
  clearSession,
  buildUssdResponse,
  getTranslatedMessage,
  getLanguageSelectionMenu,
  getMainMenu,
  getFeatureComingSoonMessage,
};
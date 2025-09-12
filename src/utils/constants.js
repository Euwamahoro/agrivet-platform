module.exports = {
  // USSD Response Types
  USSD_CONTINUE: 'CON',
  USSD_END: 'END',

  // Session States
  STATE_LANGUAGE_SELECTION: 'LANGUAGE_SELECTION',
  STATE_MAIN_MENU: 'MAIN_MENU',
  STATE_SUB_MENU_ACK: 'SUB_MENU_ACK',
  STATE_FARMER_REG_NAME: 'FARMER_REG_NAME', // Placeholder for next phase
  STATE_FARMER_REG_LOCATION: 'FARMER_REG_LOCATION', // Placeholder for next phase
  
  // Main Menu Options
  MENU_OPTION_REGISTER_FARMER: '1',
  MENU_OPTION_REQUEST_SERVICE: '2',
  MENU_OPTION_MY_REQUEST_STATUS: '3',
  MENU_OPTION_CHANGE_LANGUAGE: '4',
  MENU_OPTION_EXIT: '5',

  // Language Options
  LANG_EN_OPTION: '1',
  LANG_RW_OPTION: '2',
  LANG_SW_OPTION: '3',

  // Language Codes
  LANG_EN_CODE: 'en',
  LANG_RW_CODE: 'rw',
  LANG_SW_CODE: 'sw',

  // Navigation Options
  NAV_BACK_TO_MAIN_MENU: '0',
};
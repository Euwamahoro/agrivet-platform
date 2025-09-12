const i18n = require('i18n');
const path = require('path');
const { LANG_EN_CODE, LANG_RW_CODE, LANG_SW_CODE } = require('./constants');

i18n.configure({
  locales: [LANG_EN_CODE, LANG_RW_CODE, LANG_SW_CODE],
  directory: path.join(__dirname, 'locales'), // Path to store translation files
  defaultLocale: LANG_EN_CODE,
  cookie: 'agrivet-locale', // Not used for USSD, but good practice
  objectNotation: true, // Allows for nested JSON objects
  syncFiles: true, // Creates locale files if they don't exist
  updateFiles: false, // Do not update files on runtime
});

module.exports = i18n;
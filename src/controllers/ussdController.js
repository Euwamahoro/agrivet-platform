const ussdService = require('../services/ussdService');
const {
  USSD_CONTINUE,
  USSD_END,
  STATE_LANGUAGE_SELECTION,
  STATE_MAIN_MENU,
  STATE_SUB_MENU_ACK,
  LANG_EN_OPTION,
  LANG_RW_OPTION,
  LANG_SW_OPTION,
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

const handleUssdRequest = async (req, res) => {
  const { sessionId, phoneNumber, text } = req.body;
  const session = ussdService.getSession(sessionId);

  let response = '';
  let responseType = USSD_CONTINUE;

  try {
    const input = text.split('*').pop(); // Get the last input from the USSD string

    if (text === '') {
      // New session or initial dial
      response = ussdService.getLanguageSelectionMenu();
      ussdService.updateSession(sessionId, { state: STATE_LANGUAGE_SELECTION });
    } else if (session.state === STATE_LANGUAGE_SELECTION) {
      // User is selecting language
      let selectedLanguageCode;
      switch (input) {
        case LANG_EN_OPTION:
          selectedLanguageCode = LANG_EN_CODE;
          break;
        case LANG_RW_OPTION:
          selectedLanguageCode = LANG_RW_CODE;
          break;
        case LANG_SW_OPTION:
          selectedLanguageCode = LANG_SW_CODE;
          break;
        default:
          response = ussdService.getTranslatedMessage(
            'invalid_language_option',
            session.language // Use default or previous language for error
          );
          response += `\n${ussdService.getLanguageSelectionMenu()}`; // Redisplay language selection
          // Don't update session state, keep it in LANGUAGE_SELECTION
          return res.send(ussdService.buildUssdResponse(response, responseType));
      }
        console.log('Selected Language Code:', selectedLanguageCode); // ADD THIS
      ussdService.updateSession(sessionId, {
        language: selectedLanguageCode,
        state: STATE_MAIN_MENU,
      });
      response = ussdService.getMainMenu(selectedLanguageCode);

    } else if (session.state === STATE_MAIN_MENU) {
      // User is interacting with the main menu
      const currentLanguage = session.language;

      switch (input) {
        case MENU_OPTION_REGISTER_FARMER:
          response = ussdService.getFeatureComingSoonMessage(
            currentLanguage,
            ussdService.getTranslatedMessage('menu_option_register_farmer', currentLanguage)
          );
          ussdService.updateSession(sessionId, { state: STATE_SUB_MENU_ACK });
          break;
        case MENU_OPTION_REQUEST_SERVICE:
          response = ussdService.getFeatureComingSoonMessage(
            currentLanguage,
            ussdService.getTranslatedMessage('menu_option_request_service', currentLanguage)
          );
          ussdService.updateSession(sessionId, { state: STATE_SUB_MENU_ACK });
          break;
        case MENU_OPTION_MY_REQUEST_STATUS:
          response = ussdService.getFeatureComingSoonMessage(
            currentLanguage,
            ussdService.getTranslatedMessage('menu_option_my_request_status', currentLanguage)
          );
          ussdService.updateSession(sessionId, { state: STATE_SUB_MENU_ACK });
          break;
        case MENU_OPTION_CHANGE_LANGUAGE:
          response = ussdService.getLanguageSelectionMenu();
          ussdService.updateSession(sessionId, { state: STATE_LANGUAGE_SELECTION });
          break;
        case MENU_OPTION_EXIT:
          response = ussdService.getTranslatedMessage('exit_message', currentLanguage);
          responseType = USSD_END;
          ussdService.clearSession(sessionId);
          break;
        default:
          response = ussdService.getTranslatedMessage(
            'invalid_main_menu_option',
            currentLanguage
          );
          response += `\n${ussdService.getMainMenu(currentLanguage)}`;
          // Stay in MAIN_MENU state
          break;
      }
    } else if (session.state === STATE_SUB_MENU_ACK) {
      // User acknowledged a "coming soon" message
      if (input === NAV_BACK_TO_MAIN_MENU) {
        response = ussdService.getMainMenu(session.language);
        ussdService.updateSession(sessionId, { state: STATE_MAIN_MENU });
      } else {
        // Invalid input in ACK state, redisplay ACK message
        // For simplicity, we can just return to main menu or re-display current ACK message
        response = ussdService.getTranslatedMessage('invalid_main_menu_option', session.language); // Reuse for generic invalid input
        response += `\n${ussdService.getMainMenu(session.language)}`; // Return to main menu for now
        ussdService.updateSession(sessionId, { state: STATE_MAIN_MENU });
      }
    }
    // TODO: Add more states here for farmer registration, service requests etc.

  } catch (error) {
    console.error(`USSD Error for session ${sessionId}:`, error);
    response = ussdService.getTranslatedMessage('error_generic', session.language || LANG_EN_CODE);
    responseType = USSD_END;
    ussdService.clearSession(sessionId);
  }

  res.send(ussdService.buildUssdResponse(response, responseType));
};

module.exports = {
  handleUssdRequest,
};
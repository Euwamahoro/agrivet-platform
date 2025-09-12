const ussdService = require('../services/ussdService');
const farmerService = require('../services/farmerService'); // Import farmerService
const {
  USSD_CONTINUE,
  USSD_END,
  STATE_LANGUAGE_SELECTION,
  STATE_MAIN_MENU,
  STATE_SUB_MENU_ACK,
  STATE_FARMER_REG_NAME,
  STATE_FARMER_REG_PROVINCE,
  STATE_FARMER_REG_DISTRICT,
  STATE_FARMER_REG_SECTOR,
  STATE_FARMER_REG_CELL,
  STATE_FARMER_UPDATE_MENU,
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
  MAX_NAME_LENGTH,
  MENU_OPTION_UPDATE_DETAILS,
} = require('../utils/constants');

const handleUssdRequest = async (req, res) => {
  // Provide a default empty string for text if it's undefined
  const { sessionId, phoneNumber, text = '' } = req.body;
  const session = ussdService.getSession(sessionId);

  let response = '';
  let responseType = USSD_CONTINUE;
  let currentLanguage = session.language || LANG_EN_CODE; // Fallback to EN if language not set

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
            currentLanguage
          );
          response += `\n${ussdService.getLanguageSelectionMenu()}`;
          return res.send(ussdService.buildUssdResponse(response, responseType));
      }
      ussdService.updateSession(sessionId, {
        language: selectedLanguageCode,
        state: STATE_MAIN_MENU,
      });
      currentLanguage = selectedLanguageCode; // Update currentLanguage for this request cycle
      response = await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber);
    } else if (session.state === STATE_MAIN_MENU) {
      // User is interacting with the main menu
      currentLanguage = session.language; // Ensure currentLanguage is up-to-date from session

      const farmer = await farmerService.findFarmerByPhoneNumber(phoneNumber);

      if (input === MENU_OPTION_REGISTER_FARMER && !farmer) {
        // Option 1: Register as Farmer (only if not already registered)
        ussdService.updateSession(sessionId, { state: STATE_FARMER_REG_NAME, farmerRegData: {} });
        response = ussdService.getFarmerNamePrompt(currentLanguage);
      } else if (input === MENU_OPTION_UPDATE_DETAILS && farmer) {
        // Option 1: Update My Details (if already registered)
        ussdService.updateSession(sessionId, { state: STATE_FARMER_UPDATE_MENU });
        response = ussdService.getUpdateDetailsMenu(currentLanguage);
      } else if (input === MENU_OPTION_REQUEST_SERVICE) {
        // Option 2: Request Service (coming soon)
        response = ussdService.getFeatureComingSoonMessage(
          currentLanguage,
          ussdService.getTranslatedMessage('menu_option_request_service', currentLanguage)
        );
        ussdService.updateSession(sessionId, { state: STATE_SUB_MENU_ACK });
      } else if (input === MENU_OPTION_MY_REQUEST_STATUS) {
        // Option 3: My Request Status (coming soon)
        response = ussdService.getFeatureComingSoonMessage(
          currentLanguage,
          ussdService.getTranslatedMessage('menu_option_my_request_status', currentLanguage)
        );
        ussdService.updateSession(sessionId, { state: STATE_SUB_MENU_ACK });
      } else if (input === MENU_OPTION_CHANGE_LANGUAGE) {
        // Option 4: Change Language
        response = ussdService.getLanguageSelectionMenu();
        ussdService.updateSession(sessionId, { state: STATE_LANGUAGE_SELECTION });
      } else if (input === MENU_OPTION_EXIT) {
        // Option 5: Exit
        response = ussdService.getTranslatedMessage('exit_message', currentLanguage);
        responseType = USSD_END;
        ussdService.clearSession(sessionId);
      } else {
        // Invalid input in main menu or trying to register while already registered/vice versa
        response = ussdService.getTranslatedMessage('invalid_main_menu_option', currentLanguage);
        response += `\n${await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber)}`;
      }
    } else if (session.state === STATE_FARMER_REG_NAME) {
      // Collecting farmer's name
      if (input.length > 0 && input.length <= MAX_NAME_LENGTH) {
        ussdService.updateSession(sessionId, {
          farmerRegData: { ...session.farmerRegData, name: input },
          state: STATE_FARMER_REG_PROVINCE,
        });
        const { menu } = ussdService.getProvincesMenu(currentLanguage);
        response = menu;
      } else if (input === NAV_BACK_TO_MAIN_MENU) {
        ussdService.updateSession(sessionId, { state: STATE_MAIN_MENU, farmerRegData: {} });
        response = await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber);
      } else {
        response = ussdService.getTranslatedMessage('invalid_name_input', currentLanguage, { max: MAX_NAME_LENGTH });
      }
    } else if (session.state === STATE_FARMER_REG_PROVINCE) {
      // Selecting Province
      const { menu, data: provinces } = ussdService.getProvincesMenu(currentLanguage);
      const selectedIndex = parseInt(input, 10) - 1;
      if (selectedIndex >= 0 && selectedIndex < provinces.length) {
        // CORRECT: selectedProvince is now the string directly
        const selectedProvince = provinces[selectedIndex]; 
        ussdService.updateSession(sessionId, {
          farmerRegData: { ...session.farmerRegData, province: selectedProvince },
          state: STATE_FARMER_REG_DISTRICT,
        });
        const { menu: districtMenu } = ussdService.getDistrictsMenu(currentLanguage, selectedProvince);
        response = districtMenu;
      } else if (input === NAV_BACK_TO_MAIN_MENU) {
        ussdService.updateSession(sessionId, { state: STATE_MAIN_MENU, farmerRegData: {} });
        response = await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber);
      } else {
        response = ussdService.getTranslatedMessage('invalid_selection', currentLanguage);
        response += `\n${menu}`;
      }
    } else if (session.state === STATE_FARMER_REG_DISTRICT) {
      // Selecting District
      const provinceName = session.farmerRegData.province; // This is already the string name
      const { menu, data: districts } = ussdService.getDistrictsMenu(currentLanguage, provinceName);
      const selectedIndex = parseInt(input, 10) - 1;
      if (selectedIndex >= 0 && selectedIndex < districts.length) {
        // CORRECT: selectedDistrict is now the string directly
        const selectedDistrict = districts[selectedIndex]; 
        ussdService.updateSession(sessionId, {
          farmerRegData: { ...session.farmerRegData, district: selectedDistrict },
          state: STATE_FARMER_REG_SECTOR,
        });
        const { menu: sectorMenu } = ussdService.getSectorsMenu(currentLanguage, selectedDistrict);
        response = sectorMenu;
      } else if (input === NAV_BACK_TO_MAIN_MENU) {
        // Go back to Province selection
        ussdService.updateSession(sessionId, { state: STATE_FARMER_REG_PROVINCE, farmerRegData: { ...session.farmerRegData, district: null } });
        const { menu } = ussdService.getProvincesMenu(currentLanguage);
        response = menu;
      } else {
        response = ussdService.getTranslatedMessage('invalid_selection', currentLanguage);
        response += `\n${menu}`;
      }
    } else if (session.state === STATE_FARMER_REG_SECTOR) {
      // Selecting Sector
      const districtName = session.farmerRegData.district; // This is already the string name
      const { menu, data: sectors } = ussdService.getSectorsMenu(currentLanguage, districtName);
      const selectedIndex = parseInt(input, 10) - 1;
      if (selectedIndex >= 0 && selectedIndex < sectors.length) {
        // CORRECT: selectedSector is now the string directly
        const selectedSector = sectors[selectedIndex]; 
        ussdService.updateSession(sessionId, {
          farmerRegData: { ...session.farmerRegData, sector: selectedSector },
          state: STATE_FARMER_REG_CELL,
        });
        const { menu: cellMenu } = ussdService.getCellsMenu(currentLanguage, selectedSector);
        response = cellMenu;
      } else if (input === NAV_BACK_TO_MAIN_MENU) {
        // Go back to District selection
        ussdService.updateSession(sessionId, { state: STATE_FARMER_REG_DISTRICT, farmerRegData: { ...session.farmerRegData, sector: null } });
        const { menu } = ussdService.getDistrictsMenu(currentLanguage, session.farmerRegData.province);
        response = menu;
      } else {
        response = ussdService.getTranslatedMessage('invalid_selection', currentLanguage);
        response += `\n${menu}`;
      }
    } else if (session.state === STATE_FARMER_REG_CELL) {
      // Selecting Cell and completing registration
      const sectorName = session.farmerRegData.sector; // This is already the string name
      const { menu, data: cells } = ussdService.getCellsMenu(currentLanguage, sectorName);
      const selectedIndex = parseInt(input, 10) - 1;

      if (selectedIndex >= 0 && selectedIndex < cells.length) {
        // CORRECT: selectedCell is now the string directly
        const selectedCell = cells[selectedIndex]; 
        const farmerData = {
          phoneNumber,
          name: session.farmerRegData.name,
          province: session.farmerRegData.province,
          district: session.farmerRegData.district,
          sector: session.farmerRegData.sector,
          cell: selectedCell,
          locationText: `${session.farmerRegData.province}, ${session.farmerRegData.district}, ${session.farmerRegData.sector}, ${selectedCell}`, // For backward compatibility/summary
        };

        const registeredFarmer = await farmerService.registerFarmer(
          farmerData.phoneNumber,
          farmerData.name,
          farmerData.province,
          farmerData.district,
          farmerData.sector,
          farmerData.cell
        );

        if (registeredFarmer) {
          response = ussdService.getTranslatedMessage('farmer_registration_success', currentLanguage, {
            name: farmerData.name,
            province: farmerData.province,
            district: farmerData.district,
            sector: farmerData.sector,
            cell: farmerData.cell,
          });
          responseType = USSD_END;
          ussdService.clearSession(sessionId); // Clear session on successful registration
        } else {
          // This path should ideally be caught by findFarmerByPhoneNumber earlier,
          // but as a fallback, if DB creation fails for other reasons.
          response = ussdService.getTranslatedMessage('farmer_registration_failed', currentLanguage);
          responseType = USSD_END;
          ussdService.clearSession(sessionId);
        }
      } else if (input === NAV_BACK_TO_MAIN_MENU) {
        // Go back to Sector selection
        ussdService.updateSession(sessionId, { state: STATE_FARMER_REG_SECTOR, farmerRegData: { ...session.farmerRegData, cell: null } });
        const { menu } = ussdService.getSectorsMenu(currentLanguage, session.farmerRegData.district);
        response = menu;
      } else {
        response = ussdService.getTranslatedMessage('invalid_selection', currentLanguage);
        response += `\n${menu}`;
      }
    } else if (session.state === STATE_SUB_MENU_ACK) {
      // User acknowledged a "coming soon" message or "already registered" message
      if (input === NAV_BACK_TO_MAIN_MENU) {
        ussdService.updateSession(sessionId, { state: STATE_MAIN_MENU });
        response = await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber);
      } else {
        response = ussdService.getTranslatedMessage('invalid_main_menu_option', currentLanguage);
        response += `\n${await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber)}`;
        ussdService.updateSession(sessionId, { state: STATE_MAIN_MENU });
      }
    } else if (session.state === STATE_FARMER_UPDATE_MENU) {
      // Farmer update menu (placeholder)
      const farmer = await farmerService.findFarmerByPhoneNumber(phoneNumber);
      if (!farmer) { // Should not happen if flow is correct, but for safety
        ussdService.updateSession(sessionId, { state: STATE_MAIN_MENU });
        response = ussdService.getTranslatedMessage('farmer_already_registered', currentLanguage) +
                   `\n${await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber)}`;
      } else if (input === '1') { // Update Name
        ussdService.updateSession(sessionId, { state: STATE_FARMER_REG_NAME, farmerRegData: { name: farmer.name } }); // Reuse name state for update
        response = ussdService.getFarmerNamePrompt(currentLanguage);
      } else if (input === '2') { // Update Location (re-use the full location flow)
        ussdService.updateSession(sessionId, {
          state: STATE_FARMER_REG_PROVINCE,
          farmerRegData: {
            name: farmer.name, // Keep existing name
            province: farmer.province, district: farmer.district, sector: farmer.sector, cell: farmer.cell
          }
        });
        const { menu } = ussdService.getProvincesMenu(currentLanguage);
        response = menu;
      } else if (input === NAV_BACK_TO_MAIN_MENU) {
        ussdService.updateSession(sessionId, { state: STATE_MAIN_MENU });
        response = await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber);
      } else {
        response = ussdService.getTranslatedMessage('invalid_selection', currentLanguage);
        response += `\n${ussdService.getUpdateDetailsMenu(currentLanguage)}`;
      }
    }

  } catch (error) {
    console.error(`USSD Error for session ${sessionId}:`, error);
    response = ussdService.getTranslatedMessage('error_generic', currentLanguage);
    responseType = USSD_END;
    ussdService.clearSession(sessionId);
  }

  res.send(ussdService.buildUssdResponse(response, responseType));
};

module.exports = {
  handleUssdRequest,
};
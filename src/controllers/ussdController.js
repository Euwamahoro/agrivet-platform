const ussdService = require('../services/ussdService');
const farmerService = require('../services/farmerService'); 
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
  const { sessionId, phoneNumber, text = '' } = req.body;
  const session = ussdService.getSession(sessionId);

  let response = '';
  let responseType = USSD_CONTINUE;
  let currentLanguage = session.language || LANG_EN_CODE; 

  try {
    const input = text.split('*').pop(); 

    if (text === '') {
      response = ussdService.getLanguageSelectionMenu();
      ussdService.updateSession(sessionId, { state: STATE_LANGUAGE_SELECTION });
    } else if (session.state === STATE_LANGUAGE_SELECTION) {
      let selectedLanguageCode;
      switch (input) {
        case LANG_EN_OPTION: selectedLanguageCode = LANG_EN_CODE; break;
        case LANG_RW_OPTION: selectedLanguageCode = LANG_RW_CODE; break;
        case LANG_SW_OPTION: selectedLanguageCode = LANG_SW_CODE; break;
        default:
          response = ussdService.getTranslatedMessage('invalid_language_option', currentLanguage);
          response += `\n${ussdService.getLanguageSelectionMenu()}`;
          return res.send(ussdService.buildUssdResponse(response, responseType));
      }
      ussdService.updateSession(sessionId, {
        language: selectedLanguageCode,
        state: STATE_MAIN_MENU,
      });
      currentLanguage = selectedLanguageCode;
      response = await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber);
    } else if (session.state === STATE_MAIN_MENU) {
      currentLanguage = session.language;

      const farmer = await farmerService.findFarmerByPhoneNumber(phoneNumber);

      if (input === MENU_OPTION_REGISTER_FARMER && !farmer) {
        ussdService.updateSession(sessionId, { state: STATE_FARMER_REG_NAME, farmerRegData: {} });
        response = ussdService.getFarmerNamePrompt(currentLanguage);
      } else if (input === MENU_OPTION_UPDATE_DETAILS && farmer) {
        ussdService.updateSession(sessionId, { state: STATE_FARMER_UPDATE_MENU });
        response = ussdService.getUpdateDetailsMenu(currentLanguage);
      } else if (input === MENU_OPTION_REQUEST_SERVICE) {
        response = ussdService.getFeatureComingSoonMessage(
          currentLanguage,
          ussdService.getTranslatedMessage('menu_option_request_service', currentLanguage)
        );
        ussdService.updateSession(sessionId, { state: STATE_SUB_MENU_ACK });
      } else if (input === MENU_OPTION_MY_REQUEST_STATUS) {
        response = ussdService.getFeatureComingSoonMessage(
          currentLanguage,
          ussdService.getTranslatedMessage('menu_option_my_request_status', currentLanguage)
        );
        ussdService.updateSession(sessionId, { state: STATE_SUB_MENU_ACK });
      } else if (input === MENU_OPTION_CHANGE_LANGUAGE) {
        response = ussdService.getLanguageSelectionMenu();
        ussdService.updateSession(sessionId, { state: STATE_LANGUAGE_SELECTION });
      } else if (input === MENU_OPTION_EXIT) {
        response = ussdService.getTranslatedMessage('exit_message', currentLanguage);
        responseType = USSD_END;
        ussdService.clearSession(sessionId);
      } else {
        response = ussdService.getTranslatedMessage('invalid_main_menu_option', currentLanguage);
        response += `\n${await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber)}`;
      }
    } else if (session.state === STATE_FARMER_REG_NAME) {
      if (input.length > 0 && input.length <= MAX_NAME_LENGTH) {
        ussdService.updateSession(sessionId, {
          farmerRegData: { ...session.farmerRegData, name: input },
          state: STATE_FARMER_REG_PROVINCE,
        });
        const { menu } = await ussdService.getProvincesMenu(currentLanguage); 
        response = menu;
      } else if (input === NAV_BACK_TO_MAIN_MENU) {
        ussdService.updateSession(sessionId, { state: STATE_MAIN_MENU, farmerRegData: {} });
        response = await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber);
      } else {
        response = ussdService.getTranslatedMessage('invalid_name_input', currentLanguage, { max: MAX_NAME_LENGTH });
      }
    } else if (session.state === STATE_FARMER_REG_PROVINCE) {
      const { menu, data: provinces } = await ussdService.getProvincesMenu(currentLanguage); 
      const selectedIndex = parseInt(input, 10) - 1;
      if (selectedIndex >= 0 && selectedIndex < provinces.length) {
        const selectedProvince = provinces[selectedIndex]; 
        ussdService.updateSession(sessionId, {
          farmerRegData: { 
            ...session.farmerRegData, 
            province: selectedProvince.name, // Store name for display
            provinceCode: selectedProvince.code // Store code for API calls
          },
          state: STATE_FARMER_REG_DISTRICT,
        });
        const { menu: districtMenu } = await ussdService.getDistrictsMenu(currentLanguage, selectedProvince.code);
        response = districtMenu;
      } else if (input === NAV_BACK_TO_MAIN_MENU) {
        ussdService.updateSession(sessionId, { state: STATE_MAIN_MENU, farmerRegData: {} });
        response = await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber);
      } else {
        response = ussdService.getTranslatedMessage('invalid_selection', currentLanguage);
        response += `\n${menu}`;
      }
    } else if (session.state === STATE_FARMER_REG_DISTRICT) {
      const provinceCode = session.farmerRegData.provinceCode; // Use code from session
      const { menu, data: districts } = await ussdService.getDistrictsMenu(currentLanguage, provinceCode); 
      const selectedIndex = parseInt(input, 10) - 1;
      if (selectedIndex >= 0 && selectedIndex < districts.length) {
        const selectedDistrict = districts[selectedIndex]; 
        ussdService.updateSession(sessionId, {
          farmerRegData: { 
            ...session.farmerRegData, 
            district: selectedDistrict.name, // Store name
            districtCode: selectedDistrict.code // Store code
          },
          state: STATE_FARMER_REG_SECTOR,
        });
        const { menu: sectorMenu } = await ussdService.getSectorsMenu(currentLanguage, selectedDistrict.code);
        response = sectorMenu;
      } else if (input === NAV_BACK_TO_MAIN_MENU) {
        ussdService.updateSession(sessionId, { 
          state: STATE_FARMER_REG_PROVINCE, 
          farmerRegData: { ...session.farmerRegData, district: null, districtCode: null } 
        });
        const { menu } = await ussdService.getProvincesMenu(currentLanguage);
        response = menu;
      } else {
        response = ussdService.getTranslatedMessage('invalid_selection', currentLanguage);
        response += `\n${menu}`;
      }
    } else if (session.state === STATE_FARMER_REG_SECTOR) {
      const districtCode = session.farmerRegData.districtCode; 
      const { menu, data: sectors } = await ussdService.getSectorsMenu(currentLanguage, districtCode);
      const selectedIndex = parseInt(input, 10) - 1;
      if (selectedIndex >= 0 && selectedIndex < sectors.length) {
        const selectedSector = sectors[selectedIndex]; 
        ussdService.updateSession(sessionId, {
          farmerRegData: { 
            ...session.farmerRegData, 
            sector: selectedSector.name, // Store name
            sectorCode: selectedSector.code // Store code
          },
          state: STATE_FARMER_REG_CELL,
        });
        const { menu: cellMenu } = await ussdService.getCellsMenu(currentLanguage, selectedSector.code);
        response = cellMenu;
      } else if (input === NAV_BACK_TO_MAIN_MENU) {
        ussdService.updateSession(sessionId, { 
          state: STATE_FARMER_REG_DISTRICT, 
          farmerRegData: { ...session.farmerRegData, sector: null, sectorCode: null } 
        });
        const { menu } = await ussdService.getDistrictsMenu(currentLanguage, session.farmerRegData.provinceCode); 
        response = menu;
      } else {
        response = ussdService.getTranslatedMessage('invalid_selection', currentLanguage);
        response += `\n${menu}`;
      }
    } else if (session.state === STATE_FARMER_REG_CELL) {
      const sectorCode = session.farmerRegData.sectorCode;
      const { menu, data: cells } = await ussdService.getCellsMenu(currentLanguage, sectorCode);
      const selectedIndex = parseInt(input, 10) - 1;

      if (selectedIndex >= 0 && selectedIndex < cells.length) {
        const selectedCell = cells[selectedIndex]; 
        const farmerData = {
          phoneNumber,
          name: session.farmerRegData.name,
          province: session.farmerRegData.province,
          district: session.farmerRegData.district,
          sector: session.farmerRegData.sector,
          cell: selectedCell.name, // Store cell name
          locationText: `${session.farmerRegData.province}, ${session.farmerRegData.district}, ${session.farmerRegData.sector}, ${selectedCell.name}`, 
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
          ussdService.clearSession(sessionId); 
        } else {
          response = ussdService.getTranslatedMessage('farmer_registration_failed', currentLanguage);
          responseType = USSD_END;
          ussdService.clearSession(sessionId);
        }
      } else if (input === NAV_BACK_TO_MAIN_MENU) {
        ussdService.updateSession(sessionId, { 
          state: STATE_FARMER_REG_SECTOR, 
          farmerRegData: { ...session.farmerRegData, cell: null, sectorCode: null } // Reset cell and its parent code
        });
        const { menu } = await ussdService.getSectorsMenu(currentLanguage, session.farmerRegData.districtCode); 
        response = menu;
      } else {
        response = ussdService.getTranslatedMessage('invalid_selection', currentLanguage);
        response += `\n${menu}`;
      }
    } else if (session.state === STATE_SUB_MENU_ACK) {
      if (input === NAV_BACK_TO_MAIN_MENU) {
        ussdService.updateSession(sessionId, { state: STATE_MAIN_MENU });
        response = await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber);
      } else {
        response = ussdService.getTranslatedMessage('invalid_main_menu_option', currentLanguage);
        response += `\n${await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber)}`;
        ussdService.updateSession(sessionId, { state: STATE_MAIN_MENU });
      }
    } else if (session.state === STATE_FARMER_UPDATE_MENU) {
      const farmer = await farmerService.findFarmerByPhoneNumber(phoneNumber);
      if (!farmer) { 
        ussdService.updateSession(sessionId, { state: STATE_MAIN_MENU });
        response = ussdService.getTranslatedMessage('farmer_already_registered', currentLanguage) +
                   `\n${await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber)}`;
      } else if (input === '1') {
        ussdService.updateSession(sessionId, { state: STATE_FARMER_REG_NAME, farmerRegData: { name: farmer.name } }); 
        response = ussdService.getFarmerNamePrompt(currentLanguage);
      } else if (input === '2') { 
        ussdService.updateSession(sessionId, {
          state: STATE_FARMER_REG_PROVINCE,
          farmerRegData: {
            name: farmer.name, 
            province: farmer.province, 
            provinceCode: farmer.provinceCode, 
            district: farmer.district, 
            districtCode: farmer.districtCode,
            sector: farmer.sector, 
            sectorCode: farmer.sectorCode,
            cell: farmer.cell 
          }
        });
        const { menu } = await ussdService.getProvincesMenu(currentLanguage); 
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
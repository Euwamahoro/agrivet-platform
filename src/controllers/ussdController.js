const ussdService = require('../services/ussdService');
const farmerService = require('../services/farmerService');
const serviceRequestService = require('../services/serviceRequestService'); // NEW: Import serviceRequestService
const graduateService = require('../services/graduateService'); // NEW: Import graduateService

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
  STATE_REQUEST_SERVICE_TYPE, // NEW
  STATE_REQUEST_DESCRIPTION,  // NEW
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
  MAX_DESCRIPTION_LENGTH, // NEW
  MENU_OPTION_UPDATE_DETAILS,
  SERVICE_TYPE_AGRONOMY, // NEW
  SERVICE_TYPE_VETERINARY, // NEW
  REQUEST_STATUS_NO_MATCH // NEW
} = require('../utils/constants');

const handleUssdRequest = async (req, res) => {
  const { sessionId, phoneNumber, text = '' } = req.body;
  const session = ussdService.getSession(sessionId);

  let response = '';
  let responseType = USSD_CONTINUE;
  let currentLanguage = session.language || LANG_EN_CODE;

  try {
    const input = text.split('*').pop();

    // Initial dial or language selection flow (remains largely same from Phase 2)
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
    } 
    // Main Menu Interaction
    else if (session.state === STATE_MAIN_MENU) {
      currentLanguage = session.language;
      const farmer = await farmerService.findFarmerByPhoneNumber(phoneNumber);

      if (input === MENU_OPTION_REGISTER_FARMER && !farmer) {
        ussdService.updateSession(sessionId, { state: STATE_FARMER_REG_NAME, farmerRegData: {} });
        response = ussdService.getFarmerNamePrompt(currentLanguage);
      } else if (input === MENU_OPTION_UPDATE_DETAILS && farmer) {
        ussdService.updateSession(sessionId, { state: STATE_FARMER_UPDATE_MENU });
        response = ussdService.getUpdateDetailsMenu(currentLanguage);
      } else if (input === MENU_OPTION_REQUEST_SERVICE) {
        // NEW: Request Service initiation
        if (!farmer) {
          response = ussdService.getFarmerNotRegisteredMessage(currentLanguage);
          ussdService.updateSession(sessionId, { state: STATE_SUB_MENU_ACK }); // Acknowledge, then back to main
        } else {
          ussdService.updateSession(sessionId, { state: STATE_REQUEST_SERVICE_TYPE, serviceRequestData: {} });
          response = ussdService.getServiceTypeMenu(currentLanguage);
        }
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
    } 
    // Farmer Registration Flow (from Phase 3 - remains largely same)
    else if (session.state === STATE_FARMER_REG_NAME) {
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
            province: selectedProvince.name,
            provinceCode: selectedProvince.code
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
      const provinceCode = session.farmerRegData.provinceCode;
      const { menu, data: districts } = await ussdService.getDistrictsMenu(currentLanguage, provinceCode);
      const selectedIndex = parseInt(input, 10) - 1;
      if (selectedIndex >= 0 && selectedIndex < districts.length) {
        const selectedDistrict = districts[selectedIndex];
        ussdService.updateSession(sessionId, {
          farmerRegData: {
            ...session.farmerRegData,
            district: selectedDistrict.name,
            districtCode: selectedDistrict.code
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
            sector: selectedSector.name,
            sectorCode: selectedSector.code
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
          cell: selectedCell.name,
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
          farmerRegData: { ...session.farmerRegData, cell: null, sectorCode: null }
        });
        const { menu } = await ussdService.getSectorsMenu(currentLanguage, session.farmerRegData.districtCode);
        response = menu;
      } else {
        response = ussdService.getTranslatedMessage('invalid_selection', currentLanguage);
        response += `\n${menu}`;
      }
    }
    // Acknowledge Sub-Menu (e.g., "coming soon" messages)
    else if (session.state === STATE_SUB_MENU_ACK) {
      if (input === NAV_BACK_TO_MAIN_MENU) {
        ussdService.updateSession(sessionId, { state: STATE_MAIN_MENU });
        response = await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber);
      } else {
        response = ussdService.getTranslatedMessage('invalid_main_menu_option', currentLanguage);
        response += `\n${await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber)}`;
        ussdService.updateSession(sessionId, { state: STATE_MAIN_MENU });
      }
    }
    // Update Farmer Details Flow (from Phase 3 - remains largely same)
    else if (session.state === STATE_FARMER_UPDATE_MENU) {
      const farmer = await farmerService.findFarmerByPhoneNumber(phoneNumber);
      if (!farmer) {
        ussdService.updateSession(sessionId, { state: STATE_MAIN_MENU });
        response = ussdService.getTranslatedMessage('farmer_already_registered', currentLanguage) +
                   `\n${await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber)}`;
      } else if (input === '1') { // Update Name
        ussdService.updateSession(sessionId, { state: STATE_FARMER_REG_NAME, farmerRegData: { name: farmer.name } });
        response = ussdService.getFarmerNamePrompt(currentLanguage);
      } else if (input === '2') { // Update Location (re-use the full location flow)
        ussdService.updateSession(sessionId, {
          state: STATE_FARMER_REG_PROVINCE,
          farmerRegData: {
            name: farmer.name,
            province: farmer.province,
            provinceCode: farmer.provinceCode, // Assumed to be in DB for update
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
    // NEW: Service Request Flow
    else if (session.state === STATE_REQUEST_SERVICE_TYPE) {
      const selectedServiceTypeOption = input;
      let serviceType;
      if (selectedServiceTypeOption === '1') {
        serviceType = SERVICE_TYPE_AGRONOMY;
      } else if (selectedServiceTypeOption === '2') {
        serviceType = SERVICE_TYPE_VETERINARY;
      } else if (input === NAV_BACK_TO_MAIN_MENU) {
        ussdService.updateSession(sessionId, { state: STATE_MAIN_MENU, serviceRequestData: {} });
        response = await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber);
        return res.send(ussdService.buildUssdResponse(response, responseType));
      } else {
        response = ussdService.getTranslatedMessage('invalid_service_type', currentLanguage);
        response += `\n${ussdService.getServiceTypeMenu(currentLanguage)}`;
        return res.send(ussdService.buildUssdResponse(response, responseType));
      }
      ussdService.updateSession(sessionId, {
        serviceRequestData: { ...session.serviceRequestData, serviceType },
        state: STATE_REQUEST_DESCRIPTION,
      });
      response = ussdService.getIssueDescriptionPrompt(currentLanguage);
    } else if (session.state === STATE_REQUEST_DESCRIPTION) {
      if (input === NAV_BACK_TO_MAIN_MENU) {
        ussdService.updateSession(sessionId, { state: STATE_MAIN_MENU, serviceRequestData: {} });
        response = await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber);
        return res.send(ussdService.buildUssdResponse(response, responseType));
      }

      if (input.length === 0 || input.length > MAX_DESCRIPTION_LENGTH) {
        response = ussdService.getTranslatedMessage('invalid_description_input', currentLanguage, { max: MAX_DESCRIPTION_LENGTH });
        return res.send(ussdService.buildUssdResponse(response, responseType));
      }

      const farmer = await farmerService.findFarmerByPhoneNumber(phoneNumber);
      if (!farmer) {
        // This state should only be reached by registered farmers, but fallback for safety
        response = ussdService.getTranslatedMessage('farmer_not_registered', currentLanguage);
        responseType = USSD_END;
        ussdService.clearSession(sessionId);
        return res.send(ussdService.buildUssdResponse(response, responseType));
      }

      const serviceType = session.serviceRequestData.serviceType;
      const description = input;

      // Prepare farmer's location for graduate matching
      const farmerLocation = {
        province: farmer.province,
        district: farmer.district,
        sector: farmer.sector,
        cell: farmer.cell,
      };

      let assignedGraduate = null;
      let requestStatus = REQUEST_STATUS_NO_MATCH; // Default to no match

      try {
        assignedGraduate = await graduateService.findAvailableGraduates(farmerLocation, serviceType);

        if (assignedGraduate) {
          requestStatus = 'assigned'; // Assuming 'assigned' is the status for a successful match
          const serviceRequest = await serviceRequestService.createServiceRequest(
            farmer.id,
            assignedGraduate.id,
            serviceType,
            description,
            requestStatus
          );
          response = ussdService.getTranslatedMessage('service_request_success', currentLanguage, {
            graduateName: assignedGraduate.name,
            requestId: serviceRequest.id.substring(0, 8), // Shorten ID for USSD display
          });
        } else {
          // No graduate found, but log the request
          const serviceRequest = await serviceRequestService.createServiceRequest(
            farmer.id,
            null, // No graduate assigned
            serviceType,
            description,
            REQUEST_STATUS_NO_MATCH
          );
          response = ussdService.getTranslatedMessage('service_request_no_match', currentLanguage, {
            requestId: serviceRequest.id.substring(0, 8), // Shorten ID for USSD display
          });
        }
        responseType = USSD_END; // End session after request submission
        ussdService.clearSession(sessionId);
      } catch (matchError) {
        console.error(`Error during graduate matching or request creation for session ${sessionId}:`, matchError);
        response = ussdService.getTranslatedMessage('service_request_failed', currentLanguage);
        responseType = USSD_END;
        ussdService.clearSession(sessionId);
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
const ussdService = require('../services/ussdService');
const farmerService = require('../services/farmerService');
const serviceRequestService = require('../services/serviceRequestService');
const graduateService = require('../services/graduateService');
const weatherService = require('../services/weatherService');

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
  STATE_REQUEST_SERVICE_TYPE,
  STATE_REQUEST_DESCRIPTION,
  STATE_WEATHER_INFO,
  STATE_FARMING_TIPS,
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
  MENU_OPTION_WEATHER_INFO,
  MENU_OPTION_FARMING_TIPS,
   STATE_MY_REQUEST_STATUS,
  NAV_BACK_TO_MAIN_MENU,
  MAX_NAME_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  MENU_OPTION_UPDATE_DETAILS,
  SERVICE_TYPE_AGRONOMY,
  SERVICE_TYPE_VETERINARY,
  REQUEST_STATUS_NO_MATCH
} = require('../utils/constants');

const handleUssdRequest = async (req, res) => {
  const { sessionId, phoneNumber, text = '' } = req.body;
  const session = ussdService.getSession(sessionId);

  let response = '';
  let responseType = USSD_CONTINUE;
  let currentLanguage = session.language || LANG_EN_CODE;

  try {
    const input = text.split('*').pop();

    // Initial dial or language selection flow
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

      console.log(`DEBUG: Main menu input: "${input}", Farmer exists: ${!!farmer}`);

      if (input === MENU_OPTION_REGISTER_FARMER && !farmer) {
        console.log('DEBUG: Taking registration path');
        ussdService.updateSession(sessionId, { state: STATE_FARMER_REG_NAME, farmerRegData: {} });
        response = ussdService.getFarmerNamePrompt(currentLanguage);
      } else if (input === MENU_OPTION_UPDATE_DETAILS && farmer) {
        console.log('DEBUG: Taking update path');
        ussdService.updateSession(sessionId, { state: STATE_FARMER_UPDATE_MENU });
        response = ussdService.getUpdateDetailsMenu(currentLanguage);
      } else if (input === MENU_OPTION_REQUEST_SERVICE) {
        if (!farmer) {
          response = ussdService.getFarmerNotRegisteredMessage(currentLanguage);
          ussdService.updateSession(sessionId, { state: STATE_SUB_MENU_ACK });
        } else {
          ussdService.updateSession(sessionId, { state: STATE_REQUEST_SERVICE_TYPE, serviceRequestData: {} });
          response = ussdService.getServiceTypeMenu(currentLanguage);
        }
      } else if (input === MENU_OPTION_FARMING_TIPS) {  // This should be '3'
  ussdService.updateSession(sessionId, { state: STATE_FARMING_TIPS });
  response = ussdService.getFarmingTipsMenu(currentLanguage);
} else if (input === MENU_OPTION_WEATHER_INFO) {
  if (!farmer) {
    response = ussdService.getFarmerNotRegisteredMessage(currentLanguage);
    ussdService.updateSession(sessionId, { state: STATE_SUB_MENU_ACK });
  } else {
    // Directly get weather without loading message
    ussdService.updateSession(sessionId, { state: STATE_WEATHER_INFO });
    const weatherInfo = await weatherService.getWeatherForFarmer(phoneNumber);
    if (weatherInfo) {
      response = weatherInfo;
    } else {
      response = ussdService.getTranslatedMessage('weather_info_unavailable', currentLanguage);
    }
    responseType = USSD_END;
    ussdService.clearSession(sessionId);
  }
} else if (input === MENU_OPTION_MY_REQUEST_STATUS) {
  if (!farmer) {
    response = ussdService.getFarmerNotRegisteredMessage(currentLanguage);
    ussdService.updateSession(sessionId, { state: STATE_SUB_MENU_ACK });
  } else {
    ussdService.updateSession(sessionId, { state: STATE_MY_REQUEST_STATUS });
    response = await ussdService.getRequestStatusDisplay(currentLanguage, phoneNumber);
  }
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
    // Farmer Registration Flow
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
        response = await ussdService.getRequestStatusDisplay(currentLanguage, phoneNumber);
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

        // CHECK IF THIS IS AN UPDATE OR NEW REGISTRATION
        const existingFarmer = await farmerService.findFarmerByPhoneNumber(phoneNumber);
        
        let result;
        let isUpdate = false;
        
        if (existingFarmer) {
          // UPDATE EXISTING FARMER
          console.log('DEBUG: Updating existing farmer');
          isUpdate = true;
          result = await farmerService.updateFarmer(phoneNumber, {
            name: farmerData.name,
            province: farmerData.province,
            district: farmerData.district,
            sector: farmerData.sector,
            cell: farmerData.cell,
            locationText: farmerData.locationText
          });
        } else {
          // REGISTER NEW FARMER
          console.log('DEBUG: Registering new farmer');
          result = await farmerService.registerFarmer(
            farmerData.phoneNumber,
            farmerData.name,
            farmerData.province,
            farmerData.district,
            farmerData.sector,
            farmerData.cell
          );
        }

        if (result) {
          response = ussdService.getTranslatedMessage(
            isUpdate ? 'farmer_update_success' : 'farmer_registration_success', 
            currentLanguage, 
            {
              name: farmerData.name,
              province: farmerData.province,
              district: farmerData.district,
              sector: farmerData.sector,
              cell: farmerData.cell,
            }
          );
          responseType = USSD_END;
          ussdService.clearSession(sessionId);
        } else {
          response = ussdService.getTranslatedMessage(
            isUpdate ? 'farmer_update_failed' : 'farmer_registration_failed', 
            currentLanguage
          );
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
    // Acknowledge Sub-Menu
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
    // Update Farmer Details Flow
    else if (session.state === STATE_FARMER_UPDATE_MENU) {
      const farmer = await farmerService.findFarmerByPhoneNumber(phoneNumber);
      if (!farmer) {
        ussdService.updateSession(sessionId, { state: STATE_MAIN_MENU });
        response = ussdService.getTranslatedMessage('farmer_already_registered', currentLanguage) +
                   `\n${await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber)}`;
      } else if (input === '1') { // Update Name
        ussdService.updateSession(sessionId, { state: STATE_FARMER_REG_NAME, farmerRegData: { name: farmer.name } });
        response = ussdService.getFarmerNamePrompt(currentLanguage);
      } else if (input === '2') { // Update Location
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
    // Service Request Flow - UPDATED TO INCLUDE FARMER PHONE
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
        response = ussdService.getTranslatedMessage('farmer_not_registered', currentLanguage);
        responseType = USSD_END;
        ussdService.clearSession(sessionId);
        return res.send(ussdService.buildUssdResponse(response, responseType));
      }

      const serviceType = session.serviceRequestData.serviceType;
      const description = input;

      console.log('🔍 DEBUG - Farmer information for service request:');
      console.log('   Farmer ID:', farmer.id);
      console.log('   Farmer Phone:', farmer.phone_number);
      console.log('   Farmer Name:', farmer.name);
      console.log('   Farmer Location:', {
          province: farmer.province,
          district: farmer.district,
          sector: farmer.sector,
          cell: farmer.cell
  });
  console.log('   Service Type:', serviceType);
  console.log('   Description:', description);

      const farmerLocation = {
        province: farmer.province,
        district: farmer.district,
        sector: farmer.sector,
        cell: farmer.cell,
      };

      let assignedGraduate = null;
      let requestStatus = REQUEST_STATUS_NO_MATCH;

      try {
        assignedGraduate = await graduateService.findAvailableGraduates(farmerLocation, serviceType);

        if (assignedGraduate) {
          requestStatus = 'assigned';
          console.log('🎯 DEBUG - Creating service request WITH graduate assignment');

          
          // UPDATED: Now passing farmer.phoneNumber as second parameter
          const serviceRequest = await serviceRequestService.createServiceRequest(
            farmer.id,
            farmer.phoneNumber,
            assignedGraduate.id,
            serviceType,
            description,
            requestStatus
          );
          console.log('✅ DEBUG - Service request created:', serviceRequest.id);
          response = ussdService.getTranslatedMessage('service_request_success', currentLanguage, {
            graduateName: assignedGraduate.name,
            requestId: serviceRequest.id.substring(0, 8),
          });
        } else {
          // UPDATED: Now passing farmer.phoneNumber as second parameter
          const serviceRequest = await serviceRequestService.createServiceRequest(
            farmer.id,
            farmer.phoneNumber, // ADDED: Farmer phone for sync
            null,
            serviceType,
            description,
            REQUEST_STATUS_NO_MATCH
          );
          response = ussdService.getTranslatedMessage('service_request_no_match', currentLanguage, {
            requestId: serviceRequest.id.substring(0, 8),
          });
        }
        responseType = USSD_END;
        ussdService.clearSession(sessionId);
      } catch (matchError) {
        console.error(`Error during graduate matching or request creation for session ${sessionId}:`, matchError);
        response = ussdService.getTranslatedMessage('service_request_failed', currentLanguage);
        responseType = USSD_END;
        ussdService.clearSession(sessionId);
      }
    }
    // Weather Information Flow
    else if (session.state === STATE_WEATHER_INFO) {
      try {
        console.log(`🌤️ Getting weather for farmer: ${phoneNumber}`);
        const weatherInfo = await weatherService.getWeatherForFarmer(phoneNumber);
        if (weatherInfo) {
          response = weatherInfo;
        } else {
          response = ussdService.getTranslatedMessage('weather_info_unavailable', currentLanguage);
        }
        responseType = USSD_END;
        ussdService.clearSession(sessionId);
      } catch (error) {
        console.error('Weather service error:', error);
        response = ussdService.getTranslatedMessage('weather_service_error', currentLanguage);
        responseType = USSD_END;
        ussdService.clearSession(sessionId);
      }
    }
    // Farming Tips Flow
    else if (session.state === STATE_FARMING_TIPS) {
      if (input === NAV_BACK_TO_MAIN_MENU) {
        ussdService.updateSession(sessionId, { state: STATE_MAIN_MENU });
        response = await ussdService.getDynamicMainMenu(currentLanguage, phoneNumber);
      } else if (input === '1') {
        response = ussdService.getTranslatedMessage('farming_tip_maize', currentLanguage);
        responseType = USSD_END;
        ussdService.clearSession(sessionId);
      } else if (input === '2') {
        response = ussdService.getTranslatedMessage('farming_tip_beans', currentLanguage);
        responseType = USSD_END;
        ussdService.clearSession(sessionId);
      } else if (input === '3') {
        response = ussdService.getTranslatedMessage('farming_tip_soil', currentLanguage);
        responseType = USSD_END;
        ussdService.clearSession(sessionId);
      } else if (input === '4') {
        response = ussdService.getTranslatedMessage('farming_tip_livestock', currentLanguage);
        responseType = USSD_END;
        ussdService.clearSession(sessionId);
      } else {
        response = ussdService.getTranslatedMessage('invalid_selection', currentLanguage);
        response += `\n${ussdService.getFarmingTipsMenu(currentLanguage)}`;
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
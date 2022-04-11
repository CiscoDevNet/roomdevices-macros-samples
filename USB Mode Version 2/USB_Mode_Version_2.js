/********************************************************
Copyright (c) 2022 Cisco and/or its affiliates.
This software is licensed to you under the terms of the Cisco Sample
Code License, Version 1.1 (the "License"). You may obtain a copy of the
License at
               https://developer.cisco.com/docs/licenses
All use of the material herein must be in accordance with the terms of
the License. All rights not expressly granted by the License are
reserved. Unless required by applicable law or agreed to separately in
writing, software distributed under the License is distributed on an "AS
IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
or implied.
*********************************************************
 * Project Lead:      	Enrico Conedera
 *                    	Senior Technical Marketing Engineer
 *                    	econeder@cisco.com
 *                    	Cisco Systems
 * 
 * Consulting Engineer: John Yost
 *                    	Technical Marketing Engineer
 *                    	johyost@cisco.com
 *                    	Cisco Systems
 * 
 * Macro Author:      	Robert(Bobby) McGonigle Jr
 *                    	Technical Marketing Engineer
 *                    	bomcgoni@cisco.com
 *                    	Cisco Systems
 * 
 * Version: 2-2-11
 * Released: 03/24/21
 * Last Update: 2/25/2022
 *    
 *    This USB Mode macro requires additional hardware for full operation
 *       Please review the setup documentation before you proceed
 * 
 *    As a macro, the features and functions of USB mode are not supported by Cisco TAC
 * 
 *    Hardware and Software support are provided by their respective manufacturers 
 *      and the service agreements they offer
 *    
 *    Should you need assistance with USB Mode, please reference the documentation 
 *      and connect to our Project USB space on Webex. There are over 1500 Partners, 
 *      Integrators and Customers alike sharing their experience and ideas.
 *        To start chatting with your peers, open this link in a browser and 
 *          join the community
 *          https://eurl.io/#L6Rcn39Rn
 * 
 * Script Dependencies: 
 *    Memory_Storage
 *    - Memory Storage will automatically generate when this script loads
 *    - This script is your endpoint's original configuration, used to restore the endpoint when USB mode is disabled
 * 
 * Special thanks to Zacharie Gignac from Université Laval in Canada
 *   - His contributions to the memory storage functionality are invaluable
 *   - To use memory functions in your Macros go to
 *      - https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/tree/master/Macro%20Memory%20Storage
 ********************************************************/
import xapi from 'xapi';

//[USB Mode Configuration Start]************************/
const usbWelcomePrompt = true;                        // Default Value: true; Accepted Values: <true, false>

const hideCustomPanels_inUSBMode = false;             // Default Value: false; Accepted Values: <true, false>
const hideCustomPanels_inUSBMode_PanelIds = [];       // Example Format: ["panel_1", "panel_2", "panel_3", "panel_Etc"]

const hideCustomPanels_inDefaultMode = false;         // Default Value: false; Accepted Values: <true, false>
const hideCustomPanels_inDefaultMode_PanelIds = [];   // Example Format: ["panel_4", "panel_5", "panel_6"]

const screenShare_Mode = "standard";                  // Default Value: "standard"; Accepted Values: <"standard", "auto">
const continuousShare_Mode = false;                   // Default Value: false; Accepted Values: <true, false>

const sx80_Mx700_800_videoOutput_Override = "Third"   // Default Value: "Third"; Accepted Values: <"Second", "Third">

const touchAvatarCorrection_Mode = true;              // Default Value: true; Accepted Values: <true, false>

const pinProtection_Mode = false;                     // Default Value: false; Accepted Values: <true, false>
const pinProtection_Pin = "0000";                     // Default Value: "0000"; Accepted Values: 4-8 digits

/* Text Localization - Change the options below to match your language */

//USB Mode Welcome Message Prompt
const usbWelcomePrompt_Title = "USB Passthrough Mode";
const usbWelcomePrompt_Text = "You can use all of your cameras and microphones normally. Be sure to choose USB camera and USB microphone in your conferencing software application. DO NOT ADJUST SELFVIEW."
const usbWelcomePrompt_Duration = 15; // In Seconds
const usbWelcomePrompt_Dismiss = "Dismiss"

//HDMI Signal Not Found Prompt
const missingSourceText_Title = "No HDMI Input Detected"
const missingSourceText_Text = "Make sure your HDMI Presentation Source and USB Cable are connected to your device before selecting \"Enable USB Mode\""
const missingSourceText_Duration = 20; // In Seconds

//Pin Protection Mode Message Prompts
const pinProtection_Prompt_Duration = 30; // In Seconds

const pinProtection_FlavorText_Title = "Enter Pin to Unlock";
const pinProtection_FlavorText_Text = "USB mode has been pin protected by a system administrator.<p>Please enter the 4-8 digit numeric pin to unlock";
const pinProtection_FlavorText_Placeholder = "4-8 Digit Pin";
const pinProtection_FlavorText_SubmitButton = "Enter";

const pinProtection_UnlockText_Title = "USB Mode Unlocked";
const pinProtection_UnlockText_Text = "Enjoy your meeting";

const pinProtection_Fail_Title = "Invalid Pin, Try Again";
//[USB Mode Configuration End]************************/

//DO NOT EDIT below this LINE. You do so at your own risk :)

//*****[General]************************/
const version = '2-2-11'

var sysInfo;
class Scope {
  constructor(compatibility, system) {
    this.compatibilityLevel = compatibility;
    this.system = system
  }
  remit() {
    return (this)
  }
}

const connect = {
  'Space': 'PROJECT: USB Mode (External)',
  'SpaceURL': 'https://eurl.io/#L6Rcn39Rn',
  'Info': 'Join us in the project USB space to connect with other integrators, devs, partners and customers using USB mode'
}

//*****[UI interactions]************************/
xapi.event.on('UserInterface Extensions Panel Clicked', (event) => {
  switch (event.PanelId) {
    case 'prjUSB_widget_disabled':
      xapi.Config.Video.Monitors.get().then((mode) => {
        if (mode != 'Auto') {
          checkForPin()
        } else {
          monitorOnAutoError()
        }
      })
      break;
    case 'prjUSB_widget_enabled':
      runDefaults()
      swapUI(false)
      if (continuousShare_Mode.toString() == "false" ? true : false) {
        handleDisconnectMessage = true;
        xapi.Command.Presentation.Stop()
      }
      break;
    default:
      break;
  }
})
//*****[Standby]***********************************/
xapi.status.on('Standby State', (status) => {
  switch (status) {
    case 'Standby':
      runDefaults()
      swapUI(false)
      break;
    default:
      break;
  }
})

//*****[Init]***********************************/
async function init() {
  await memoryInit()
  let checkMonitorMode = await xapi.Config.Video.Monitors.get()
  if (checkMonitorMode != 'Auto') {
    await checkPlatform().then((platform) => {
      checkCompatibility(platform).then((compatibility) => {
        console.log(`System Detected: "${compatibility.system}". Assigning the "${compatibility.compatibilityLevel}" profile for USB Mode`)
        switch (compatibility.compatibilityLevel) {
          case 'plus':
          case 'pro':
          case 'room55':
            checkUI();
            break;
          case 'native':
            let x = {
              'Error': `This system "${compatibility.system}" is not compatible with "${module.name.replace('./', '')}"`,
              'Message': {
                'Reason': `The "${compatibility.system}" supports USB Passthrough functionality Natively. No need to add 3rd party hardware`,
                'Documentation': ``,
                'Connect': connect
              },
              'NOTE': `USB mode will be deactivated. The UI will not populate and/or be removed `
            }
            switch (compatibility.system) {
              case 'Room Kit Mini':
                x.Message.Documentation = 'https://help.webex.com/en-us/n7qyx51/Using-Cisco-Webex-Room-Kit-Mini-as-a-USB-Camera'
                break;
              case 'Desk Pro':
                x.Message.Documentation = 'https://www.cisco.com/c/dam/en/us/td/docs/telepresence/endpoint/ce914/desk-pro-user-guide-ce914.pdf'
                break
              default:
                break;
            }
            console.debug(x)
            //disableUSBmode()
            break;
          default:
            let y = {
              'Error': `This system "${compatibility.system}" is not compatible with "${module.name.replace('./', '')}"`,
              'Message': {
                'NOTE': `USB mode will be deactivated. The UI will not populate and/or be removed`,
                'TIP': `Please contact your Cisco Rep, Vendor Partner, Admin or review the Installation Material for USB mode version ${version}`,
                'Connect': connect
              }
            }
            console.debug(y)
            break;
        }
      }).catch((e) => {
        console.debug(e)
      })
    })
    await xapi.status.get('Conference Presentation LocalInstance').then((status) => {
      if (status != '') {
        activeSource = status[0].Source
      } else {
        console.debug('No active presentation found on script start. Defaulting active source to 0')
        activeSource = 0
      }
    })
    await sleep(125)
  } else {
    await monitorOnAutoError()
  }
}

init()
//*****[Functions]******************************/

async function monitorOnAutoError() {
  let message = { Error: 'USB Mode Disabled', Message: 'The configuration "Video Monitors Auto" is not allowed because USB Passthrough will not work correctly. Follow the step-by-step instructions for configuring your codec web interface with manual monitor values and try again.' }
  let macro = module.name.split('./')[1]
  await xapi.Command.UserInterface.Message.Alert.Display({
    Title: message.Error,
    Text: message.Message,
    Duration: 30
  })
  console.error(message)
  await xapi.Command.UserInterface.Extensions.Panel.Remove({ PanelId: 'prjUSB_widget_disabled' }).catch(e => e)
  await xapi.Command.UserInterface.Extensions.Panel.Remove({ PanelId: 'prjUSB_widget_enabled' }).catch(e => e)
  await xapi.Command.Macros.Macro.Deactivate({ Name: macro })
  await xapi.Command.Macros.Runtime.Restart();
}

async function saveDefaults() {
  let defaults = {}
  defaults['monitor_Role'] = {}
  //Save System Specific xApi
  switch (sysInfo.compatibilityLevel) {
    case 'room55':
      await xapi.config.get('Audio Output Line 1').then((response) => {
        defaults['audioOut_1'] = {}
        defaults.audioOut_1['mode'] = response.Mode
        defaults.audioOut_1['outputType'] = response.OutputType
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Audio Output Line 1"',
          'Associated_Function': 'saveDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      break;
    case 'plus':
      await xapi.config.get('Video Output Connector 1 MonitorRole').then((response) => {
        defaults.monitor_Role['conx_1'] = response
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Video Output Connector 1 MonitorRole"',
          'Associated_Function': 'saveDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.get('Video Output Connector 1 Location HorizontalOffset').then((response) => {
        defaults['hzOffset_1'] = response
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "HorizontalOffset 1"',
          'Associated_Function': 'saveDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.get('Audio Microphones AGC').then((response) => {
        defaults['audioMic_AGC'] = response
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Audio Microphones AGC"',
          'Associated_Function': 'saveDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.get('Audio Output Line 1').then((response) => {
        defaults['audioOut_1'] = {}
        defaults.audioOut_1['mode'] = response.Mode
        defaults.audioOut_1['outputType'] = response.OutputType
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Audio Output Line 1"',
          'Associated_Function': 'saveDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      break;
    case 'pro':
      await xapi.config.get('Video Output Connector 1 Location HorizontalOffset').then((response) => {
        defaults['hzOffset_1'] = response
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "HorizontalOffset 1"',
          'Associated_Function': 'saveDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.get('Video Output Connector 3 Location HorizontalOffset').then((response) => {
        defaults['hzOffset_3'] = response
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "HorizontalOffset 2"',
          'Associated_Function': 'saveDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.get('Video Output Connector 1 MonitorRole').then((response) => {
        defaults.monitor_Role['conx_1'] = response
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Video Output Connector 1 MonitorRole"',
          'Associated_Function': 'saveDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.get('Video Output Connector 3 MonitorRole').then((response) => {
        defaults.monitor_Role['conx_3'] = response
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Video Output Connector 3 MonitorRole"',
          'Associated_Function': 'saveDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      break;
    default:
      break;
  }
  //Save Universal xApi
  await xapi.config.get('Video Output Connector 2 Location HorizontalOffset').then((response) => {
    defaults['hzOffset_2'] = response
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on getting the config of "HorizontalOffset 2"',
      'Associated_Function': 'saveDefaults()',
      'Connect': connect
    }
    console.debug(error)
  })
  await xapi.config.get('Video Monitors').then((response) => {
    defaults['video_Monitors'] = response
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on getting the config of "Video Monitors"',
      'Associated_Function': 'saveDefaults()',
      'Connect': connect
    }
    console.debug(error)
  })
  await xapi.config.get('Video Output Connector 2 MonitorRole').then((response) => {
    defaults.monitor_Role['conx_2'] = response
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on getting the config of "Video Output Connector 2 MonitorRole"',
      'Associated_Function': 'saveDefaults()',
      'Connect': connect
    }
    console.debug(error)
  })
  await xapi.status.get('Video Selfview').then((response) => {
    defaults['selfView'] = {}
    defaults.selfView['fullscreenMode'] = response.FullscreenMode
    defaults.selfView['onMonitorRole'] = response.OnMonitorRole
    defaults.selfView['pipPosition'] = response.PIPPosition
    defaults.selfView['mode'] = response.Mode
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on getting the status of "Selfview"',
      'Associated_Function': 'saveDefaults()',
      'Connect': connect
    }
    console.debug(error)
  })
  return new Promise((resolve) => {
    let system = {
      'info': {
        'platform': sysInfo.system,
        'compatibilityLevel': sysInfo.compatibilityLevel
      },
      'defaults': {
        'info': 'defaults collected every time USB mode is enabled. The "saved_Defaults" the most recent defaults found for USB mode.',
        'saved_Defaults': defaults
      }
    }
    mem.write('usbMode_Defaults', system)
    resolve({
      'saved_Defaults': defaults
    })
  })
}

async function runDefaults() {
  console.log('Exiting USB mode, loading system default system configuration')
  let defaults = {}
  //Read Memory
  await mem.read('usbMode_Defaults').then((response) => {
    defaults = response.defaults.saved_Defaults;
  }).catch(e => console.debug(e));
  //Load System Specific xApi
  switch (sysInfo.compatibilityLevel) {
    case 'room55':
      await xapi.config.set('Audio Output Line 1 Mode', defaults.audioOut_1.mode).then(() => {
        console.debug('runDefaults()', 'audioOut_1 Mode set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Audio Output Line 1 Mode"',
          'Associated_Function': 'runDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.set('Audio Output Line 1 OutputType', defaults.audioOut_1.outputType).then(() => {
        console.debug('runDefaults()', 'audioOut_1 OutputType set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Audio Output Line 1 OutputType"',
          'Associated_Function': 'runDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      break;
    case 'plus':
      await xapi.config.set('Video Output Connector 1 MonitorRole', defaults.monitor_Role.conx_1).then(() => {
        console.debug('runDefaults()', 'monitor_Role conx_1 set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Video Output Connector 1 MonitorRole"',
          'Associated_Function': 'runDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.set('Audio Microphones AGC', defaults.audioMic_AGC).then(() => {
        console.debug('runDefaults()', 'audioMic_AGC set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Audio Microphones AGC"',
          'Associated_Function': 'runDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.set('Audio Output Line 1 Mode', defaults.audioOut_1.mode).then(() => {
        console.debug('runDefaults()', 'audioOut_1 Mode set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Audio Output Line 1 Mode"',
          'Associated_Function': 'runDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.set('Audio Output Line 1 OutputType', defaults.audioOut_1.outputType).then(() => {
        console.debug('runDefaults()', 'audioOut_1 OutputType set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Audio Output Line 1 OutputType"',
          'Associated_Function': 'runDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      break;
    case 'pro':
      await xapi.config.set('Video Output Connector 3 Location HorizontalOffset', defaults.hzOffset_3).then(() => {
        console.debug('runDefaults()', 'hzOffset_3')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "HorizontalOffset Output 3"',
          'Associated_Function': 'runDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.set('Video Output Connector 1 MonitorRole', defaults.monitor_Role.conx_1).then(() => {
        console.debug('runDefaults()', 'monitor_Role conx_1 set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Video Output Connector 1 MonitorRole"',
          'Associated_Function': 'runDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.set('Video Output Connector 3 MonitorRole', defaults.monitor_Role.conx_3).then(() => {
        console.debug('runDefaults()', 'monitor_Role conx_3 set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Video Output Connector 3 MonitorRole"',
          'Associated_Function': 'runDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      break;
    default:
      break;
  };
  //Load Universal xApi
  await sleep(100);
  await xapi.config.set('Video Output Connector 2 Location HorizontalOffset', defaults.hzOffset_2).then(() => {
    console.debug('runDefaults()', 'hzOffset_2')
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on getting the config of "HorizontalOffset Output 2"',
      'Associated_Function': 'runDefaults()',
      'Connect': connect
    }
    console.debug(error)
  })
  await xapi.config.set('Video Monitors', defaults.video_Monitors).then(() => {
    console.debug('runDefaults()', 'video_Monitors set')
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on setting the config of "Video Monitors"',
      'Associated_Function': 'runDefaults()',
      'Connect': connect
    }
    console.debug(error)
  })
  await xapi.config.set('Video Output Connector 2 MonitorRole', defaults.monitor_Role.conx_2).then(() => {
    console.debug('runDefaults()', 'monitor_Role conx_2 set')
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on getting the config of "Video Output Connector 1 MonitorRole"',
      'Associated_Function': 'runDefaults()',
      'Connect': connect
    }
    console.debug(error)
  })
  /***[Non-Memory Related Commands]*******************************************************************/
  await xapi.command('Conference DoNotDisturb Deactivate').then(() => {
    console.debug('runDefaults()', 'DND Deactivated')
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on the command "Conference DoNotDisturb Deactivate"',
      'Associated_Function': 'runDefaults()',
      'Connect': connect
    }
    console.debug(error)
  })
  await xapi.command('Audio VuMeter Stop', {
    ConnectorId: 2,
    ConnectorType: 'Microphone'
  }).then(() => {
    console.debug('runDefaults()', 'Audio VuMeter Stop')
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on the command "Audio VuMeter Stop"',
      'Associated_Function': 'runDefaults()',
      'Connect': connect
    }
    console.debug(error)
  })
  /**********************************************************************/
  await avatarCorrection(true)
  await sleep(500)
  //Changing self-view should always run last
  await xapi.command('Video Selfview Set', {
    Mode: defaults.selfView.mode,
    FullscreenMode: defaults.selfView.fullscreenMode,
    OnMonitorRole: defaults.selfView.onMonitorRole,
    PIPPosition: defaults.selfView.pipPosition
  }).then(() => {
    console.debug('runDefaults()', 'selfView set')
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on the command "Video Selfview Set"',
      'Associated_Function': 'runDefaults()',
      'Connect': connect
    }
    console.debug(error)
  })
  let usbMode_Status = { state: false, fts: false }
  await mem.write('usbMode_Status', usbMode_Status)
}

var presentationSignalCount = 0;
var timer;

function presentationSignalTimer() {
  clearInterval(timer);
  presentationSignalCount = 0;
  timer = setInterval(clock, 1000);

  function clock() {
    if (presentationSignalCount == 15) {
      clearInterval(timer);
      presentationSignalCount = 0;
    } else {
      presentationSignalCount++;
    }
  }
}

async function runUsbMode() { //Fix Me - Add Plus Profile and Edit Others
  //Load System Specific xApi
  let defaults = {}
  await mem.read('usbMode_Defaults').then((response) => {
    defaults = response.defaults.saved_Defaults;
  }).catch(e => console.debug(e));
  console.log('Entering USB Mode, loading USB mode configuration')
  usbWelcome()
  presentationSignalTimer()
  switch (sysInfo.compatibilityLevel) {
    case 'room55':
      await xapi.config.set('Video Monitors', 'Dual').then(() => {
        console.debug('runDefaults()', 'video_Monitors set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on setting the config of "Video Monitors"',
          'Associated_Function': 'runDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.set('Audio Output Line 1 Mode', 'On').then(() => {
        console.debug('runUsbMode()', 'audioOut_1 Mode set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Audio Output Line 1 Mode"',
          'Associated_Function': 'runUsbMode()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.set('Audio Output Line 1 OutputType', 'Microphone').then(() => {
        console.debug('runUsbMode()', 'audioOut_1 OutputType set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Audio Output Line 1 OutputType"',
          'Associated_Function': 'runUsbMode()',
          'Connect': connect
        }
        console.debug(error)
      })
      break;
    case 'plus':
      await xapi.config.set('Video Monitors', 'Dual').then(() => {
        console.debug('runDefaults()', 'video_Monitors set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on setting the config of "Video Monitors"',
          'Associated_Function': 'runDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.set('Audio Microphones AGC', 'Off').then(() => {
        console.debug('runUsbMode()', 'audioMic_AGC set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Audio Microphones AGC"',
          'Associated_Function': 'runUsbMode()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.set('Audio Output Line 1 Mode', 'On').then(() => {
        console.debug('runUsbMode()', 'audioOut_1 Mode set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Audio Output Line 1 Mode"',
          'Associated_Function': 'runUsbMode()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.set('Audio Output Line 1 OutputType', 'Microphone').then(() => {
        console.debug('runUsbMode()', 'audioOut_1 OutputType set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Audio Output Line 1 OutputType"',
          'Associated_Function': 'runUsbMode()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.set('Video Output Connector 1 MonitorRole', 'First').then(() => {
        console.debug('runUsbMode()', 'monitor_Role conx_1 set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Video Output Connector 1 MonitorRole"',
          'Associated_Function': 'runUsbMode()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.set('Video Output Connector 1 Location HorizontalOffset', defaults.hzOffset_1).then((response) => {
        console.debug('runUsbMode()', 'hzOffset_1 set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "HorizontalOffset 1"',
          'Associated_Function': 'runUSBMode()',
          'Connect': connect
        }
        console.debug(error)
      })
      break;
    case 'pro':
      await xapi.config.set('Video Monitors', 'Triple').then(() => {
        console.debug('runUsbMode()', 'video_Monitors set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on setting the config of "Video Monitors"',
          'Associated_Function': 'runDefaults()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.set('Video Output Connector 1 MonitorRole', 'First').then(() => {
        console.debug('runUsbMode()', 'monitor_Role conx_1 set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Video Output Connector 1 MonitorRole"',
          'Associated_Function': 'runUsbMode()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.set('Video Output Connector 3 MonitorRole', 'Third').then(() => {
        console.debug('runUsbMode()', 'monitor_Role conx_3 set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "Video Output Connector 3 MonitorRole"',
          'Associated_Function': 'runUsbMode()',
          'Connect': connect
        }
        console.debug(error)
      })
      await xapi.config.set('Video Output Connector 3 Location HorizontalOffset', defaults.hzOffset_3).then((response) => {
        console.debug('runUsbMode()', 'hzOffset_3 set')
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on getting the config of "HorizontalOffset 3"',
          'Associated_Function': 'runUSBMode()',
          'Connect': connect
        }
        console.debug(error)
      })
      break;
    default:
      break;
  };
  //Load Universal xApi
  await sleep(100).then(shareScreen())
  await sleep(100);
  await xapi.config.set('Video Output Connector 2 MonitorRole', 'Second').then(() => {
    console.debug('runUsbMode()', 'monitor_Role conx_2 set')
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on getting the config of "Video Output Connector 2 MonitorRole"',
      'Associated_Function': 'runUsbMode()',
      'Connect': connect
    }
    console.debug(error)
  })
  await xapi.config.set('Video Output Connector 2 Location HorizontalOffset', defaults.hzOffset_2).then((response) => {
    console.debug('runUsbMode()', 'hzOffset_2 set')
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on getting the config of "HorizontalOffset 2"',
      'Associated_Function': 'runUSBMode()',
      'Connect': connect
    }
    console.debug(error)
  })
  /***[Non-Memory Related Commands]*******************************************************************/
  await xapi.command('Conference DoNotDisturb Activate', {
    Timeout: '1440'
  }).then(() => {
    console.debug('runUsbMode()', 'DND Activate')
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on the command "Conference DoNotDisturb Activate"',
      'Associated_Function': 'runUsbMode()',
      'Connect': connect
    }
    console.debug(error)
  })
  await xapi.command('Audio VuMeter Start', {
    ConnectorId: 2,
    ConnectorType: 'Microphone'
  }).then(() => {
    console.debug('runUsbMode()', 'Audio VuMeter Stop')
  }).catch((e) => {
    let error = {
      'Error': e,
      'Message': 'Error caught on the command "Audio VuMeter Stop"',
      'Associated_Function': 'runUsbMode()',
      'Connect': connect
    }
    console.debug(error)
  })
  /**********************************************************************/
  avatarCorrection(false)
  await sleep(500)
  //Changing self-view should always run last
  if (sysInfo.compatibilityLevel == 'plus' || sysInfo.compatibilityLevel == 'room55') {
    await xapi.command('Video Selfview Set', {
      Mode: 'On',
      FullscreenMode: 'On',
      OnMonitorRole: 'Second'
    }).then(() => {
      console.debug('runUsbMode()', 'selfView set')
    }).catch((e) => {
      let error = {
        'Error': e,
        'Message': 'Error caught on the command "Video Selfview Set"',
        'Associated_Function': 'runUsbMode()',
        'Connect': connect
      }
      console.debug(error)
    })
  } else if (sysInfo.compatibilityLevel == 'pro') {
    let thisMonitor = 'Third'
    if (sysInfo.system == 'SX80') {
      thisMonitor = sx80_Mx700_800_videoOutput_Override
    }
    await xapi.command('Video Selfview Set', {
      Mode: 'On',
      FullscreenMode: 'On',
      OnMonitorRole: thisMonitor
    }).then(() => {
      console.debug('runUsbMode()', 'selfView set')
    }).catch((e) => {
      let error = {
        'Error': e,
        'Message': 'Error caught on the command "Video Selfview Set"',
        'Associated_Function': 'runUsbMode()',
        'Connect': connect
      }
      console.debug(error)
    })
  }
  let usbMode_Status = { state: true, fts: false }
  await mem.write('usbMode_Status', usbMode_Status)
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function checkPlatform() {
  let codec;
  await xapi.status.get('SystemUnit ProductPlatform').then((platform) => {
    codec = platform
  })
  return new Promise((resolve) => {
    resolve(codec)
  })
}

function checkCompatibility(system) {
  return new Promise((resolve) => {
    let compatibility;
    switch (system) {
      case 'Room 55':
        compatibility = 'room55'
        sysInfo = new Scope(compatibility, system)
        resolve(sysInfo.remit())
        break;
      case 'Codec Plus':
      case 'Room Kit':
      case 'Room 55D':
      case 'Room 70D':
      case 'Room 70S':
        compatibility = 'plus'
        sysInfo = new Scope(compatibility, system)
        resolve(sysInfo.remit())
        break;
      case 'Codec Pro':
      case 'Room 70D G2':
      case 'Room 70S G2':
      case 'Room 70 Panorama':
      case 'Room Panorama':
      case 'SX80':
      case 'MX700':
      case 'MX700ST':
      case 'MX800':
      case 'MX800ST':
      case 'MX800D':
        compatibility = 'pro'
        sysInfo = new Scope(compatibility, system)
        resolve(sysInfo.remit())
        break;
      case 'Desk Pro':
      case 'Room Kit Mini':
      case 'Room USB':
        compatibility = 'native'
        sysInfo = new Scope(compatibility, system)
        resolve(sysInfo.remit())
        break;
      case 'SX10':
      case 'SX20':
      case 'DX70':
      case 'DX80':
      case 'MX200 G2':
      case 'MX300 G2':
      case 'Board 55':
      case 'Board 55S':
      case 'Board 70':
      case 'Board 70S':
      case 'Board 85S':
        compatibility = 'not compatible'
        sysInfo = new Scope(compatibility, system)
        resolve(sysInfo.remit())
        break;
      default:
        compatibility = undefined
        sysInfo = new Scope(compatibility, system)
        resolve(sysInfo.remit())
        break;
    }
  })
}
//*****[UI Functions]**********************************************************/

async function buildUI(state) {
  if (state) {
    xapi.config.set('UserInterface Features HideAll', 'True')
    customPanel_visibility('Hidden')
    xapi.command('UserInterface Extensions Panel Update', {
      PanelId: 'prjUSB_widget_disabled',
      Visibility: 'Hidden'
    })
    xapi.command('UserInterface Extensions Panel Update', {
      PanelId: 'prjUSB_widget_enabled',
      Visibility: 'Auto'
    })
  } else {
    xapi.config.set('UserInterface Features HideAll', 'False')
    customPanel_visibility('Auto')
    xapi.command('UserInterface Extensions Panel Update', {
      PanelId: 'prjUSB_widget_disabled',
      Visibility: 'Auto'
    })
    xapi.command('UserInterface Extensions Panel Update', {
      PanelId: 'prjUSB_widget_enabled',
      Visibility: 'Hidden'
    })
  }
}

async function buildPanels() {
  let check4usbpanels = 0;
  let panels = await xapi.command('UserInterface Extensions List', { ActivityType: 'Custom' })
  try {
    for (let i = 0; i < panels.Extensions.Panel.length; i++) {
      switch (panels.Extensions.Panel[i].PanelId) {
        case 'prjUSB_widget_enabled':
        case 'prjUSB_widget_disabled':
          check4usbpanels++;
          break;
        default:
          break;
      }
    }
  } catch (error) {
    console.debug(error)
  }
  if (check4usbpanels < 2) {
    xapi.command('Userinterface Extensions Panel Save', {
      PanelId: 'prjUSB_widget_disabled'
    }, `<Extensions>
          <Panel>
            <Origin>local</Origin>
            <Type>Home</Type>
            <Icon>Input</Icon>
            <Color>#335A9A</Color>
            <Name>Enable USB Mode</Name>
            <ActivityType>Custom</ActivityType>
          </Panel>
        </Extensions>`)
    xapi.command('Userinterface Extensions Panel Save', {
      PanelId: 'prjUSB_widget_enabled'
    }, `<Extensions>
          <Panel>
            <Origin>local</Origin>
            <Type>Home</Type>
            <Icon>Input</Icon>
            <Color>#FFA300</Color>
            <Name>Disable USB mode</Name>
            <ActivityType>Custom</ActivityType>
          </Panel>
        </Extensions>`)
    console.debug({
      Message: `USB Mode Panel(s) missing! re-building USB Mode Panels`,
      Associated_Function: 'buildPanels()'
    })
  } else {
    console.debug({
      Message: 'USB Panels found, no action neccessary',
      Associated_Function: 'buildPanels()'
    })
  }
}

async function swapUI(state) {
  if (state) {
    xapi.config.set('UserInterface Features HideAll', 'True')
    customPanel_visibility('Hidden')
    xapi.command('UserInterface Extensions Panel Update', {
      PanelId: 'prjUSB_widget_disabled',
      Visibility: 'Hidden'
    })
    xapi.command('UserInterface Extensions Panel Update', {
      PanelId: 'prjUSB_widget_enabled',
      Visibility: 'Auto'
    })
  } else {
    xapi.config.set('UserInterface Features HideAll', 'False')
    customPanel_visibility('Auto')
    xapi.command('UserInterface Extensions Panel Update', {
      PanelId: 'prjUSB_widget_disabled',
      Visibility: 'Auto'
    })
    xapi.command('UserInterface Extensions Panel Update', {
      PanelId: 'prjUSB_widget_enabled',
      Visibility: 'Hidden'
    })
  }
}

var isFTS = false

async function checkUI() {//let usbMode_Status = { state: false, fts: true}
  isFTS = false;
  await buildPanels();
  console.log(`Checking USB Mode's last known state...`);
  await mem.read('usbMode_Status').then((status) => {
    if (status.fts) {
      xapi.Command.UserInterface.Message.Alert.Display({
        Title: '⚠ Setting up USB mode ⚠',
        Text: 'Set-up detected, running initial USB mode check<p>Please Wait until this prompt clears. Approximate Wait 25-30 seconds'
      })
      throw status.fts
    } else {
      if (status.state) {
        console.log(`USB mode is "enabled", recovering USB UI and applying any UI configuration changes.`)
        avatarCorrection(false)
      } else {
        console.log(`USB mode is "disabled", recovering Default UI and applying any UI configuration changes.`)
        avatarCorrection(true)
      }
      buildUI(status.state)
    }
  }).catch((e) => {
    isFTS = true
    let usbMode_Status = { state: false, fts: true }
    console.warn({ Message: 'First Time Setup Initiated', Action: 'Running tests for USB mode..' })
    xapi.Command.UserInterface.Message.Alert.Display({
      Title: '⚠ Setting up USB mode ⚠',
      Text: 'Set-up detected, running initial USB mode check<p>Please Wait until this prompt clears. Approximate Wait 25-30 seconds'
    })
    mem.write('usbMode_Status', usbMode_Status).then(() => {
      buildUI(false)
      avatarCorrection(true)
    })
  })
  if (isFTS) {
    await xapi.Command.UserInterface.Message.Alert.Display({
      Title: '⚠ Setting up USB mode ⚠',
      Text: 'Set-up detected, running initial USB mode check<p>Please Wait until this prompt clears. Approximate Wait 25-30 seconds'
    })
    await sleep(500);
    await saveDefaults().then((response) => {
      console.debug(response);
    });
    await sleep(500);
    await runUsbMode().then(() => { swapUI(true) })
    await sleep(3000);
    await runDefaults().then(() => { swapUI(false) })
    await sleep(3000)
    console.warn({ Message: 'First Time Setup Complete! USB Mode is Ready! Restarting Macro Engine in 3 seconds...' })
    await sleep(3000)
    await xapi.Command.UserInterface.Message.Alert.Clear().then(() => { isFTS = false; xapi.Command.Macros.Runtime.Restart(); })
  }
}

//*****[Config Functions]**********************************************************/

//Hide Custom Panels

function customPanel_visibility(state) {
  let inverse = 'Auto';
  let panels = {
    "Message": "",
    "Panels": []
  }
  if (hideCustomPanels_inUSBMode.toString() == "true" ? true : false) {
    if (state == "Hidden") {
      panels.Message = 'Hide Custom UI in USB Mode is enabled, Hiding the following panel IDs: '
    } else {
      panels.Message = 'Hide Custom UI in USB Mode is enabled, Showing the following panel IDs: '
    }
    for (let i = 0; i < hideCustomPanels_inUSBMode_PanelIds.length; i++) {
      panels.Panels.push(hideCustomPanels_inUSBMode_PanelIds[i])
      xapi.command('UserInterface Extensions Panel Update', {
        PanelId: hideCustomPanels_inUSBMode_PanelIds[i],
        Visibility: state
      }).catch(e => console.debug(e))
    }
    console.debug(panels)
  } else {
    for (let i = 0; i < hideCustomPanels_inUSBMode_PanelIds.length; i++) {
      panels.Panels.push(hideCustomPanels_inUSBMode_PanelIds[i])
      xapi.command('UserInterface Extensions Panel Update', {
        PanelId: hideCustomPanels_inUSBMode_PanelIds[i],
        Visibility: 'Auto'
      }).catch(e => console.debug(e))
    }
  }
  if (hideCustomPanels_inDefaultMode.toString() == "true" ? true : false) {
    if (state == 'Auto') {
      inverse = 'Hidden';
      panels.Message = 'Hide Custom UI in Default Mode is enabled, Hiding the following panel IDs: '
    } else {
      inverse = 'Auto'
      panels.Message = 'Hide Custom UI in Default Mode is enabled, Showing the following panel IDs: '
    }
    for (let i = 0; i < hideCustomPanels_inDefaultMode_PanelIds.length; i++) {
      panels.Panels.push(hideCustomPanels_inDefaultMode_PanelIds[i])
      xapi.command('UserInterface Extensions Panel Update', {
        PanelId: hideCustomPanels_inDefaultMode_PanelIds[i],
        Visibility: inverse
      }).catch(e => console.debug(e))
    }
    console.debug(panels)
  } else {
    for (let i = 0; i < hideCustomPanels_inDefaultMode_PanelIds.length; i++) {
      panels.Panels.push(hideCustomPanels_inDefaultMode_PanelIds[i])
      xapi.command('UserInterface Extensions Panel Update', {
        PanelId: hideCustomPanels_inDefaultMode_PanelIds[i],
        Visibility: 'Auto'
      }).catch(e => console.debug(e))
    }
  }
}
//Pin Protection

const pinRegex = /^\d{4}$|^\d{5}$|^\d{6}$|^\d{7}$|^\d{8}$/

function checkPinConfig() {
  return new Promise((resolve, reject) => {
    if (pinProtection_Mode.toString() == "true" ? true : false) {
      let checkSetPin = pinRegex.test(pinProtection_Pin)
      if (checkSetPin) {
        let report = {
          "Message": "Pin for pin protection passes regex"
        }
        resolve(report)
      } else {
        let error = {
          'Error': `Pin set at the top of this script under configuration has failed the regex check`,
          'TIP': `Make sure the pin set in this file is between 4 and 8 numeric digits`,
          'Connect': connect
        }
        reject(error)
      }
    } else {

    }
  })
}

checkPinConfig()

function checkForPin() {
  if (pinProtection_Mode.toString() == "true" ? true : false) {
    xapi.command('UserInterface Message TextInput Display', {
      Title: pinProtection_FlavorText_Title,
      Text: pinProtection_FlavorText_Text,
      Placeholder: pinProtection_FlavorText_Placeholder,
      SubmitText: pinProtection_FlavorText_SubmitButton,
      FeedbackId: 'prjUSB_feedback_pin',
      duration: pinProtection_Prompt_Duration,
      InputType: 'Pin'
    })
  } else {
    saveDefaults().then((response) => {
      console.debug(response);
      swapUI(true)
      runUsbMode()
    })
  }
}

xapi.event.on('UserInterface Message TextInput Response', (event) => {
  switch (event.FeedbackId) {
    case 'prjUSB_feedback_pin':
      let testEntry = pinRegex.test(event.Text)
      if (testEntry) {
        if (event.Text == pinProtection_Pin) {
          xapi.command('UserInterface Message Prompt Display', {
            Title: pinProtection_UnlockText_Title,
            Text: pinProtection_UnlockText_Text,
            Duration: 3
          })
          saveDefaults().then((response) => {
            console.debug(response);
            swapUI(true)
            runUsbMode()
          })
        } else {
          xapi.command('UserInterface Message TextInput Display', {
            Title: pinProtection_Fail_Title,
            Text: pinProtection_FlavorText_Text,
            Placeholder: pinProtection_FlavorText_Placeholder,
            SubmitText: pinProtection_FlavorText_SubmitButton,
            FeedbackId: 'prjUSB_feedback_pin',
            duration: pinProtection_Prompt_Duration,
            InputType: 'Pin'
          })
          console.debug({
            "Error": "Incorrect Pin entered"
          })
        }
      } else {
        xapi.command('UserInterface Message TextInput Display', {
          Title: pinProtection_Fail_Title,
          Text: pinProtection_FlavorText_Text,
          Placeholder: pinProtection_FlavorText_Placeholder,
          SubmitText: pinProtection_FlavorText_SubmitButton,
          FeedbackId: 'prjUSB_feedback_pin',
          duration: pinProtection_Prompt_Duration,
          InputType: 'Pin'
        })
        console.debug({
          "Error": "Pin entered is not between 4 and 8 numeric digits"
        })
      }
      break;
  }
})

//Screen share behavior

let activeSource = 0;

xapi.event.on('PresentationPreviewStarted', (event) => {
  activeSource = event.LocalSource
  let report = {
    "Message": "Local presentation started",
    "Source": event.LocalSource
  }
  if (screenShare_Mode == 'auto') {

  }
  console.debug(report)
})

let handleDisconnectMessage = false;
xapi.event.on('PresentationPreviewStopped', (event) => {
  if (!isFTS) {
    activeSource = 0
    let report = {
      "Message": "Local presentation stopped",
      "Cause": event.Cause,
      "Source": activeSource
    }
    runDefaults();
    swapUI(false);
    if (presentationSignalCount <= 15) {
      mem.read('usbMode_Status').then((status) => {
        if (!handleDisconnectMessage) {
          if (status.state) {
            xapi.command('UserInterface Message Alert Display', {
              Title: missingSourceText_Title,
              Text: missingSourceText_Text,
              Duration: missingSourceText_Duration
            })
          }
        } else {
          handleDisconnectMessage = false;
        }
      })
    }
    if (event.Cause == 'noSignal') {
      report.Message = 'Local presentation stopped. USB Mode requires a source to be shared on screen for use.'
      console.debug(report)
    } else {
      console.debug(report)
    }
  }
})

async function shareScreen() {
  let defaultSource;
  let report = {
    "Message": ""
  }
  await xapi.config.get('Video Presentation DefaultSource').then((report) => {
    defaultSource = report
  })
  if (screenShare_Mode == 'auto') {
    if (activeSource != 0 && activeSource != '0') {
      await xapi.command('Presentation Start', {
        ConnectorId: activeSource
      }).catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on the command "Presentation Start"; trying to share active source. screenshare.mode: ' + screenShare_Mode,
          'Associated_Function': 'shareScreen()',
          'Connect': connect
        }
        console.debug(error)
      })
      report.Message = `screenShare.mode set to "${screenShare_Mode}". active input found, sharing: ` + activeSource
    } else {
      xapi.command('Presentation Start').catch((e) => {
        let error = {
          'Error': e,
          'Message': 'Error caught on the command "Presentation Start"; trying to share default source. screenshare.mode: ' + screenShare_Mode,
          'Associated_Function': 'shareScreen()',
          'Connect': connect
        }
        console.debug(error)
      })
      report.Message = `screenShare.mode set to "${screenShare_Mode}" NO active input found, sharing system default source: ${defaultSource}`
    }
  } else {
    xapi.command('Presentation Start').catch((e) => {
      let error = {
        'Error': e,
        'Message': 'Error caught on the command "Presentation Start"; trying to share default source. screenshare.mode: ' + screenShare_Mode,
        'Associated_Function': 'shareScreen()',
        'Connect': connect
      }
      console.debug(error)
    })
    report.Message = `screenShare.mode set to "${screenShare_Mode}" sharing system default source: ${defaultSource}`
  }
  return console.info(report)
}

async function usbWelcome() {
  if (!isFTS) {
    if (usbWelcomePrompt.toString() == "true" ? true : false) {
      await xapi.command('UserInterface Message Prompt Display', {
        Title: usbWelcomePrompt_Title,
        Text: usbWelcomePrompt_Text,
        Duration: usbWelcomePrompt_Duration,
        'Option.1': usbWelcomePrompt_Dismiss
      })
    }
  }
}

async function avatarCorrection(state) {
  let monitors = await xapi.Config.Video.Monitors.get().catch(e => console.debug(e))
  switch (sysInfo.compatibilityLevel) {
    case 'room55': case 'plus':
      if (touchAvatarCorrection_Mode.toString() == "true" ? true : false) {
        switch (monitors) {
          case 'Single':
            if (state) {
              await xapi.config.set('Video Output Connector 2 MonitorRole', 'First');
              await xapi.config.set('Video Output Connector 2 Location HorizontalOffset', '0');
            } else {
              await xapi.config.set('Video Output Connector 2 MonitorRole', 'Second');
              await xapi.config.set('Video Output Connector 2 Location HorizontalOffset', '1');
            }
            break;
          default:
            await xapi.config.set('Video Output Connector 2 MonitorRole', 'Second');
            await xapi.config.set('Video Output Connector 2 Location HorizontalOffset', '1');
            break;
        }
      } else {
        await xapi.config.set('Video Output Connector 2 MonitorRole', 'Second');
        await xapi.config.set('Video Output Connector 2 Location HorizontalOffset', '1');
      }
      break;
    case 'pro':
      if (touchAvatarCorrection_Mode.toString() == "true" ? true : false) {
        switch (monitors) {
          case 'Single':
            if (state) {
              await xapi.config.set('Video Output Connector 2 MonitorRole', 'First');
              await xapi.config.set('Video Output Connector 2 Location HorizontalOffset', '-1');
              await xapi.config.set('Video Output Connector 3 MonitorRole', 'First');
              await xapi.config.set('Video Output Connector 3 Location HorizontalOffset', '-1');
            } else {
              await xapi.config.set('Video Output Connector 2 MonitorRole', 'Second');
              await xapi.config.set('Video Output Connector 2 Location HorizontalOffset', '0');
              await xapi.config.set('Video Output Connector 3 MonitorRole', 'Third');
              await xapi.config.set('Video Output Connector 3 Location HorizontalOffset', '1');
            }
            break;
          case 'Dual': case 'DualPresentationOnly':
            if (state) {
              await xapi.config.set('Video Output Connector 3 MonitorRole', 'First');
              await xapi.config.set('Video Output Connector 3 Location HorizontalOffset', '0');
            } else {
              await xapi.config.set('Video Output Connector 3 MonitorRole', 'Third');
              await xapi.config.set('Video Output Connector 3 Location HorizontalOffset', '1');
            }
            break;
          default:
            await xapi.config.set('Video Output Connector 2 MonitorRole', 'Second');
            await xapi.config.set('Video Output Connector 2 Location HorizontalOffset', '0');
            await xapi.config.set('Video Output Connector 3 MonitorRole', 'Third');
            await xapi.config.set('Video Output Connector 3 Location HorizontalOffset', '1');
            break;
        }
      } else {
        await xapi.config.set('Video Output Connector 2 MonitorRole', 'Second');
        await xapi.config.set('Video Output Connector 2 Location HorizontalOffset', '0');
        await xapi.config.set('Video Output Connector 3 MonitorRole', 'Third');
        await xapi.config.set('Video Output Connector 3 Location HorizontalOffset', '1');
      }
      break
    default:
      break;
  }
}

//--__--__--__--__--__--__
//Memory Related Macros

var mem = {
  "localScript": module.name.replace('./', '')
};

function memoryInit() {
  return new Promise((resolve) => {
    xapi.command('macros macro get', {
      Name: "Memory_Storage"
    }).then(() => {
      resolve();
    }).catch(e => {
      xapi.Command.UserInterface.Message.Alert.Display({
        Title: '⚠ Setting up USB mode ⚠',
        Text: 'Set-up detected, running initial USB mode check<p>Please Wait until this prompt clears. Approximate Wait 25-30 seconds'
      })
      console.debug('Uh-Oh, no storage Macro found, building "' + "Memory_Storage");
      xapi.command('macros macro save', {
        Name: "Memory_Storage"
      },
        `var memory = {\n\t"./_$Info": {\n\t\t"Warning": "Do NOT modify this document, as other Scripts/Macros may rely on this information", \n\t\t"AvailableFunctions": {\n\t\t\t"local": ["mem.read('key')", "mem.write('key', 'value')", "mem.remove('key')", "mem.print()"],\n\t\t\t"global": ["mem.read.global('key')", "mem.write.global('key', 'value')", "mem.remove.global('key')", "mem.print.global()"]\n\t\t},\n\t\t"Guide": "https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/tree/master/Macro%20Memory%20Storage"\n\t},\n\t"ExampleKey": "Example Value"\n}`
      ).then(() => {
        sleep(500).then(() => {
          xapi.Command.Macros.Runtime.Restart();
        })
      });

    });
  });
};

mem.read = function (key) {
  return new Promise((resolve, reject) => {
    xapi.command('Macros Macro Get', {
      Content: 'True',
      Name: "Memory_Storage"
    }).then((event) => {
      let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{')
      let store = JSON.parse(raw)
      let temp;
      if (store[mem.localScript] == undefined) {
        store[mem.localScript] = {}
        temp = store[mem.localScript]
      } else {
        temp = store[mem.localScript]
      }
      if (temp[key] != undefined) {
        resolve(temp[key])
      } else {
        reject(new Error('Local Read Error. Object Key: "' + key + '" not found in \'' + "Memory_Storage" + '\' from script "' + mem.localScript + '"'))
      }
    })
  });
}

mem.write = function (key, value) {
  return new Promise((resolve) => {
    xapi.command('Macros Macro Get', {
      Content: 'True',
      Name: "Memory_Storage"
    }).then((event) => {
      let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
      let store = JSON.parse(raw);
      let temp;
      if (store[mem.localScript] == undefined) {
        store[mem.localScript] = {};
        temp = store[mem.localScript];
      } else {
        temp = store[mem.localScript]
      };
      temp[key] = value;
      store[mem.localScript] = temp;
      let newStore = JSON.stringify(store, null, 4);
      xapi.command('Macros Macro Save', {
        Name: "Memory_Storage"
      },
        `var memory = ${newStore}`
      ).then(() => {
        console.debug('Local Write Complete => "' + mem.localScript + '" : {"' + key + '" : "' + value + '"}');
        resolve(value);
      });
    });
  });
};

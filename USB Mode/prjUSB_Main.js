/********************************************************
 * Project Lead: Enrico Conedera, Technical Marketing Engineer
 *               econeder@cisco.com
 *               Cisco
 * 
 * Script Author: Robert McGonigle Jr, Video Services Engineer
 *                robert_mcgonigle@harvard.edu
 *                Havard University Information Technology
 * 
 * Special thanks to Zacharie Gignac from Université Laval in Canada
 *   - His contributions to the memory storage functionality are invaluable
 *   - Use memory function in future Macros go to
 *      - https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/tree/master/Macro%20Memory%20Storage
 * 
 * Special Thanks to All Beta Testers
 *
 * To get in contact with Enrico or Robert join the 
 *   Project USB space on Webex via this link https://eurl.io/#L6Rcn39Rn
 *
 * Release: 03/24/21
 * Last Update: 08/05/2021
 * 
 * Name: prjUSB_Main
 * Version: 2-1-0
 *  
 * Description:
 *    This is the main script for Project USB
 *    
 *    This listens to the events on the touch panel for USB use and will alter the systems configuration to work with a 3rd party USB AV Bridge
 * 
 * Script Dependencies: 
 *    'prjUSB_MemoryStorage
 ********************************************************/

import xapi from 'xapi';

//[USB Mode Configuration Start]************************/

const hideCustomPanels_Mode = false; // <true/false>
const hideCustomPanels_PanelIds = []; // Format ["panel_1", "panel_2", "panel_3", "panel_Etc"]
const scheduledReset_Mode = false; // <true/false>
const scheduledReset_Hour = "0"; // <"0"-"23">
const scheduledReset_Minute = "0"; // <"0"-"59">
const pinProtection_Mode = false; // <true/false>
const pinProtection_Pin = "0000"; // Format 4-8 digit numeric pin
const screenShare_Mode = "auto"; // <"auto"/"standard">

//[Message Prompt Text. Change for language localization]************************/
const pinProtection_FlavorText_Title = "Enter Pin to Unlock";
const pinProtection_FlavorText_Text = "USB mode has been pin protected by a system administrator.<p>Please enter the 4-8 digit numeric pin to unlock";
const pinProtection_FlavorText_Placeholder = "4-8 Digit Pin";
const pinProtection_FlavorText_SubmitButton = "Enter";
const pinProtection_UnlockText_Title = "USB Mode Unlocked";
const pinProtection_UnlockText_Text = "Enjoy your meeting";
const pinProtection_Fail_Title = "Invalid Pin, Try Again";
const missingSourceText_Title = "No HDMI Input Detected"
const missingSourceText_Text = "Make sure your HDMI Presentation Source and USB Cable are connected to your device before selecting \"Enable USB Mode\""

//[USB Mode Configuration End]************************/

//Do not Edit below this Comment. You do so at your own risk :)

//*****[General]************************/
const version = '2-1-0'

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
        case 'prjUSB_widget_disabled-USB':
            checkForPin()
            break;
        case 'prjUSB_widget_enabled-USB':
            runDefaults()
            swapUI(false)
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
    await checkPlatform().then((platform) => {
        checkCompatibility(platform).then((compatibility) => {
            console.log(`System Detected: "${compatibility.system}". Assigning the "${compatibility.compatibilityLevel}" profile for USB Mode`)
            switch (compatibility.compatibilityLevel) {
                case 'plus':
                case 'pro':
                    checkUI()
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
                    console.error(x)
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
                    console.error(y)
                    break;
            }
        }).catch((e) => {
            console.error(e)
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
}

init()
//*****[Functions]******************************/

async function saveDefaults() {
    let defaults = {}
    //Save System Specific xApi
    switch (sysInfo.compatibilityLevel) {
        case 'plus':
            await xapi.config.get('Audio Microphones AGC').then((response) => {
                defaults['audioMic_AGC'] = response
            }).catch((e) => {
                let error = {
                    'Error': e,
                    'Message': 'Error caught on getting the config of "Audio Microphones AGC"',
                    'Associated_Function': 'saveDefaults()',
                    'Connect': connect
                }
                console.error(error)
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
                console.error(error)
            })
            break;
        case 'pro':
            await xapi.config.get('Video Output Connector 3 MonitorRole').then((response) => {
                defaults.monitor_Role['conx_3'] = response
            }).catch((e) => {
                let error = {
                    'Error': e,
                    'Message': 'Error caught on getting the config of "Video Output Connector 3 MonitorRole"',
                    'Associated_Function': 'saveDefaults()',
                    'Connect': connect
                }
                console.error(error)
            })
            break;
        default:
            break;
    }
    //Save Universal xApi
    await xapi.config.get('Video Monitors').then((response) => {
        defaults['video_Monitors'] = response
    }).catch((e) => {
        let error = {
            'Error': e,
            'Message': 'Error caught on getting the config of "Video Monitors"',
            'Associated_Function': 'saveDefaults()',
            'Connect': connect
        }
        console.error(error)
    })
    await xapi.config.get('Video Output Connector 1 MonitorRole').then((response) => {
        defaults['monitor_Role'] = {}
        defaults.monitor_Role['conx_1'] = response
    }).catch((e) => {
        let error = {
            'Error': e,
            'Message': 'Error caught on getting the config of "Video Output Connector 1 MonitorRole"',
            'Associated_Function': 'saveDefaults()',
            'Connect': connect
        }
        console.error(error)
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
        console.error(error)
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
        console.error(error)
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
    });
    //Load System Specific xApi
    switch (sysInfo.compatibilityLevel) {
        case 'plus':
            await xapi.config.set('Audio Microphones AGC', defaults.audioMic_AGC).then(() => {
                console.debug('runDefaults()', 'audioMic_AGC set')
            }).catch((e) => {
                let error = {
                    'Error': e,
                    'Message': 'Error caught on getting the config of "Audio Microphones AGC"',
                    'Associated_Function': 'runDefaults()',
                    'Connect': connect
                }
                console.error(error)
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
                console.error(error)
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
                console.error(error)
            })
            break;
        case 'pro':
            await xapi.config.set('Video Output Connector 3 MonitorRole', defaults.monitor_Role.conx_3).then(() => {
                console.debug('runDefaults()', 'monitor_Role conx_3 set')
            }).catch((e) => {
                let error = {
                    'Error': e,
                    'Message': 'Error caught on getting the config of "Video Output Connector 3 MonitorRole"',
                    'Associated_Function': 'runDefaults()',
                    'Connect': connect
                }
                console.error(error)
            })
            break;
        default:
            break;
    };
    //Load Universal xApi
    await sleep(100);
    await xapi.config.set('Video Monitors', defaults.video_Monitors).then(() => {
        console.debug('runDefaults()', 'video_Monitors set')
    }).catch((e) => {
        let error = {
            'Error': e,
            'Message': 'Error caught on setting the config of "Video Monitors"',
            'Associated_Function': 'runDefaults()',
            'Connect': connect
        }
        console.error(error)
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
        console.error(error)
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
        console.error(error)
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
        console.error(error)
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
        console.error(error)
    })
    /**********************************************************************/
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
        console.error(error)
    })
    await mem.write('usbMode_Status', false)
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

async function runUsbMode() {
    //Load System Specific xApi
    console.log('Entering USB Mode, loading USB mode configuration')
    presentationSignalTimer()
    switch (sysInfo.compatibilityLevel) {
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
                console.error(error)
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
                console.error(error)
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
                console.error(error)
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
                console.error(error)
            })
            break;
        case 'pro':
            await xapi.config.set('Video Monitors', 'Triple').then(() => {
                console.debug('runDefaults()', 'video_Monitors set')
            }).catch((e) => {
                let error = {
                    'Error': e,
                    'Message': 'Error caught on setting the config of "Video Monitors"',
                    'Associated_Function': 'runDefaults()',
                    'Connect': connect
                }
                console.error(error)
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
                console.error(error)
            })
            break;
        default:
            break;
    };
    //Load Universal xApi
    await sleep(100).then(shareScreen())
    await sleep(100);
    await xapi.config.set('Video Output Connector 1 MonitorRole', 'First').then(() => {
        console.debug('runUsbMode()', 'monitor_Role conx_1 set')
    }).catch((e) => {
        let error = {
            'Error': e,
            'Message': 'Error caught on getting the config of "Video Output Connector 1 MonitorRole"',
            'Associated_Function': 'runUsbMode()',
            'Connect': connect
        }
        console.error(error)
    })
    await xapi.config.set('Video Output Connector 2 MonitorRole', 'Second').then(() => {
        console.debug('runUsbMode()', 'monitor_Role conx_2 set')
    }).catch((e) => {
        let error = {
            'Error': e,
            'Message': 'Error caught on getting the config of "Video Output Connector 2 MonitorRole"',
            'Associated_Function': 'runUsbMode()',
            'Connect': connect
        }
        console.error(error)
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
        console.error(error)
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
        console.error(error)
    })
    /**********************************************************************/
    await sleep(100)
    //Changing self-view should always run last
    if (sysInfo.compatibilityLevel == 'plus') {
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
            console.error(error)
        })
    } else if (sysInfo.compatibilityLevel == 'pro') {
        await xapi.command('Video Selfview Set', {
            Mode: 'On',
            FullscreenMode: 'On',
            OnMonitorRole: 'Third'
        }).then(() => {
            console.debug('runUsbMode()', 'selfView set')
        }).catch((e) => {
            let error = {
                'Error': e,
                'Message': 'Error caught on the command "Video Selfview Set"',
                'Associated_Function': 'runUsbMode()',
                'Connect': connect
            }
            console.error(error)
        })
    }
    await mem.write('usbMode_Status', true)
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
            case 'Codec Plus':
            case 'Room Kit':
            case 'Room 55':
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
            PanelId: 'prjUSB_widget_disabled-USB',
            Visibility: 'Hidden'
        })
        xapi.command('UserInterface Extensions Panel Update', {
            PanelId: 'prjUSB_widget_enabled-USB',
            Visibility: 'Auto'
        })
    } else {
        xapi.config.set('UserInterface Features HideAll', 'False')
        customPanel_visibility('Auto')
        xapi.command('UserInterface Extensions Panel Update', {
            PanelId: 'prjUSB_widget_disabled-USB',
            Visibility: 'Auto'
        })
        xapi.command('UserInterface Extensions Panel Update', {
            PanelId: 'prjUSB_widget_enabled-USB',
            Visibility: 'Hidden'
        })
    }
}

async function swapUI(state) {
    if (state) {
        xapi.config.set('UserInterface Features HideAll', 'True')
        customPanel_visibility('Hidden')
        xapi.command('UserInterface Extensions Panel Update', {
            PanelId: 'prjUSB_widget_disabled-USB',
            Visibility: 'Hidden'
        })
        xapi.command('UserInterface Extensions Panel Update', {
            PanelId: 'prjUSB_widget_enabled-USB',
            Visibility: 'Auto'
        })
    } else {
        xapi.config.set('UserInterface Features HideAll', 'False')
        customPanel_visibility('Auto')
        xapi.command('UserInterface Extensions Panel Update', {
            PanelId: 'prjUSB_widget_disabled-USB',
            Visibility: 'Auto'
        })
        xapi.command('UserInterface Extensions Panel Update', {
            PanelId: 'prjUSB_widget_enabled-USB',
            Visibility: 'Hidden'
        })
    }
}

async function checkUI() {
    console.log(`Checking USB Mode's last known state...`)
    await mem.read('usbMode_Status').then((status) => {
        if (status) {
            console.log(`USB mode is "enabled", recovering USB UI and applying any UI configuration changes.`)
        } else {
            console.log(`USB mode is "disabled", recovering Default UI and applying any UI configuration changes.`)
        }
        buildUI(status)
    }).catch((e) => {
        mem.write('usbMode_Status', false).then(() => {
            let error = {
                'Error': e,
                'Message': `No USB mode status found in memory storage, creating '"usbMode_Status": false' under prjUSB_Storage`,
                'UI': 'Setting UI to Default',
            }
            console.warn(error)
            buildUI(false)
        })
    })
}

//*****[Config Functions]**********************************************************/

//Hide Custom Panels

function customPanel_visibility(state) {
    let panels = {
        "Message": "",
        "Panels": []
    }
    if (hideCustomPanels_Mode) {
        if (state == "Hidden") {
            panels.Message = 'Hide Custom UI is enabled, Hiding the following panel IDs: '
        } else {
            panels.Message = 'Hide Custom UI is enabled, Showing the following panel IDs: '
        }
        for (let i = 0; i < hideCustomPanels_PanelIds.length; i++) {
            panels.Panels.push(hideCustomPanels_PanelIds[i])
            xapi.command('UserInterface Extensions Panel Update', {
                PanelId: hideCustomPanels_PanelIds[i],
                Visibility: state
            }).catch(e => console.error(e))
        }
        console.debug(panels)
    }
}

//Scheduled Reset

function scheduledReset() {
    if (scheduledReset_Mode) {
        const now = new Date();
        const weekday = now.getDay() > 0 && now.getDay() < 6;
        const wakeupNow = now.getHours() == scheduledReset_Hour && now.getMinutes() == scheduledReset_Minute && weekday;
        if (wakeupNow) {
            xapi.command('UserInterface Extensions Panel Clicked', {
                PanelId: 'prjUSB_widget_enabled-USB'
            })
            console.log('Scheduled Reset lapse; exiting USB mode')
        } else {

        }
    } else {}
}
setInterval(scheduledReset, 30000)

//Pin Protection

const pinRegex = /^\d{4}$|^\d{5}$|^\d{6}$|^\d{7}$|^\d{8}$/

function checkPinConfig() {
    return new Promise((resolve, reject) => {
        if (pinProtection_Mode) {
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
    if (pinProtection_Mode) {
        xapi.command('UserInterface Message TextInput Display', {
            Title: pinProtection_FlavorText_Title,
            Text: pinProtection_FlavorText_Text,
            Placeholder: pinProtection_FlavorText_Placeholder,
            SubmitText: pinProtection_FlavorText_SubmitButton,
            FeedbackId: 'prjUSB_feedback_pin',
            duration: 20,
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
                        duration: 20,
                        InputType: 'Pin'
                    })
                    console.error({
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
                    duration: 20,
                    InputType: 'Pin'
                })
                console.error({
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

xapi.event.on('PresentationPreviewStopped', (event) => {
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
            if (status) {
                xapi.command('UserInterface Message Alert Display', {
                    Title: missingSourceText_Title,
                    Text: missingSourceText_Text,
                    Duration: 20
                })
            } else {

            }
        })
    }
    if (event.Cause == 'noSignal') {
        report.Message = 'Local presentation stopped. USB Mode requires a source to be shared on screen for use.'
        console.error(report)
    } else {
        console.debug(report)
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
                console.error(error)
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
                console.error(error)
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
            console.error(error)
        })
        report.Message = `screenShare.mode set to "${screenShare_Mode}" sharing system default source: ${defaultSource}`
    }
    return console.info(report)
}

const memConfig = {
    "storageMacro": `prjUSB_MemoryStorage`, //Name for Storage Macro
};

var mem = {
    "localScript": module.name.replace('./', '')
};

function memoryInit() {
    return new Promise((resolve) => {
        xapi.command('macros macro get', {
            Name: memConfig.storageMacro
        }).then(() => {

        }).catch(e => {
            console.warn('Uh-Oh, no storage Macro found, building "' + memConfig.storageMacro);
            xapi.command('macros macro save', {
                    Name: memConfig.storageMacro
                },
                `var memory = {\n\t"./_$Info": {\n\t\t"Warning": "Do NOT modify this document, as other Scripts/Macros may rely on this information", \n\t\t"AvailableFunctions": {\n\t\t\t"local": ["mem.read('key')", "mem.write('key', 'value')", "mem.remove('key')", "mem.print()"],\n\t\t\t"global": ["mem.read.global('key')", "mem.write.global('key', 'value')", "mem.remove.global('key')", "mem.print.global()"]\n\t\t},\n\t\t"Guide": "https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/tree/master/Macro%20Memory%20Storage"\n\t},\n\t"ExampleKey": "Example Value"\n}`
            ).then(() => {
                mem.print.global();
            });

        });
        resolve();
    });
};


memoryInit().then(() => {

}).catch(e => {
    console.log(e)
});

mem.read = function (key) {
    return new Promise((resolve, reject) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: memConfig.storageMacro
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
                reject(new Error('Local Read Error. Object Key: "' + key + '" not found in \'' + memConfig.storageMacro + '\' from script "' + mem.localScript + '"'))
            }
        })
    });
}

mem.read.global = function (key) {
    return new Promise((resolve, reject) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: memConfig.storageMacro
        }).then((event) => {
            let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{')
            let store = JSON.parse(raw)
            if (store[key] != undefined) {
                resolve(store[key])
            } else {
                reject(new Error('Glabal Read Error. Object Key: "' + key + '" not found in \'' + memConfig.storageMacro + '\''))
            }
        })
    });
}

mem.write = function (key, value) {
    return new Promise((resolve) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: memConfig.storageMacro
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
                    Name: memConfig.storageMacro
                },
                `var memory = ${newStore}`
            ).then(() => {
                console.debug('Local Write Complete => "' + mem.localScript + '" : {"' + key + '" : "' + value + '"}');
                resolve(value);
            });
        });
    });
};

mem.write.global = function (key, value) {
    return new Promise((resolve) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: memConfig.storageMacro
        }).then((event) => {
            let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
            let store = JSON.parse(raw);
            store[key] = value;
            let newStore = JSON.stringify(store, null, 4);
            xapi.command('Macros Macro Save', {
                    Name: memConfig.storageMacro
                },
                `var memory = ${newStore}`
            ).then(() => {
                console.debug('Global Write Complete => "' + memConfig.storageMacro + '" : {"' + key + '" : "' + value + '"}');
                resolve(value);
            });
        });
    });
};

mem.remove = function (key) {
    return new Promise((resolve, reject) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: memConfig.storageMacro
        }).then((event) => {
            let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
            let store = JSON.parse(raw);
            let temp;
            if (store[mem.localScript] == undefined) {
                store[mem.localScript] = {};
                temp = store[mem.localScript];
            } else {
                temp = store[mem.localScript];
            };
            if (temp[key] != undefined) {
                let track = temp[key];
                delete(temp[key]);
                store[mem.localScript] = temp;
                let newStore = JSON.stringify(store);
                xapi.command('Macros Macro Save', {
                        Name: memConfig.storageMacro
                    },
                    `var memory = ${newStore}`
                ).then(() => {
                    console.warn('WARNING: Local Object Key {"' + key + '" : "' + track + '"} has been deleted from ' + memConfig.storageMacro + '. Deletion occured in script "' + mem.localScript + '"');
                    resolve(key);
                });
            } else {
                reject(new Error('Local Delete Error. Object Key: "' + key + '" not found under Object "' + mem.localScript + '{}" in "' + memConfig.storageMacro + '"'));
            };
        });
    });
};

mem.remove.global = function (key) {
    return new Promise((resolve, reject) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: memConfig.storageMacro
        }).then((event) => {
            let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
            let store = JSON.parse(raw);
            if (store[key] != undefined) {
                let track = store[key];
                delete(store[key]);
                let newStore = JSON.stringify(store, null, 4);
                xapi.command('Macros Macro Save', {
                        Name: memConfig.storageMacro
                    },
                    `var memory = ${newStore}`
                ).then(() => {
                    console.warn('WARNING: Global Object Key {"' + key + '" : "' + track + '"} has been deleted from ' + memConfig.storageMacro + '. Deletion occured in script "' + mem.localScript + '"');
                    resolve(key);
                });
            } else {
                reject(new Error('Global Delete Error. Object Key: "' + key + '" not found in "' + memConfig.storageMacro + '"'))
            };
        });
    });
};

mem.print = function () {
    return new Promise((resolve, reject) => {
        mem.read.global(mem.localScript).then((log) => {
            console.log(log);
            resolve(log);
        }).catch(e => new Error('Local Print Error: No local key found in "' + memConfig.storageMacro + '"'));
    });
};

mem.print.global = function () {
    return new Promise((resolve, reject) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: memConfig.storageMacro
        }).then((event) => {
            let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
            let store = JSON.parse(raw);
            console.log(store);
            resolve(store);
        });
    });
};

mem.info = function () {
    mem.read.global("./_$Info").then((log) => {
        console.log(log);
    });
};
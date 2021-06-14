/***********************************************
 * Author: Robert McGonigle Jr
 * 
 * Harvard University Information Technology
 * 
 * Released: May 2021
 * Updated: June 2021
 * 
 * Channel: Beta
 * 
 * Name: JoinZoom_Main_4-1-1
 * Version: 4-1-1
 * 
 * Description: Make the UX for Joining a Zoom meeting simple.
 *   - Zoom DTMF Tools have been simplified and are accessible through a custom Zoom Tools menu
 *   - New Configuration Menu(s)
 *      - JoinZoom_Config_4-1-1
 *          - This has the bulk of configurable options for this tool 
 *      - JoinZoom_JoinText_4-1-1
 *          - This contains the Flavor Text for entering the call
 * 
 * Script Dependencies
 *   - JoinZoom_Config_4-1-1
 *   - JoinZoom_JoinText_4-1-1
 *   - Memory_Functions
 *   - Memory_Storage
 * 
 * What's New in 4-1-1
 *  Additions
 *   - Zoom Advanced Options
 *      - New configuration items available to better define how this system will behave in call
 *   - DualScreen mode fully Functional
 *      - On - Enables Dual Screen Mode
 *      - Off - Disables Dual Screen Mode
 *      - Auto - Attempts to determine if 2 Displays are connected.
 *        - This check is performed every time the Join Zoom button is opened
 * 
 * Bug Fixes
 *   - UI warning on Sx Mx Dx Series Endpoints
 *   - Exports Failing to make it to Main on Sx Mx Dx Series Endpoints
 *   - Dual Screen Mode was not functional
 *   - Suppress Menu mode was not functional
 *   - Fix for new DTMF Feedback mode for Sx Mx Dx series, preventing the use of Zoom Tools
 * 
 * Changes Made
 *   - Removed Suppress Menu Config, now available in new advanced options
 *   - New strict host Key regex, to address the new advanced options
 *   - All exports in each script have been moved to bottom of the script
 * 
 * Successful Update Requires
 *   - Removal of all scripts and UI elements of Join Zoom version 4-1-0 and lower
 *   - Replace Memory_Functions script with the one available here. Export has moved
 *
 * Open Caveats
 *   - Classic UI missing pages for confirmation page
 *   - New UI - Blank Host Key allows Host DTMF
 *   - New UI - Selecting Participant after entering Host Key does not Clear host Key
 * 
 * What's New in 4-1-0
 *  Additions
 *   - Personal Mode [ ]
 *      - New UI only. Adds in a separate page to save and launch a Personal Zoom Room
 *      - Requires a new UI to handle this
 *      - Requires 2 new Scripts for persistent memory storage
 *  Bug Fixes
 *   - Zoom Tools showing in Non-Zoom meetings... [✔]
 *   - Detect when a host key is entered when the system is dialed [✔]
 *   - Fix double firing of the SIP dial string confirmation [✔]
 ***********************************************/

import xapi from 'xapi';
import { config, sleep, checkRegex, findDTMF, sendDTMF, dialZoom, formSIP, handleDualScreen } from './JoinZoom_Config_4-1-1'
import { page } from './JoinZoom_JoinText_4-1-1'
import { mem } from './Memory_Functions'; mem.localScript = module.name;

let meetingInfo = {
    meetingid: '',
    passcode: '',
    hostkey: '',
    role: ''
}

async function init() {
    await sleep(5000)
    let message = { 'Init': {} }
    let pmiInfo = {
        "TWVldGluZ0lk": "",
        "UGFzc2NvZGU=": "",
        "SG9zdEtleQ==": ""
    }
    detectCall()
    zoomToolsVisibility('Hidden');
    if (config.ui.settings.joinWebex) {
        await xapi.config.set('UserInterface Features Call JoinWebex', 'Auto').then(() => {
        })
    } else {
        await xapi.config.set('UserInterface Features Call JoinWebex', 'Hidden').then(() => {
        })
    }
    message.Init['PersonalMode'] = {}
    if (config.ui.settings.personalMode) {
        await mem.read(btoa('PMIInfo')).then((result) => {
            message.Init.PersonalMode['Enabled'] = true;
            let isSet = 0;
            if (result[btoa('MeetingId')] == '' || [btoa('MeetingId')] == undefined) {
                isSet++
            }
            if (result[btoa('Passcode')] == '' || [btoa('Passcode')] == undefined) {
                isSet++
            }
            if (result[btoa('HostKey')] == '' || [btoa('HostKey')] == undefined) {
                isSet++
            }
            console.log(isSet)
            if (isSet > 0) {
                message.Init.PersonalMode['isSet?'] = false;
            } else {
                message.Init.PersonalMode['isSet?'] = true;
            }
        }).catch((e) => {
            console.debug(e)
            return mem.write(btoa('PMIInfo'), pmiInfo).then(() => {
                message.Init.PersonalMode['Enabled'] = true;
                message.Init.PersonalMode['isSet?'] = false;
            })
        })
    } else {
        await sleep().then(() => {
            message.Init.PersonalMode['Enabled'] = false;
            message.Init.PersonalMode['isSet?'] = false;
            mem.remove.global(module.name).then(() => {

            }).catch((e) => {
                console.debug(e)
            })
        })
    }
    return new Promise((resolve) => {
        resolve(message)
    })
}

init().then((message) => {
    console.info(message, `init Complete. Script ready for use.`)
})

function zoomToolsVisibility(visibility) {
    if (config.ui.settings.dtmfTools) {
        xapi.command('UserInterface Extensions Panel Update', {
            PanelId: `jzoomTools~${config.version}~Tools~Visible`,
            Visibility: visibility
        })
    }
    else {
        xapi.command('UserInterface Extensions Panel Update', {
            PanelId: `jzoomTools~${config.version}~Tools~Visible`,
            Visibility: 'Hidden'
        })
    }
}

function detectCall() {
    xapi.status.once('Call RemoteNumber', (remoteNumber) => {
        xapi.event.once('CallSuccessful', (call) => {
            let verifyZoom = config.regex.zoom_SIP.any.test(remoteNumber)
            if (verifyZoom) {
                zoomToolsVisibility('Auto');
                let verifyHost = config.regex.zoom_SIP.strict.hostKey.test(remoteNumber)
                if (verifyHost) {
                    meetingInfo.role = 'host'
                }
            } else {
                zoomToolsVisibility('Hidden');
            }
        })
    })
}

xapi.event.on('CallDisconnect', (info) => {
    meetingInfo = {
        meetingid: '',
        passcode: '',
        hostkey: '',
        role: ''
    }
    zoomToolsVisibility('Hidden');
    if (config.securityMode == 'On') {
        xapi.command('CallHistory Get', {

        }).then((result) => {
            console.log(result.Entry[0])
            let temp = result.Entry[0].CallbackNumber.split('@');
            if (temp[1] == 'zoomcrc.com') {
                console.log(true)
                xapi.command('CallHistory DeleteEntry', {
                    CallHistoryId: result.Entry[0].CallHistoryId,
                    DeleteConsecutiveDuplicates: 'True'
                })
            } else {

            }
        });
    }
    detectCall()
})

xapi.event.on('UserInterface Extensions Panel Clicked', (event) => {
    switch (event.PanelId) {
        case 'joinZoom~' + config.version:
            handleDualScreen()
            switch (config.ui.settings.style) {
                case 'new':
                    meetingInfo = {
                        meetingid: '',
                        passcode: '',
                        hostkey: '',
                        role: ''
                    }
                    if (config.ui.settings.personalMode) {
                        mem.read(btoa('PMIInfo')).then((response) => {
                            let pmiInfo = {
                                "TWVldGluZ0lk": response["TWVldGluZ0lk"],
                                "UGFzc2NvZGU=": response["UGFzc2NvZGU="],
                                "SG9zdEtleQ==": response["SG9zdEtleQ=="]
                            }
                            updatePersonalTextbox(pmiInfo['TWVldGluZ0lk'], pmiInfo['UGFzc2NvZGU='], pmiInfo['SG9zdEtleQ=='])
                        })
                        xapi.command('UserInterface Extensions Panel Open', {
                            PanelId: `joinZoom~${config.version}~Style_New+Personal`
                        })
                        xapi.command('UserInterface Extensions Widget SetValue', {
                            Value: '5-40 Digit Meeting Id',
                            WidgetId: `joinZoom~${config.version}~Style_New+Personal~MeetingId~Text`
                        })
                        xapi.command('UserInterface Extensions Widget SetValue', {
                            Value: 'Passcode',
                            WidgetId: `joinZoom~${config.version}~Style_New+Personal~Passcode~Text`
                        })
                        xapi.command('UserInterface Extensions Widget Action', {
                            Type: 'released',
                            WidgetId: `joinZoom~${config.version}~Style_New+Personal~Role`,
                            Value: `joinZoom~${config.version}~Style_New+Personal~Role~Participant`
                        })
                        xapi.command('UserInterface Extensions Widget SetValue', {
                            Value: '- - - - - - - - - - - - - -',
                            WidgetId: `joinZoom~${config.version}~Style_New+Personal~HostKey~Text`
                        })
                    } else {
                        xapi.command('UserInterface Extensions Panel Open', {
                            PanelId: `joinZoom~${config.version}~Style_New`
                        })
                        xapi.command('UserInterface Extensions Widget SetValue', {
                            Value: '5-40 Digit Meeting Id',
                            WidgetId: `joinZoom~${config.version}~Style_New~MeetingId~Text`
                        })
                        xapi.command('UserInterface Extensions Widget SetValue', {
                            Value: 'Passcode',
                            WidgetId: `joinZoom~${config.version}~Style_New~Passcode~Text`
                        })
                        xapi.command('UserInterface Extensions Widget Action', {
                            Type: 'released',
                            WidgetId: `joinZoom~${config.version}~Style_New~Role`,
                            Value: `joinZoom~${config.version}~Style_New~Role~Participant`
                        })
                        xapi.command('UserInterface Extensions Widget SetValue', {
                            Value: '- - - - - - - - - - - - - -',
                            WidgetId: `joinZoom~${config.version}~Style_New~HostKey~Text`
                        })
                    }
                    break;
                case 'classic':
                default:
                    page.meetingID(config.additionalFlavorText)
                    break;
            }
            break;
        case `jzoomTools~${config.version}~Tools~Visible`:
            switch (meetingInfo.role) {
                case 'host':
                    xapi.command('UserInterface Extensions Panel Open', {
                        PanelId: `jzoomTools~${config.version}~Tools~host`
                    })
                    break;
                case 'participant':
                default:
                    xapi.command('UserInterface Extensions Panel Open', {
                        PanelId: `jzoomTools~${config.version}~Tools~participant`
                    })
                    break;
            }
        default:
            break;
    }
})

xapi.event.on('UserInterface Message TextInput Response', (event) => {
    let x = event.FeedbackId.split('~')
    let feedbackVersion = x[0]
    let pmiInfo = {
        "TWVldGluZ0lk": "",
        "UGFzc2NvZGU=": "",
        "SG9zdEtleQ==": ""
    }
    page.number = x[1];
    page.type = x[2]
    console.debug('Scope: ', page.number, page.type)
    if (feedbackVersion == "join_zoom_v_" + config.version) {
        switch (page.number) {
            case '01':
                checkRegex(event.Text, 'meetingid').then((check) => {
                    if (check) {
                        meetingInfo.meetingid = btoa(event.Text);
                        switch (page.type) {
                            case 'opr':
                            case 'err':
                                if (config.ui.settings.style == 'new') {
                                    if (config.ui.settings.personalMode) {
                                        xapi.command('UserInterface Extensions Widget SetValue', {
                                            Value: event.Text,
                                            WidgetId: `joinZoom~${config.version}~Style_New+Personal~MeetingId~Text`
                                        })
                                    } else {
                                        xapi.command('UserInterface Extensions Widget SetValue', {
                                            Value: event.Text,
                                            WidgetId: `joinZoom~${config.version}~Style_New~MeetingId~Text`
                                        })
                                    }
                                } else {
                                    page.role(event.Text)
                                }
                                break;
                            default:
                                break;
                        }
                    }
                }).catch((e) => {
                    console.warn(e, 'Prompting user to re-enter...')
                    page.meetingID.error()
                })
                break;
            case '03':
                checkRegex(event.Text, 'passcode').then((check) => {
                    if (check == true) {
                        meetingInfo.passcode = btoa(event.Text);
                        switch (page.type) {
                            case 'opr':
                            case 'err':
                                if (config.ui.settings.style == 'new') {
                                    if (config.ui.settings.personalMode) {
                                        xapi.command('UserInterface Extensions Widget SetValue', {
                                            Value: event.Text,
                                            WidgetId: `joinZoom~${config.version}~Style_New+Personal~Passcode~Text`
                                        })
                                    } else {
                                        xapi.command('UserInterface Extensions Widget SetValue', {
                                            Value: event.Text,
                                            WidgetId: `joinZoom~${config.version}~Style_New~Passcode~Text`
                                        })
                                    }
                                } else {
                                    if (meetingInfo.role == 'participant') {
                                        page.confirmation(atob(meetingInfo.meetingid), meetingInfo.role, atob(meetingInfo.passcode), atob(meetingInfo.hostkey))
                                    } else {
                                        page.hostKey(event.Text)
                                    }
                                }
                                break;
                            default:
                                break;
                        }
                    }
                }).catch((e) => {
                    console.warn(e, 'Prompting user to re-enter...')
                    page.passcode.error()
                })
                break;
            case '04':
                checkRegex(event.Text, 'hostkey').then((check) => {
                    if (check == true) {
                        meetingInfo.hostkey = btoa(event.Text);
                        switch (page.type) {
                            case 'opr':
                            case 'err':
                                if (config.ui.settings.style == 'new') {
                                    meetingInfo.role = 'host';
                                    if (config.ui.settings.personalMode) {
                                        xapi.command('UserInterface Extensions Widget SetValue', {
                                            Value: `Host Key: ${event.Text}`,
                                            WidgetId: `joinZoom~${config.version}~Style_New+Personal~HostKey~Text`
                                        })
                                    } else {
                                        xapi.command('UserInterface Extensions Widget SetValue', {
                                            Value: `Host Key: ${event.Text}`,
                                            WidgetId: `joinZoom~${config.version}~Style_New~HostKey~Text`
                                        })
                                    }
                                    meetingInfo.role = 'host';
                                } else {
                                    page.confirmation(atob(meetingInfo.meetingid), meetingInfo.role, atob(meetingInfo.passcode), atob(meetingInfo.hostkey))
                                }
                                break;
                            default:
                                break;
                        }
                    }
                }).catch((e) => {
                    console.warn(e, 'Prompting user to re-enter...')
                    page.hostKey.error()
                })
                break;
            case 'p1':
                switch (page.type) {
                    case 'opr':
                    case 'err':
                        mem.read(btoa('PMIInfo')).then((response) => {
                            pmiInfo = {
                                "TWVldGluZ0lk": btoa(event.Text),
                                "UGFzc2NvZGU=": response["UGFzc2NvZGU="],
                                "SG9zdEtleQ==": response["SG9zdEtleQ=="]
                            }
                            updatePersonalTextbox(pmiInfo['TWVldGluZ0lk'], pmiInfo['UGFzc2NvZGU='], pmiInfo['SG9zdEtleQ=='])
                            mem.write(btoa('PMIInfo'), pmiInfo)
                        })
                        break;
                }
                break;
            case 'p2':
                switch (page.type) {
                    case 'opr':
                    case 'err':
                        mem.read(btoa('PMIInfo')).then((response) => {
                            pmiInfo = {
                                "TWVldGluZ0lk": response["TWVldGluZ0lk"],
                                "UGFzc2NvZGU=": btoa(event.Text),
                                "SG9zdEtleQ==": response["SG9zdEtleQ=="]
                            }
                            updatePersonalTextbox(pmiInfo['TWVldGluZ0lk'], pmiInfo['UGFzc2NvZGU='], pmiInfo['SG9zdEtleQ=='])
                            mem.write(btoa('PMIInfo'), pmiInfo)
                        })
                        break;
                }
                break
            case 'p3':
                switch (page.type) {
                    case 'opr':
                    case 'err':
                        mem.read(btoa('PMIInfo')).then((response) => {
                            pmiInfo = {
                                "TWVldGluZ0lk": response["TWVldGluZ0lk"],
                                "UGFzc2NvZGU=": response["UGFzc2NvZGU="],
                                "SG9zdEtleQ==": btoa(event.Text)
                            }
                            updatePersonalTextbox(pmiInfo['TWVldGluZ0lk'], pmiInfo['UGFzc2NvZGU='], pmiInfo['SG9zdEtleQ=='])
                            mem.write(btoa('PMIInfo'), pmiInfo)
                        })
                        break;
                }
                break;
            default:
                break;
        }
    }
})

xapi.event.on('UserInterface Message TextInput Clear', (event) => {
    if (config.ui.settings.style == 'new') {
        switch (event.FeedbackId) {
            case `join_zoom_v_${config.version}~04~opr`:
            case `join_zoom_v_${config.version}~04~err`:
                if (config.ui.settings.personalMode) {
                    xapi.command('UserInterface Extensions Widget Action', {
                        Type: 'released',
                        WidgetId: `joinZoom~${config.version}~Style_New~Role`,
                        Value: `joinZoom~${config.version}~Style_New+Personal~Role~Participant`
                    })
                } else {
                    xapi.command('UserInterface Extensions Widget Action', {
                        Type: 'released',
                        WidgetId: `joinZoom~${config.version}~Style_New~Role`,
                        Value: `joinZoom~${config.version}~Style_New~Role~Participant`
                    })
                }
                break;
            default:
                break;
        }
    }
})

xapi.event.on('UserInterface Message Prompt Response', (event) => {
    let x = event.FeedbackId.split('~')
    let feedbackVersion = x[0]
    page.number = x[1];
    page.type = x[2]
    console.debug('Scope: ', page.number, page.type)
    if (feedbackVersion == "join_zoom_v_" + config.version) {
        switch (page.number) {
            case '02':
                if (x[2] === 'opr') {
                    if (config.ui.settings.style == 'new') {
                        switch (event.OptionId) {
                            case '1':
                                page.passcode(atob(meetingInfo.meetingid), "Enter")
                                break;
                            case '2':
                                dialZoom(meetingInfo.meetingid, meetingInfo.passcode, meetingInfo.hostkey);
                                if (meetingInfo.role == 'host') {
                                    xapi.command('UserInterface Message Prompt Display', {
                                        Title: "Connecting to Zoom",
                                        Text: `Entering Meeting: ${atob(meetingInfo.meetingid)}`,
                                        Duration: 5,
                                        'Option.1': 'Dismiss'
                                    })
                                } else {
                                    xapi.command('UserInterface Message Prompt Display', {
                                        Title: "Connecting to Zoom",
                                        Text: `Entering Meeting: ${atob(meetingInfo.meetingid)}<p>Please wait for the host to start the call.`,
                                        Duration: 20,
                                        'Option.1': 'Dismiss'
                                    })
                                }
                                break;
                            case '3':
                                break;
                            default:
                                break;
                        }
                    } else {
                        switch (event.OptionId) {
                            case '1':
                                meetingInfo.role = 'participant'
                                page.passcode(atob(meetingInfo.meetingid))
                                break;
                            case '2':
                                meetingInfo.role = 'host'
                                page.passcode(atob(meetingInfo.meetingid))
                                break;
                            case '3':
                                break;
                            default:
                                break;
                        }
                    }
                }
                break;
            case '05':
            case '1':
                dialZoom(meetingInfo.meetingid, meetingInfo.passcode, meetingInfo.hostkey)
                if (meetingInfo.role == 'host') {
                    xapi.command('UserInterface Message Prompt Display', {
                        Title: "Connecting to Zoom",
                        Text: `Entering Meeting: ${atob(meetingInfo.meetingid)}`,
                        Duration: 5,
                        'Option.1': 'Dismiss'
                    })
                } else {
                    xapi.command('UserInterface Message Prompt Display', {
                        Title: "Connecting to Zoom",
                        Text: `Entering Meeting: ${atob(meetingInfo.meetingid)}<p>Please wait for the host to start the call.`,
                        Duration: 20,
                        'Option.1': 'Dismiss'
                    })
                }
                break;
            case '2':
                break;
            case '3':
                break;
            default:
                break;
        }
    }
})

xapi.event.on('Userinterface Extensions Widget Action', (event) => {
    if (event.Type == 'released') {
        findDTMF(event.WidgetId).then((result) => {
            if (result.source == 'zoomTools') {
                console.log(`"${result.nickName}" released, Entering DTMF: *${result.dtmfSequence}`)
                switch (config.ui.settings.dtmfFeedback.mode) {
                    case 'On':
                        sendDTMF.normal(result.dtmfSequence);
                        break;
                    case 'Off':
                    case 'Tone':
                        sendDTMF.silence(result.dtmfSequence);
                        break;
                    case 'Soften':
                        sendDTMF.soften(result.dtmfSequence);
                        break;
                }
            }
        });
        switch (event.WidgetId) {
            case `joinZoom~${config.version}~Style_New~MeetingId~Enter`:
            case `joinZoom~${config.version}~Style_New+Personal~MeetingId~Enter`:
                page.meetingID(config.additionalFlavorText, 'Enter')
                break;
            case `joinZoom~${config.version}~Style_New~Passcode~Enter`:
            case `joinZoom~${config.version}~Style_New+Personal~Passcode~Enter`:
                page.passcode(atob(meetingInfo.meetingid), 'Enter')
                break
            case `joinZoom~${config.version}~Style_New~Role`:
            case `joinZoom~${config.version}~Style_New+Personal~Role`:
                switch (event.Value) {
                    case `joinZoom~${config.version}~Style_New~Role~Participant`:
                    case `joinZoom~${config.version}~Style_New+Personal~Role~Participant`:
                        meetingInfo.role = 'participant'
                        break;
                    case `joinZoom~${config.version}~Style_New~Role~Host`:
                    case `joinZoom~${config.version}~Style_New+Personal~Role~Host`:
                        //joinZoom~4-1-1~Style_New+Personal~Role~Host
                        page.hostKey(atob(meetingInfo.meetingid), 'Enter')
                        break;
                    default:
                        break;
                }
                break;
            case `joinZoom~${config.version}~Style_New~HostKey~CallZoom`:
            case `joinZoom~${config.version}~Style_New+Personal~HostKey~CallZoom`:
                if (meetingInfo.meetingid == '') {
                    page.missing.meetingId('', 'Enter');
                } else {
                    if (meetingInfo.passcode == '') {
                        page.missing.passcode();
                    } else {
                        dialZoom(meetingInfo.meetingid, meetingInfo.passcode, meetingInfo.hostkey);
                        if (meetingInfo.role == 'host') {
                            xapi.command('UserInterface Message Prompt Display', {
                                Title: "Connecting to Zoom",
                                Text: `Entering Meeting: ${atob(meetingInfo.meetingid)}`,
                                Duration: 5,
                                'Option.1': 'Dismiss'
                            })
                        } else {
                            xapi.command('UserInterface Message Prompt Display', {
                                Title: "Connecting to Zoom",
                                Text: `Entering Meeting: ${atob(meetingInfo.meetingid)}<p>Please wait for the host to start the call.`,
                                Duration: 20,
                                'Option.1': 'Dismiss'
                            })
                        }
                    }
                }
                break;
            //Personal Mode
            case 'joinZoom~4-1-1~Style_New+Personal~HostKey~CallPersonalZoom':
                mem.read(btoa('PMIInfo')).then((result) => {
                    meetingInfo = {
                        meetingid: result[btoa('MeetingId')],
                        passcode: result[btoa('Passcode')],
                        hostkey: result[btoa('HostKey')],
                        role: 'host'
                    }
                    dialZoom(meetingInfo.meetingid, meetingInfo.passcode, meetingInfo.hostkey);
                }).catch((e) => {
                    console.warn(e)
                })
                break;
            case 'joinZoom~4-1-1~Style_New+Personal~Store~MeetingId~Enter':
                page.personal.meetingId()
                break;
            case 'joinZoom~4-1-1~Style_New+Personal~Store~Passcode~Enter':
                page.personal.passcode()
                break;
            case 'joinZoom~4-1-1~Style_New+Personal~Store~HostKey~Enter':
                page.personal.hostKey()
                break;
            default:
                break;
        }
    }
})

function updatePersonalTextbox(id, pass, key) {
    let string = {
        thisID: "Not Set",
        thisPass: "Not Set",
        thisKey: "Not Set"
    }
    if (id != '' && id != undefined) {
        string.thisID = atob(id)
    }
    if (pass != '' && pass != undefined) {
        string.thisPass = "Set"
    }
    if (key != '' && key != undefined) {
        string.thisKey = "Set"
    }
    xapi.command('UserInterface Extensions Widget SetValue', {
        Value: `Meeting ID: ${string.thisID} || Passcode: ${string.thisPass} || HostKey: ${string.thisKey}`,
        WidgetId: `joinZoom~${config.version}~Style_New+Personal~Store~MeetingId~Text`
    })
}
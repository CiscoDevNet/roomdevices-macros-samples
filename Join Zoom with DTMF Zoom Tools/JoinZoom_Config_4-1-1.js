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
 * Name: JoinZoom_Config_4-1-1
 * Version: 4-1-1
 * 
 * Description: Configuration settings for Join Zoom version 4
 * 
 * Script Dependencies
 *   - JoinZoom_JoinText_4-1-1
 *   - JoinZoom_Main_4-1-1
 ***********************************************/

import xapi from 'xapi';

const config = {
    version: '4-1-1', // Macro Version Number
    sipPattern: 'zoomcrc.com', // The Zoom CRC SIP address used in your Org
    additionalFlavorText: '', //Flavor text that shows up under the Enter Meeting ID prompt. Max Char = 70
    securityMode: 'Off', //<"On", "Off"> //Deletes last call from recents if it includes "zoomcrc.com". Does not search and clear pre-existing entries.
    dualScreen: 'Auto', //<“On”, “Off”, “Auto”> //Configure if system is Dual Screen to leverage both screens for Video, Auto will attempt to determine based on HDMI output connectivity
    regex: { // Only change Regex to Match our Orgs Zoom Account rules around Meeting IDs Host Keys and Passcodes
        zoom_SIP: {
            any: /^([0-9_\-]+).([0-9_\.-]+)..([0-9_\.-]+)@zoomcrc.com$/,
            strict: {
                regular: /^([0-9_\-]+)@zoomcrc.com$/,
                passcode: /^([0-9_\-]+)\.([0-9_\.-]+)@zoomcrc.com$/,
                hostKey: /^([0-9_\-]+)\.([0-9_\.-]+)\.([0-9_\.-]+|)\.([0-9_\.-]{6})@zoomcrc.com$/,
            }
        }, //Identifies valid Zoom SIP strings
        zoom_restrictions: {
            meetingid: /^[0-9]{5,40}$/, //Allows any numeric value from 5-40
            passcode: /.*/, // No restrictions
            hostkey: /^$|^[0-9]{6}$/, //Allows Empty string or 6 digits
        }
    },
    ui: {
        settings: { //Governs how the Join Zoom button looks like
            style: "new", // <"classic", "new">
            personalMode: false, //<true, false>   //not built yet       //Only available with "new" style. Creates an area to save personal Zoom Room credentials for Quick Entry
            joinWebex: true, //<true, false>                 //Show or hide the Join Webex Button
            dtmfTools: true, //<true, false>                  //Show or Hide the Zoom Tools button in Zoom Calls
            dtmfFeedback: {
                mode: "Off", //<"On", "Off", "Tone", "Soften">         //Enable Soften DTMF, this lowers your system volume to
                threshold: 25 //The target audio threshold for Soften Mode Only
            },
        }
    },
    advancedZoomOptions: [
        {
            name: `Cap 720p`,
            description: `Force sending default video size to the device, max 720p`,
            mode: false,
            value: `100003`
        },
        {
            name: `Favor Video Channel Bandwidth`,
            description: `Favor video for bandwidth (Uses 3/4 Bandwidth for video and 1/4 bandwidth for content).`,
            mode: false,
            value: `100004`
        },
        {
            name: `Equal Bandwidth for Video and Content`,
            description: `Equal shared bandwidth for both video and content.`,
            mode: false,
            value: `100005`
        },
        {
            name: `Favor Content Channel Bandwidth`,
            description: `Favor content sharing for bandwidth (Uses 3/4 bandwidth for content and 1/4 Bandwidth for video).`,
            mode: false,
            value: `100006`
        },
        {
            name: `AES-256 Encryption`,
            description: `Enable AES-256 encryption.`,
            mode: false,
            value: `100009`
        },
        {
            name: `Force out-of-band DTMF`,
            description: `Force out-of-band DTMF signal.`,
            mode: false,
            value: `200001`
        },
        {
            name: `Suppress Meeting Audio Prompts`,
            description: ` 	Suppress audio prompts when joining a meeting.`,
            mode: false,
            value: `200006`
        },
        {
            name: `Video Sharing for Device`,
            description: `Enable video sharing mode for device sharing.`,
            mode: false,
            value: `200009`
        },
        {
            name: `Set Volume Level 1`,
            description: `Use Audio Volume Level 1 when joining a meeting.`,
            mode: false,
            value: `300001`
        },
        {
            name: `Set Volume Level 2`,
            description: `Use Audio Volume Level 2 when joining a meeting.`,
            mode: false,
            value: `300002`
        },
        {
            name: `Set Volume Level 3`,
            description: `Use Audio Volume Level 3 when joining a meeting.`,
            mode: false,
            value: `300003`
        },
        {
            name: `Enable Music Mode`,
            description: `Music sharing mode for device sharing.`,
            mode: false,
            value: `306`
        },
        {
            name: `Enable Dual Stream`,
            description: `Send 2 video streams down from Zoom. Requires Dual Displays`,
            mode: false, //DO NOT MODIFY, this feature is overwritten by the dualScreen Config above.
            value: `308`
        },
        {
            name: `Enable 1080p Support`,
            description: `Enables 1080p video support. You need to have Group HD enabled and set to 1080p in the Zoom admin portal. You need to have a 3Mb SIP call rate into Zoom CRC.`,
            mode: false,
            value: `309`
        },
        {
            name: `Suppress Zoom DTMF Menu`,
            description: `Suppress visual menu. Can be re-enabled by pressing 7 on a DTMF remote.`,
            mode: true,
            value: `504`
        },
        {
            name: `Force Single Stream Video`,
            description: `Disables dual-stream video and forces video and content as a single-stream.`,
            mode: false,
            value: `505`
        },
        {
            name: `Move Closed Captioning`,
            description: `Change layout for closed captioning. When enabled moves closed captioning to the bottom of the screen.`,
            mode: false,
            value: `506`
        },
        {
            name: `Suppress Reactions`,
            description: `Suppress in-meeting reactions displaying from other participants.`,
            mode: false,
            value: `508`
        }
    ]
}

//_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-
// Advanced Options for Zoom
//_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-



//_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-
// Functions for Main Script
//_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-_-

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function checkRegex(input, rule) {
    return new Promise((resolve, reject) => {
        let x = rule.toLowerCase()
        let y = x.split(' ').join('')
        let result = config.regex.zoom_restrictions[y].test(input)
        if (result === true) {
            resolve(true)
        } else {
            reject({
                'Error': 'Failed "' + y + '" regex check'
            })
        }
    })
}

function findDTMF(input, key = '~') {
    let raw = input.split(key);
    let result = {
        source: raw[0],
        version: raw[1],
        nickName: raw[2],
        dtmfSequence: raw[3]
    }
    return new Promise((resolve) => {
        if (raw[1] == config.version && raw[0] == 'zoomTools') {
            resolve(result)
        }
    })
}

var sendDTMF = []

sendDTMF.normal = function (sequence) {
    return new Promise((resolve) => {
        xapi.command('Call DTMFSend', {
            DTMFString: `*${sequence}`
        }).catch(e => e)
        resolve('DTMF sent: ' + `*${sequence}`);
    })
}

sendDTMF.silence = function (sequence) {
    return new Promise((resolve) => {
        if (config.ui.settings.dtmfFeedback.mode == "Tone") {
            xapi.command('Audio Sound Play', {
                Sound: 'KeyTone'
            })
        }
        xapi.command('Call DTMFSend', {
            DTMFString: `*${sequence}`,
            Feedback: 'Silent'
        }).catch((e) => {
            console.debug(e, `DTMF Failed. Most likely cause: Legacy Endpoint`, `Running Normal DTMF`)
            sendDTMF.normal(sequence)
        })
        resolve('DTMF sent: ' + `*${sequence}`);
    })
}

sendDTMF.soften = async function (sequence) {
    let current_vol;
    await xapi.status.get('Audio Volume').then((vol) => {
        current_vol = vol
        console.log('SoftenDTMF:', 'Getting Volume: ' + vol)
    })
    console.log('SoftenDTMF:', 'Setting Volume: ' + config.ui.settings.dtmfFeedback.threshold)
    await sleep(334);
    await xapi.command('Audio Volume Set', {
        Level: config.ui.settings.dtmfFeedback.threshold
    })
    await sleep(333);
    await sendDTMF.normal(sequence).then((response) => {
        console.log('SoftenDTMF:', 'Running DTMF: ' + response)
    })
    await sleep(333);
    console.log('SoftenDTMF:', 'Restoring Volume: ' + current_vol)
    xapi.command('Audio Volume Set', {
        Level: current_vol
    })
}

function formSIP(mID, pass = '', advOpt = '', key = '') {
    return new Promise((resolve) => {
        let meetingid = atob(mID);
        let passcode = atob(pass);
        let hostkey = atob(key);
        if (pass != '') {
            passcode = '.' + passcode
        } else {
            passcode = '.'
        }
        if (key != '') {
            if (advOpt != '') {
                advOpt = '.' + advOpt
            } else {
                advOpt = ''
            }
            hostkey = '.' + hostkey
        } else {
            if (advOpt != '') {
                advOpt = '.' + advOpt
            } else {
                advOpt = ''
            }
            hostkey = ''
        }
        let sip = meetingid + passcode + advOpt + hostkey + '@' + config.sipPattern
        resolve(sip)
    })
}

async function handleDualScreen() {
    let findDual = ``
    let testOutputs = []
    let allEqual = arr => arr.every( v => v === arr[0] )
    await xapi.status.get('Video Output Connector 1 Connected').then((response) => {
        testOutputs.push(response)
    });
    await xapi.status.get('Video Output Connector 2 Connected').then((response) => {
        testOutputs.push(response)
    });
    await sleep().then(() => {
        findDual = config.advancedZoomOptions.findIndex((dual) => dual.value == `308`)
        console.log(config.advancedZoomOptions[findDual].mode, 'original value for Dual')
    })
    await sleep().then(() => {
        switch (config.dualScreen) {
            case 'On':
            case 'on':
                config.advancedZoomOptions[findDual].mode = true
                break;
            case 'Off':
            case 'off':
                config.advancedZoomOptions[findDual].mode = true
                break;
            case 'Auto':
            case 'auto':
                if (allEqual(testOutputs)) {
                    if (testOutputs[0] == 'True'){
                        config.advancedZoomOptions[findDual].mode = true
                    } else {
                        config.advancedZoomOptions[findDual].mode = false
                    }
                } else {
                    config.advancedZoomOptions[findDual].mode = false
                }
                break;
            default:
                break;
        }
    })
    console.log(config.advancedZoomOptions[findDual].mode, `new value for dual`)
}

async function formAdvOpt() {
    return new Promise((resolve) => {
        let str = ``
        let report = []
        for (let i = 0; i < config.advancedZoomOptions.length; i++) {
            if (config.advancedZoomOptions[i].mode) {
                report.push(config.advancedZoomOptions[i].name)
                str = str + config.advancedZoomOptions[i].value;
            }
        }
        console.info({
            message: `The following Advanced Zoom options have been enabled for this call`,
            options: report,
            injectingSequence: str
        })
        resolve(str)
    })
}

async function dialZoom(mID, pass = '', key = '') {
    let addOn = ``
    await formAdvOpt().then((result) => {
        addOn = result;
    })
    await formSIP(mID, pass, addOn, key).then((sip) => {
        xapi.command('Dial', {
            Number: sip
        })
    })
}

export {
    config,
    sleep,
    checkRegex,
    findDTMF,
    sendDTMF,
    dialZoom,
    formSIP,
    handleDualScreen
}

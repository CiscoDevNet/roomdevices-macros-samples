/***********************************************
 * Author: Robert McGonigle Jr
 * 
 * Harvard University Information Technology
 * 
 * Released: May 2021
 * Updated: May 2021
 * 
 * Channel: Beta
 * 
 * Name: JoinZoom_Config_4-1-0
 * Version: 4-1-0
 * 
 * Description: Configuration settings for Join Zoom version 4
 * 
 * Script Dependencies
 *   - JoinZoom_JoinText_4-1-0
 *   - JoinZoom_Main_4-1-0
 ***********************************************/

import xapi from 'xapi';
export {
    config,
    sleep,
    checkRegex,
    findDTMF,
    sendDTMF,
    dialZoom,
    formSIP
}

const config = {
    version: '4-1-0', // Macro Version Number
    sipPattern: 'zoomcrc.com', // The Zoom CRC SIP addessed used in your Org
    additionalFlavorText: '', //Flavor text that shows up under the Enter Meeting ID prompt. Max Char = 70
    securityMode: "Off", //<"On", "Off"> //Deletes last call from recents if it includes "zoomcrc.com". Does not search and clear pre-existing entries.
    suppressMenu: "Off", //InDev //<"On", "Off"> //Suppress DTMF menus from popping up for commands. Does not suppress all menus (like Participant List, etc...)
    dualScreen: 'Auto', //InDev //<“On”, “Off”, “Auto”> //Configure if system is Dual Screen to leverage both screens for Video, Auto will attempt to determine based on HDMI output connectivity
    regex: { // Only change Regex to Match our Orgs Zoom Account rules around Meeting IDs Host Keys and Passcodes
        zoom_SIP: {
            any: /^([0-9_\-]+).([0-9_\.-]+)..([0-9_\.-]+)@zoomcrc.com$/,
            strict: {
                regular: /^([0-9_\-]+)@zoomcrc.com$/,
                passcode: /^([0-9_\-]+)\.([0-9_\.-]+)@zoomcrc.com$/,
                hostKey: /^([0-9_\-]+)\.([0-9_\.-]+)\.\.([0-9_\.-]+)@zoomcrc.com$/,
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
                mode: "Tone", //<"On", "Off", "Tone", "Soften">         //Enable Soften DTMF, this lowers your system volume to
                threshold: 25 //The target audio threshold for Soften Mode Only
            },
        }
    }
}

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
        }).catch(e => e)
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

function formSIP(mID, pass = '', key = '') {
    return new Promise((resolve) => {
        let meetingid = atob(mID);
        let passcode = atob(pass);
        let hostkey = atob(key);
        if (pass != '') {
            passcode = '.' + passcode
        } else {
            passcode = ''
        }
        if (key != '') {
            hostkey = '..' + hostkey
        } else {
            hostkey = ''
        }
        let sip = meetingid + passcode + hostkey + '@' + config.sipPattern
        resolve(sip)
    })
}

async function dialZoom(mID, pass = '', key = '') {
    await formSIP(mID, pass, key).then((sip) => {
        xapi.command('Dial', {
            Number: sip
        })
    })
}

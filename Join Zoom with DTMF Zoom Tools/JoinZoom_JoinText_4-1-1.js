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
 * Name: JoinZoom_JoinText_4-1-1
 * Version: 4-1-1
 * 
 * Description: Flavor text for Join Zoom version 4-1-1
 * 
 * Script Dependencies
 *   - JoinZoom_Config_4-1-1
 *   - JoinZoom_Main_4-1-1
 ***********************************************/
import xapi from 'xapi';
import { config } from './JoinZoom_Config_4-1-1'

var page = {}

//|****************************************|\\
/*           Meeting ID Prompts             */
//|****************************************|\\

page.meetingID = function (input = '', submitButton = 'Next') {
    let content = {
        title: "Join Zoom Meeting",
        text: `Enter the MEETING ID then tap ${submitButton}.<p>${input}`,
        duration: 0,
        feedback: "join_zoom_v_" + config.version + "~01~opr",
        submit: submitButton,
        placeholder: "Meeting ID <5-40 digit>",
        type: 'Numeric'
    }
    return prompt.textInput(content)
}

page.meetingID.error = function (input = '', submitButton = 'Next') {
    let content = {
        title: "Join Zoom Meeting",
        text: "Uh-Oh. The ID you entered was not between 5 and 40 digits. Try again or contact your local AV/IT department for assistance",
        duration: 0,
        feedback: "join_zoom_v_" + config.version + "~01~err",
        submit: submitButton,
        placeholder: "Meeting ID <5-40 digit>",
        type: 'Numeric' //SingleLine/Numeric/Password/PIN
    }
    return prompt.textInput(content, true)
}

page.meetingID.reset = {

}

page.meetingID.reset.error = {

}

//|****************************************|\\
/*              Role Prompts                */
//|****************************************|\\

page.role = function (input = '[error]') {
    let content = {
        title: "Select your Zoom Meeting ROLE",
        text: "Please select your role for MeetingID: " + input + "<p>Then follow the remaining prompts",
        duration: 0,
        feedback: "join_zoom_v_" + config.version + "~02~opr",
        option_1: 'Particpant',
        option_2: 'Host',
        option_3: 'Dismiss'
    }
    return prompt.choice(content)
}

//|****************************************|\\
/*             Passcode Prompts             */
//|****************************************|\\

page.passcode = function (input = '[error]', submitButton = 'Next') {
    let content = {
        title: "Enter the Meeting PASSCODE",
        text: "Please enter your PASSCODE for Meeting ID: " + input + "<p>",
        duration: 0,
        feedback: "join_zoom_v_" + config.version + "~03~opr",
        submit: submitButton,
        placeholder: "Enter Passcode or Leave Blank",
        type: 'Numeric' //SingleLine/Numeric/Password/PIN
    }
    return prompt.textInput(content)
}

page.passcode.error = function (input = '[error]', submitButton = 'Next') {
    let content = {
        title: "Enter the Meeting PASSCODE",
        text: "Uh-Oh. The PASSCODE you entered did not match the passcode criteria.<p>Please Re-Enter the PASSCODE",
        duration: 0,
        feedback: "join_zoom_v_" + config.version + "~03~err",
        submit: submitButton,
        placeholder: "Enter Passcode or Leave Blank",
        type: 'Numeric' //SingleLine/Numeric/Password/PIN
    }
    return prompt.textInput(content, true)
}

page.passcode.reset = {

}

page.passcode.reset.error = {

}

//|****************************************|\\
/*             Host Key Prompts             */
//|****************************************|\\

page.hostKey = function (input = '[error]', submitButton = 'Next') {
    let content = {
        title: "Enter your HOST KEY",
        text: "Please enter your HOST KEY for Meeting ID: " + input + "<p>",
        duration: 0,
        feedback: "join_zoom_v_" + config.version + "~04~opr",
        submit: submitButton,
        placeholder: "6 Digit Host Key or Leave Blank",
        type: 'Numeric' //SingleLine/Numeric/Password/PIN
    }
    return prompt.textInput(content)
}

page.hostKey.error = function (input = '[error]', submitButton = 'Next') {
    let content = {
        title: "Enter the Meeting HOST KEY",
        text: "Uh-Oh. The HOST KEY you entered was not 6 digits. Please try again or contact your local AV/IT department for assistance.",
        duration: 0,
        feedback: "join_zoom_v_" + config.version + "~04~err",
        submit: submitButton,
        placeholder: "6 Digit Host Key or Leave Blank",
        type: 'Numeric' //SingleLine/Numeric/Password/PIN
    }
    return prompt.textInput(content, true)
}

page.hostKey.reset = {

}

page.hostKey.reset.error = {

}

//|****************************************|\\
/*         Confirmation Page Prompts        */
//|****************************************|\\

page.confirmation = function (id = '[error]', role = '[error]', pass = '[error]', key = '[error]') {
    let content = {
        title: "Confirm Meeting Information",
        duration: 0,
        feedback: "join_zoom_v_" + config.version + "~05~" + role,
        option_1: 'CORRECT! Connect me to Zoom!',
        option_2: 'Set: Meeting ID',
        option_3: 'Set: Passcode  ',
    }
    if (role == 'host') {
        content['option_4'] = 'Set: Host Key'
        content['option_5'] = 'Dismiss'
        content['text'] = "Meeting ID: " + id + " || Role: " + role + "<p>Host Key: " + key + " || Passcode: " + pass
    } else {
        content['option_4'] = 'Dismiss'
        content['text'] = "Meeting ID: " + id + " || Role: " + role + "<p>Passcode: " + pass
    }
    return prompt.choice(content)
}

page.missing = {}

page.missing.meetingId = function (input = '[error]', submitButton = 'Next') {
    let content = {
        title: "No Meeting ID Found",
        text: `Please Enter the MEETING ID, tap ${submitButton}`,
        duration: 0,
        feedback: "join_zoom_v_" + config.version + "~01~err",
        submit: submitButton,
        placeholder: "Meeting ID <5-40 digit>",
        type: 'Numeric'
    }
    return prompt.textInput(content)
}

page.missing.passcode = function (input = '[error]', submitButton = 'Next') {
    let content = {
        title: "No Passcode Found",
        text: "We recommend you enter the passcode before joining this Zoom meeting.",
        duration: 0,
        feedback: "join_zoom_v_" + config.version + "~02~opr",
        option_1: 'Enter Passcode',
        option_2: 'Join without Passcode',
        option_3: 'Dismiss',
    }
    return prompt.choice(content)
}

page.personal = {};

page.personal.meetingId = function (input = '[error]', submitButton = 'Save') {
    let content = {
        title: "Zoom Personal Meeting: ID",
        text: `Set your Zoom Personal Zoom Meeting ID, then tap ${submitButton}`,
        duration: 0,
        feedback: "join_zoom_v_" + config.version + "~p1~opr",
        submit: submitButton,
        placeholder: "Meeting ID <5-40 digit>",
        type: 'Numeric'
    }
    return prompt.textInput(content)
}

page.personal.passcode = function (input = '[error]', submitButton = 'Save') {
    let content = {
        title: "Zoom Personal Meeting: Passcode",
        text: `Set your Zoom Personal Zoom Meeting Passcode, then tap ${submitButton}`,
        duration: 0,
        feedback: "join_zoom_v_" + config.version + "~p2~opr",
        submit: submitButton,
        placeholder: "Passcode",
        type: 'Numeric'
    }
    return prompt.textInput(content)
}

page.personal.hostKey = function (input = '[error]', submitButton = 'Save') {
    let content = {
        title: "Zoom Personal Meeting: Host Key",
        text: `Set your Zoom HostKey, then tap ${submitButton}`,
        duration: 0,
        feedback: "join_zoom_v_" + config.version + "~p3~opr",
        submit: submitButton,
        placeholder: "6 Digit Host Key",
        type: 'Numeric'
    }
    return prompt.textInput(content)
}

//|****************************************|\\
/*                Functions                 */
//|****************************************|\\
var prompt = {}

prompt.textInput = function (source, error = false) {
    if (error == true) {
        xapi.command('Audio Sound Play', {
            Sound: 'Binding'
        })
    } else {

    }
    xapi.command('UserInterface Message TextInput Display', {
        Title: source.title,
        Text: source.text,
        Duration: source.duration,
        FeedbackId: source.feedback,
        InputType: source.type,
        PlaceHolder: source.placeholder,
        SubmitText: source.submit,
        KeyboardState: 'Open'
    })
}

prompt.choice = function (source, error = false) {
    if (error == true) {
        xapi.command('Audio Sound Play', {
            Sound: 'Binding'
        })
    } else {

    }
    xapi.command('UserInterface Message Prompt Display', {
        Title: source.title,
        Text: source.text,
        Duration: source.duration,
        FeedbackId: source.feedback,
        'Option.1': source.option_1,
        'Option.2': source.option_2,
        'Option.3': source.option_3,
        'Option.4': source.option_4,
        'Option.5': source.option_5,
    })
}

export { prompt, page }

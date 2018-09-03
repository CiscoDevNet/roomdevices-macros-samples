const xapi = require('xapi');

const KEYBOARD_TYPES = {
      NUMERIC     :   'Numeric'
    , SINGLELINE  :   'SingleLine'
    , PASSWORD    :   'Password'
    , PIN         :   'PIN'
}
const CALL_TYPES = {
      AUDIO     :   'Audio'
    , VIDEO     :   'Video'
}

const DIALPAD_ID = 'webexdialpad';
const DIALHOSTPIN_ID = 'webexhostpin';

const INROOMCONTROL_WEBEXCONTROL_PANELID = 'webexdialler';

/* Use these to check that its a valid number (depending on what you want to allow users to call */
const REGEXP_URLDIALER = /([a-zA-Z0-9@_\-\.]+)/; /*  . Use this one if you want to allow URL dialling */
const REGEXP_NUMERICDIALER =  /^([0-9]{3,10})$/; /* Use this one if you want to limit calls to numeric only. In this example, require number to be between 3 and 10 digits. */

const DIALPREFIX_AUDIO_GATEWAY = '0';
const DIALPOSTFIX_WEBEXURL = '@go.webex.com';

var webexnumbertodial = '';
var hostpin = '';
var isInWebexCall = 0;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

xapi.event.on('CallDisconnect', (event) => {
	isInWebexCall = 0;
    });
    
    
    
function showDialPad(text){

         xapi.command("UserInterface Message TextInput Display", {
               InputType: KEYBOARD_TYPES.NUMERIC
             , Placeholder: '9 digit or full dial string'
             , Title: "Webex Call"
             , Text: text
             , SubmitText: "Next" 
             , FeedbackId: DIALPAD_ID
         }).catch((error) => { console.error(error); });
}

/* This is the listener for the in-room control panel button that will trigger the dial panel to appear */
xapi.event.on('UserInterface Extensions Panel Clicked', (event) => {
    if(event.PanelId === INROOMCONTROL_WEBEXCONTROL_PANELID){
         showDialPad("Enter the Webex 9-digit Meeting ID:" );
    }
});



xapi.event.on('UserInterface Message TextInput Response', (event) => {
    switch(event.FeedbackId){
        case DIALPAD_ID:
            let regex =REGEXP_URLDIALER; // First check, is it a valid number to dial
            let match = regex.exec(event.Text);    
            if (match !== null) {
                let contains_at_regex = /@/;    
                let contains_at_in_dialstring = contains_at_regex.exec(event.Text);
                if (contains_at_in_dialstring !== null) {
                    webexnumbertodial = match[1];
                }
                else{
                    webexnumbertodial = match[1];
                    webexnumbertodial = webexnumbertodial + DIALPOSTFIX_WEBEXURL ; // Here we add the default hostname to the SIP number 
                }
                 sleep(200).then(() => { //this is a necessary trick to get it working with multiple touch panels to not mess up event-clears from other panels
  
                 xapi.command("UserInterface Message TextInput Display", {
                       InputType: KEYBOARD_TYPES.PIN
                     , Placeholder: "Hostpin (optional)" 
                     , Title: "Enter Host pin or leave blank"
                     , Text: 'Webex call number:' + webexnumbertodial
                     , SubmitText: "Dial" 
                     , FeedbackId: DIALHOSTPIN_ID
                 }).catch((error) => { console.error(error); });                
                 
            });
                   
            }
            else{
                showDialPad("You typed in an invalid number. Please try again. Format is blablabla..." );
            }
            break;

        case DIALHOSTPIN_ID:
            hostpin = event.Text;
            xapi.command("dial", {Number: webexnumbertodial}).catch((error) => { console.error(error); });
            break;
    }
});



xapi.status.on('Call RemoteNumber', (remoteNumber) => {
	if(remoteNumber.includes('webex.com')){
	    isInWebexCall = 1;
	    sleep(5000).then(() => {
		    if(isInWebexCall){ // need to check again in case call has dropped within the last 5 seconds
                if(hostpin.length>0){
                  xapi.command("Call DTMFSend", {DTMFString: hostpin});  
                    if(!hostpin.includes('#')){
                        xapi.command("Call DTMFSend", {DTMFString: '#'});
                    }
                } 
                else{
                    xapi.command("Call DTMFSend", {DTMFString: '#'});
                }
		    }		    
		});
	}
    });



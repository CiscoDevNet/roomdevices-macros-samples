const xapi = require('xapi');

const DEFAULT_KEYOBARD_TYPE = 'Numeric'; // Other options are: SingleLine, Password, PIN
const DIALPAD_ID = 'dialpad';

/* Use these to check that its a valid number (depending on what you want to allow users to call */
const REGEXP_URLDIALER = /([a-zA-Z0-9@_\-\.]+)/; /*  . Use this one if you want to allow URL dialling */
const REGEXP_NUMERICDIALER =  /^([0-9]{3,10})$/; /* Use this one if you want to limit calls to numeric only. In this case require number to be between 3 and 10 digits. */


function showDialPad(text){
         xapi.command("UserInterface Message TextInput Display", {
               InputType: DEFAULT_KEYOBARD_TYPE
             , Placeholder: "Type number here" 
             , Title: "Dial Pad"
             , Text: text
             , SubmitText: "Call" 
             , FeedbackId: DIALPAD_ID
         });
}

/* This is the listener for the in-room control panel button that will trigger the dial panel to appear */
xapi.event.on('UserInterface Extensions Panel Clicked', (event) => {
    if(event.PanelId == 'dialpad'){
         showDialPad("Please type in the number you want to dial:" );
    }
});


/* Event listener for the dial pad been posted */

xapi.event.on('UserInterface Message TextInput Response', (event) => {
    switch(event.FeedbackId){
        case DIALPAD_ID:
            
            var regex =REGEXP_URLDIALER; //change this to whatever filter you want to check for validity
            var match = regex.exec(event.Text);    
            if (match !== null) {
                 xapi.command("dial", {Number: match[1]});
            }
            else{
                showDialPad("You typed in an invalid number. Please try again. Format is blablabla..." );
            }
            break;
    }
});



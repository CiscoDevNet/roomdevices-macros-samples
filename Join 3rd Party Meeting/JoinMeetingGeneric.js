import xapi from 'xapi';


const KEYBOARD_TYPES = {
  NUMERIC: 'Numeric',
  SINGLELINE: 'SingleLine',
  PASSWORD: 'Password',
  PIN: 'PIN',
};

const CALL_TYPES = {
  AUDIO: 'Audio',
  VIDEO: 'Video',
};

const MEETING_ID = 'meetingID';
const PASSCODE = 'pass';
const INROOMCONTROL_AUDIOCONTROL_PANELID = 'callmeeting'; /* This will be the Panel/Widget ID you are using in the UI Extension */
const postfix = '@yourdomain.com'; /* Define the domain for the meeting service you are using.  Eg. @zoomcrc.com, @MSTeams.tenant, @yourbridge.com */

/* Use these to check that its a valid number (depending on what you want to allow users to call */
const REGEXP_URLDIALER = /([a-zA-Z0-9@_\-\.]+)/; /* Use this one if you want to allow URL dialling */
const REGEXP_NUMERICDIALER =  /^([0-9]{3,10})$/; /* Use this one if you want to limit calls to numeric only. In this example, require number to be between 3 and 10 digits. */

var meetingID = '1234567890';



function getMeetingID(text){

  xapi.Command.UserInterface.Message.TextInput.Display({
    InputType: KEYBOARD_TYPES.NUMERIC,
    Placeholder: "Use keypad to enter the meeting number:",
    Title: "Custom Meeting", /* Create a custom title for your meeting Input Display here */
    Text: text,
    SubmitText: "Join",
    FeedbackId: MEETING_ID,
    }).catch((error) => { console.error(error); });
}


/* This is the listener for the in-room control panel button that will trigger the dial panel to appear */

xapi.Event.UserInterface.Extensions.Panel.Clicked.on((event) => {
    if(event.PanelId === INROOMCONTROL_AUDIOCONTROL_PANELID){
         getMeetingID("Enter the meeting id from your invite:" );
    }
});


/* Event listener for the dial pad being posted */

xapi.Event.UserInterface.Message.TextInput.Response.on((event) => {
    switch(event.FeedbackId){
        case MEETING_ID:
          const regex = REGEXP_NUMERICDIALER; /* Change this to whatever filter you want to check for validity */
          const match = regex.exec(event.Text);
        
          if (match !== null) {
			  meetingID = match[1];
          }
          else{
              showDialPad("You typed in an invalid number. Please try again." );
          }
          break;
        case PASSCODE:
          const pass = event.Text;
          const numbertodial = meetingID + postfix;
          xapi.Command.Dial({
            Number: numbertodial,
            Protocol: 'SIP',
            CallType: CALL_TYPES.VIDEO
          }).catch((error) => { console.error(error); });
          break;
    }
});

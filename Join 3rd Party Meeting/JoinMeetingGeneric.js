import xapi from 'xapi';

// Define the domain for the meeting service you are using.  Eg. @zoomcrc.com, @MSTeams.tenant, @yourbridge.com
const meetingDomain = '@acme.com';

const KEYBOARD_TYPES = {
  NUMERIC: 'Numeric',
  SINGLELINE: 'SingleLine',
  PASSWORD: 'Password',
  PIN: 'PIN',
};

const MEETING_ID = 'meetingID';

/* This will be the Panel/Widget ID you are using in the UI Extension */
const INROOMCONTROL_AUDIOCONTROL_PANELID = 'JoinMeetingPanel'; 

/* Use this one if you want to limit calls to numeric only. In this example, require number to be between 3 and 10 digits. */
const REGEXP_NUMERICDIALER =  /^([0-9]{3,10})$/; 

function getMeetingID(text, value = ''){

  xapi.Command.UserInterface.Message.TextInput.Display({
    InputType: KEYBOARD_TYPES.NUMERIC,
    Placeholder: `No need to type ${meetingDomain}`,
    Title: "Join Meeting", /* Create a custom title for your meeting Input Display here */
    Text: text,
    InputText: value,
    SubmitText: "Join",
    FeedbackId: MEETING_ID,
    })
  .catch((error) => console.error(error));
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
          /* Change this to whatever filter you want to check for validity */
          const regex = REGEXP_NUMERICDIALER; 
          const match = regex.exec(event.Text);

          if (match) {
			      const meetingID = match[1];
            const at = meetingDomain.startsWith('@') ? '' : '@';
            const Number =  meetingID + at + meetingDomain;
            console.log('Dial:', Number);
            xapi.Command.Dial({ Number });
          }
          else{
              getMeetingID("You typed in an invalid number. Please try again.", event.Text );
          }
          break;
    }
});
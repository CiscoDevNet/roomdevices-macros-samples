const xapi = require('xapi');

/*

This macro demonstrates how to have a conditional autoanswer on a system. The macro, upon incoming call, checks whether the remote site is listed in the list of numbers to be auto answered.
If it finds it, it prompts for a few seconds to allow for either an immediate answer OR to reject the call
*/

const AUTOANSWER_NUMBERS = ['mynumber@example.com', 'myothernumber@example.com'];
const AUTOANSWER_DELAY_SECONDS = 10;
var autoanswerhandler;


function normaliseRemoteURI(number){
  var regex = /^(sip:|h323:|spark:|h320:|webex:|locus:)/gi;
  number = number.replace(regex, '');
//  console.log('Normalised Remote URI to ' + number);
  return number;
}

function answerCall(){
  xapi.command('Call Accept').catch(
      (error) =>{
        console.error(error);
      });
}

xapi.event.on('IncomingCallIndication', (event) => {
  console.log(event);
    if(AUTOANSWER_NUMBERS.includes(normaliseRemoteURI(event.RemoteURI))){
        xapi.command("UserInterface Message Alert Display", {Title: 'Incoming Autoanswer-number', Text: 'This call will automatically be answered after ' + AUTOANSWER_DELAY_SECONDS + ' seconds', Duration: AUTOANSWER_DELAY_SECONDS});
        autoanswerhandler = setTimeout(() => answerCall(), AUTOANSWER_DELAY_SECONDS * 1000);
    }
});


xapi.status.on('Call Status', (status) => {
  if(status === 'Connected'){
      clearTimeout(autoanswerhandler);
//      console.log('Call was accepted before auto-answer was performed');
      xapi.command("UserInterface Message Alert Clear");
  }
});

xapi.event.on('CallDisconnect', (event) => {
      clearTimeout(autoanswerhandler);
//      console.log('Call was disconnected before auto-answer was performed');
      xapi.command("UserInterface Message Alert Clear");
});

const xapi = require('xapi');
let isInWebexCall = 0;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

xapi.event.on('CallDisconnect', (event) => {
	isInWebexCall = 0;
    });

xapi.status.on('Call RemoteNumber', (remoteNumber) => {
	if(remoteNumber.includes('webex.com')){
	    isInWebexCall = 1;
	    sleep(5000).then(() => {
		    if(isInWebexCall){ // need to check again in case call has dropped within the last 5 seconds
			xapi.command("UserInterface Message TextInput Display", {
				Duration: 45
				, FeedbackId:'webexpin'
				, InputType: 'PIN'
				, KeyboardState:'Open'
				, Placeholder:'Please enter the host pin PIN'
				, SubmitText:'Submit PIN'
				, Title: 'WebEx Pin'
				, Text: 'Please enter the host pin PIN, followed by #. Not the host: Press #'
			    });
		    }
		});
	}
    });



xapi.event.on('UserInterface Message TextInput Response', (event) => {
	switch(event.FeedbackId){
        case 'webexpin':
	sleep(500).then(() => {
                xapi.command("Call DTMFSend", {DTMFString: event.Text});
                if(!event.Text.includes('#')){
                    xapi.command("Call DTMFSend", {DTMFString: '#'});
                }
            });
	break;
	}
    });

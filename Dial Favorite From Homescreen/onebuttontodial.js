const xapi = require('xapi');

const MYSPEED_DIAL_NUMBER = 'mynumber@mydomain.com';

xapi.event.on('UserInterface Extensions Page Action', (event) => {
    if(event.Type == 'Opened' && event.PageId == 'speed_dial'){
         xapi.command("dial", {Number: MYSPEED_DIAL_NUMBER});
    }
});



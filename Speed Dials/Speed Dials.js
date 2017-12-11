const xapi = require('xapi');


xapi.event.on('UserInterface Extensions Widget Action', (event) => {
    var regex = /^sd_([a-zA-Z0-9@_\-\.]+)$/;
    if(event.Type == 'clicked'){
        var match = regex.exec(event.WidgetId);    
        if (match !== null) {
         xapi.command("dial", {Number: match[1]});
        }
    }
});



const xapi = require('xapi');

function showRoomSetupNotification(eventtext){
    eventtext = eventtext.replace(/\"/g,"'"); // replace double quotes wiht single quotes for rendering purposes
    console.log(eventtext);
    xapi.command("UserInterface Message Alert Display", {Text: eventtext, Duration: 5});
     
}

xapi.status.on('Audio Volume', (volume) => {
      xapi.command("UserInterface Extensions Widget SetValue", {WidgetId: 'volume', Value: Math.round((parseInt(volume)/100) * 255)});
});


xapi.status.on('Standby', (state) => {
            switch(state.State){
                case 'Standby':
                    xapi.command("UserInterface Extensions Widget SetValue", {WidgetId: 'systemstate', Value: 'standby'});
                    break;
                case 'Halfwake':
                    xapi.command("UserInterface Extensions Widget SetValue", {WidgetId: 'systemstate', Value: 'halfwake'});
                    break;
                case 'Off':
                    xapi.command("UserInterface Extensions Widget SetValue", {WidgetId: 'systemstate', Value: 'awake'});
                    break;
            }
});



xapi.event.on('UserInterface Extensions Widget Action', (event) => {
    if(event.WidgetId == 'selfview'){
        if(event.Type == 'pressed'){
            switch(event.Value){
                case 'off':
                    xapi.command("Video Selfview Set", {Mode: 'off'});
                    xapi.command("UserInterface Extensions Widget SetValue", {WidgetId: 'selfview', Value: 'off'});
                    break;
                case 'pip':
                    xapi.command("Video Selfview Set", {Mode: 'on', FullscreenMode: 'off'});
                    xapi.command("UserInterface Extensions Widget SetValue", {WidgetId: 'selfview', Value: 'pip'});
                    break;
                case 'fullscreen':
                    xapi.command("Video Selfview Set", {Mode: 'on', FullscreenMode: 'on'});
                    xapi.command("UserInterface Extensions Widget SetValue", {WidgetId: 'selfview', Value: 'fullscreen'});
                    break;
            }
        }
    }
    else if(event.WidgetId == 'systemstate'){
        if(event.Type == 'pressed'){
            switch(event.Value){
                case 'standby':
                    xapi.command("Standby Activate");
                    xapi.command("UserInterface Extensions Widget SetValue", {WidgetId: 'systemstate', Value: 'standby'});
                    break;
                case 'halfwake':
                    xapi.command("Standby Halfwake");
                    xapi.command("UserInterface Extensions Widget SetValue", {WidgetId: 'systemstate', Value: 'halfwake'});
                    break;
                case 'awake':
                    xapi.command("Standby Dectivate");
                    xapi.command("UserInterface Extensions Widget SetValue", {WidgetId: 'systemstate', Value: 'awake'});
                    break;
            }
        }
    }
    else if(event.WidgetId == 'diagnostics_onoff'){
        if(event.Type == 'changed'){
            switch(event.Value){
                case 'on':
                    xapi.command("Cameras SpeakerTrack Diagnostics Start");
                    xapi.command("UserInterface Extensions Widget SetValue", {WidgetId: 'diagnostics_onoff', Value: 'on'});
                    break;
                case 'off':
                    xapi.command("Cameras SpeakerTrack Diagnostics Stop");
                    xapi.command("UserInterface Extensions Widget SetValue", {WidgetId: 'diagnostics_onoff', Value: 'off'});
                    break;
            }
        }
    }
    else if(event.WidgetId == 'roompreset_er'){
        if(event.Type == 'pressed'){
            xapi.command("Audio Volume Set", {Level: 40});
            xapi.command("Standby Dectivate");
            showRoomSetupNotification('Room now ready for Experience Review Meeting');
        }
    }
    else if(event.WidgetId == 'roompreset_boardroom'){
        if(event.Type == 'pressed'){
            xapi.command("Audio Volume Set", {Level: 60});
            showRoomSetupNotification('Room now ready for Board Room Meeting');
        }
    }
    else if(event.WidgetId == 'roompreset_reset'){
        if(event.Type == 'pressed'){
            xapi.command("Audio Volume SetToDefault");
            showRoomSetupNotification('Room setting reset to defaults');
        }
    }
    else if(event.WidgetId == 'volume'){
        if(event.Type == 'changed'){
            xapi.command("Audio Volume Set", {Level: Math.round((parseInt(event.Value)/255) * 100)});
            console.log("Audio Volume Set to " + Math.round((parseInt(event.Value)/255) * 100));
        }
    }
});

import xapi from 'xapi';

// https://kwikwai.com/knowledge-base/the-hdmi-cec-bus/
const CEC_PLAYBACK_DEVICE_LOGICAL_ADR = 4;

const CONNECTOR_APPLE_TV = 2;

const signinsequence = [ 'Right','Right','Right','Right', 'Ok', 'Left', 'Left', 'Left','Ok'];


function sendCEC(key){
    var cecstring = 'Video CEC Input KeyClick ConnectorId: ' + CONNECTOR_APPLE_TV + ' LogicalAddress:' + CEC_PLAYBACK_DEVICE_LOGICAL_ADR + ' NamedKey: ' + key;
    xapi.command('Video CEC Input KeyClick', {ConnectorId: CONNECTOR_APPLE_TV, LogicalAddress:CEC_LOGICAL_ADDRESS_FOR_APPLETV, NamedKey: key});
     console.log(`CEC command sent:` + cecstring);
}

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

// Usage!


function sendCECSequence(params){
    let WAIT = 500;
    let offset = 0;
    console.log(`waiting:` + WAIT);

  for (var i=0; i<=params.length; i++) {
       sleep(offset+=WAIT).then(() => { sendCEC(params[i]);});
       console.log(`waited:` + WAIT);
   }
}

xapi.event.on('UserInterface Extensions Page Action', (event) => {
    if(event.PageId == 'AppleTV'){
        if(event.Type == 'Opened'){
         console.log(`AppleTV was opened`);
         xapi.command('Presentation Start', {ConnectorId: CODEC_CONNECTOR_ID_WHERE_APPLE_TV_IS_CONNECTED});
        }
        else{
         console.log(`AppleTV was closed`);
         xapi.command('Presentation Stop');
        }
    }
});


xapi.event.on('UserInterface Extensions Widget Action', (event) => {
    if(event.WidgetId == 'appletv_navigator'){
        if(event.Type == 'pressed'){
            switch(event.Value){
                case 'right':
                 sendCEC('Right');
                 break;
                case 'left':
                 sendCEC('Left');
                 break;
                case 'up':
                 sendCEC('Up');
                 break;
                case 'down':
                 sendCEC('Down');
                 break;
                case 'center':
                 sendCEC('Ok');
                 break;
                default:
                 console.log(`Unhandled Navigation`);
            }
        }
    }
    else if(event.WidgetId == 'appletv_menu'){
        if(event.Type == 'clicked'){
             sendCEC('Back');
        }
    }
    else if(event.WidgetId == 'appletv_play'){
        if(event.Type == 'clicked'){
             sendCEC('Play');
        }
    }
    else if(event.WidgetId == 'appletv_signin'){
        if(event.Type == 'clicked'){
            sendCECSequence.apply(this, signinsequence);
        }
    }

});

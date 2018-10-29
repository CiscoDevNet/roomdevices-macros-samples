const xapi = require('xapi');

const speedDialNumber = 'mynumber@mydomain.webex.com';
const cameraId = 3; // Set this to the camera id of camera you want to control. See "xStatus Cameras Camera"


// For this macro to work the configuration "xConfiguration Peripherals InputDevice Mode" needs to be set to "On". In CE9.5 this can only be set via web interface not on API.


xapi.event.on('UserInterface InputDevice Key Action', (event) => {
  if(event.Type == 'Pressed'){
    switch(event.Key){
        case 'KEY_BACK':
          xapi.command('Standby Activate');
          break;
        case 'KEY_HOME':
          xapi.command('Standby Deactivate');
          break;
        case  'KEY_PLAYPAUSE':
          xapi.command('Dial', {'Number': speedDialNumber});
          break;
        case 'KEY_STOP':
          xapi.command('Call Disconnect');
          break;
        case 'KEY_LEFT':
        case 'KEY_PAGEUP':
          xapi.command('Camera Ramp ', {'CameraId': cameraId, 'Pan':'Left'});
          break;
        case 'KEY_RIGHT':
        case 'KEY_PAGEDOWN':
          xapi.command('Camera Ramp ', {'CameraId': cameraId, 'Pan':'Right'});
          break;
        case 'KEY_UP':
         xapi.command('Camera Ramp ', {CameraId: cameraId, 'Tilt':'Up'});
          break;
        case 'KEY_DOWN':
          xapi.command('Camera Ramp ', {CameraId: cameraId, 'Tilt':'Down'});
          break;
        case 'KEY_ENTER':
          xapi.command('Camera PositionReset ', {CameraId: cameraId});
          break;
        case 'KEY_REWIND':
          xapi.command('Camera Ramp ', {CameraId: cameraId, 'Zoom':'Out'});
          break;
        case 'KEY_FASTFORWARD':
          xapi.command('Camera Ramp ', {CameraId: cameraId, 'Zoom':'In'});
          break;
        default:
          xapi.command('UserInterface Message Alert Display', {'Title': 'Remote Control Warning', 'Text':'This button is not in use yet. To program it use the "Key: ' + event.Key + ' (or Code: ' + event.Code + ')', 'Duration': 2});
          break;
    }  
  }
  else if(event.Type == 'Released'){
    switch(event.Key){
      case 'KEY_LEFT':
      case 'KEY_RIGHT':
      case 'KEY_PAGEUP':
      case 'KEY_PAGEDOWN':
        xapi.command('Camera Ramp ', {CameraId: cameraId, 'Pan':'Stop'});
        break;
      case 'KEY_UP':
      case 'KEY_DOWN':
        xapi.command('Camera Ramp ', {CameraId: cameraId, 'Tilt':'Stop'});
        break;
      case 'KEY_REWIND':
      case 'KEY_FASTFORWARD':
        xapi.command('Camera Ramp ', {CameraId: cameraId, 'Zoom':'Stop'});
        break;
    }    
  }
  
});


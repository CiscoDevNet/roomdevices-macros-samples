import xapi from 'xapi';

const CAMERAID_CAMERA_LEFT = 1;
const CAMERAID_CAMERA_RIGHT = 2;

const CAMERACONNECTORID_CAMERA_LEFT = 1;
const CAMERACONNECTORID_CAMERA_RIGHT = 2;

let camera1active = false;
let camera2active = false;


xapi.event.on('UserInterface Extensions Widget Action', (event) => {
  if (event.Type == 'clicked'){
        switch(event.WidgetId){
            case 'camera_left':
                xapi.command("Camera PositionSet", {CameraId: CAMERAID_CAMERA_LEFT,Tilt: '0',Pan: '0',Zoom: '8500'});
                xapi.command("Video Input SetMainVideoSource", {ConnectorId: CAMERACONNECTORID_CAMERA_LEFT});
                camera1active = true;
                camera2active = false;
                break;
            case 'camera_right':
                xapi.command("Camera PositionSet", {CameraId: CAMERAID_CAMERA_RIGHT,Tilt: '0',Pan: '0',Zoom: '8500'});
                xapi.command("Video Input SetMainVideoSource", {ConnectorId: CAMERACONNECTORID_CAMERA_RIGHT});
                camera1active = false;
                camera2active = true;
                break;
            case 'camera_wide':
                xapi.command("Camera PositionSet", {CameraId: CAMERAID_CAMERA_LEFT,Tilt: '260',Pan: '4320',Zoom: '8500'});
                xapi.command("Camera PositionSet", {CameraId: CAMERAID_CAMERA_RIGHT,Tilt: '400',Pan: '-3500',Zoom: '8500'});
                xapi.command("Video Input SetMainVideoSource", {ConnectorId: [CAMERACONNECTORID_CAMERA_LEFT, CAMERACONNECTORID_CAMERA_RIGHT]});
                camera1active = true;
                camera2active = true;
                break;
            default:
                break;
        }
  }
});



xapi.event.on('UserInterface Extensions Widget Action', (event) => {
    if(event.WidgetId == 'cameracontrol'){
        if(event.Type == 'pressed'){
            switch(event.Value){
                case 'right':
                    if(camera1active && camera2active){
                        //noop
                    }
                    else{
                        camera1active && xapi.command("Camera Ramp", {CameraId: CAMERAID_CAMERA_LEFT,  Pan: 'Right'});
                        camera2active && xapi.command("Camera Ramp", {CameraId: CAMERAID_CAMERA_RIGHT, Pan: 'Right'});
                    }
                 break;
                case 'left':
                    if(camera1active && camera2active){
                        //noop
                    }
                    else{
                        camera1active && xapi.command("Camera Ramp", {CameraId: CAMERAID_CAMERA_LEFT,  Pan: 'Left'});
                        camera2active && xapi.command("Camera Ramp", {CameraId: CAMERAID_CAMERA_RIGHT, Pan: 'Left'});
                    }
                 break;
                case 'up':
                     camera1active && xapi.command("Camera Ramp", {CameraId: CAMERAID_CAMERA_LEFT,  Tilt: 'Up'});
                     camera2active && xapi.command("Camera Ramp", {CameraId: CAMERAID_CAMERA_RIGHT, Tilt: 'Up'});
                 break;
                case 'down':
                     camera1active && xapi.command("Camera Ramp", {CameraId: CAMERAID_CAMERA_LEFT,  Tilt: 'Down'});
                     camera2active && xapi.command("Camera Ramp", {CameraId: CAMERAID_CAMERA_RIGHT, Tilt: 'Down'});
                 break;
                case 'center':
                    xapi.command("Camera PositionReset", {CameraId: CAMERAID_CAMERA_LEFT});
                 break;
                default:
                 console.log(`Unhandled Navigation`);
            }
        }
        else if(event.Type == 'released'){
                camera1active && xapi.command("Camera Ramp", {CameraId: CAMERAID_CAMERA_LEFT, Tilt: 'Stop',Pan: 'Stop'});
                camera2active && xapi.command("Camera Ramp", {CameraId: CAMERAID_CAMERA_RIGHT,Tilt: 'Stop',Pan: 'Stop'});
        }
    }

});

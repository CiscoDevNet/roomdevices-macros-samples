const xapi = require('xapi');

let camera1active = false;
let camera2active = false;


xapi.event.on('UserInterface Extensions Widget Action', (event) => {
  if (event.Type == 'clicked'){
        switch(event.WidgetId){
            case 'camera_left':
                xapi.command("Camera PositionSet", {CameraId: '1',Tilt: '0',Pan: '0',Zoom: '8500'});
                xapi.command("Video Input ComposedMainSource Delete");
                xapi.command("Video Input SetMainVideoSource", {ConnectorId: '1'});
                camera1active = true;
                camera2active = false;
                break;
            case 'camera_right':
                xapi.command("Camera PositionSet", {CameraId: '2',Tilt: '0',Pan: '0',Zoom: '8500'});
                xapi.command("Video Input ComposedMainSource Delete");
                xapi.command("Video Input SetMainVideoSource", {ConnectorId: '3'});
                camera1active = false;
                camera2active = true;
                break;
            case 'camera_wide':
                xapi.command("Camera PositionSet", {CameraId: '1',Tilt: '260',Pan: '4320',Zoom: '8500'});
                xapi.command("Camera PositionSet", {CameraId: '2',Tilt: '400',Pan: '-3500',Zoom: '8500'});
                xapi.command("Video Input ComposedMainSource Delete");
                xapi.command("Video Input ComposedMainSource Add", {ConnectorId: '1'});
                xapi.command("Video Input ComposedMainSource Add", {ConnectorId: '3'});
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
                        camera1active && xapi.command("Camera Ramp", {CameraId: '1',Pan: 'Right'});
                        camera2active && xapi.command("Camera Ramp", {CameraId: '2',Pan: 'Right'});
                    }
                 break;
                case 'left':
                    if(camera1active && camera2active){
                        //noop
                    }
                    else{
                        camera1active && xapi.command("Camera Ramp", {CameraId: '1',Pan: 'Left'});
                        camera2active && xapi.command("Camera Ramp", {CameraId: '2',Pan: 'Left'});
                    }
                 break;
                case 'up':
                     camera1active && xapi.command("Camera Ramp", {CameraId: '1',Tilt: 'Up'});
                     camera2active && xapi.command("Camera Ramp", {CameraId: '2',Tilt: 'Up'});
                 break;
                case 'down':
                     camera1active && xapi.command("Camera Ramp", {CameraId: '1',Tilt: 'Down'});
                     camera2active && xapi.command("Camera Ramp", {CameraId: '2',Tilt: 'Down'});
                 break;
                case 'center':
                    xapi.command("Camera PositionReset", {CameraId: '1'});
                 break;
                default:
                 console.log(`Unhandled Navigation`);
            }
        }
        else if(event.Type == 'released'){
                camera1active && xapi.command("Camera Ramp", {CameraId: '1',Tilt: 'Stop',Pan: 'Stop'});
                camera2active && xapi.command("Camera Ramp", {CameraId: '2',Tilt: 'Stop',Pan: 'Stop'});
        }
    }

});

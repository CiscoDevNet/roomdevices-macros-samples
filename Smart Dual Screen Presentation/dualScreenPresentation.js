const xapi = require('xapi');

const MONITOR_ROLES = {AUTO: 'Auto',
                       FIRST: 'First',
                       SECOND: 'Second',
                       THIRD: 'Third',
                       PRESENTATIONONLY: 'PresentationOnly',
                       RECORDER: 'Recorder'
};

// Tune output connector and role states to match your deployment
const NORMAL_ROLE = MONITOR_ROLES.AUTO;
const OVERRIDE_ROLE = MONITOR_ROLES.PRESENTATIONONLY;
const OUTPUT_CONNECTOR = 1;


function log(message) {
    console.log(logcounter + ": " + message);
    logcounter += 1;
}

async function getVideoCallState() {
  let rxVideo = false;
  if (await (xapi.status.get('Call'))) {
    await (xapi.status.get('MediaChannels Call')).then(media => {
      let index, channel = null;
      for (index = 0; index < media[0].Channel.length; index++) {
        channel = media[0].Channel[index];
        if (channel.Direction == 'Incoming' && 
            channel.Type == 'Video' && 
            channel.Video.ChannelRole == 'Main' &&
            channel.Video.Protocol != 'Off') {
          rxVideo = true;
        }
      }
    });
  }
  return rxVideo; 
}

function setMonitorRole(role) {
    xapi.config.set('Video Output Connector ' + OUTPUT_CONNECTOR + ' MonitorRole', role)
    .catch((error) => {console.error(error);});
}

async function checkPresoState(statusEvent) {
    logcounter = 1;
    log('*** execution starting');
    if (statusEvent.hasOwnProperty('LocalInstance')) {
        log('local share state change');
        let localPreso = statusEvent.LocalInstance[0];

        if (localPreso.ghost) {
            log('local share was stopped, set normal monitor');
            setMonitorRole(NORMAL_ROLE);
        }
        else if (localPreso.SendingMode) {
            log('local share was started');

            if (await (getVideoCallState())) {
                log('in a video call, do nothing');
            }
            else {
                log('not in a video call, override monitor');
                setMonitorRole(OVERRIDE_ROLE);
            } 
        }
    }

    else {
        log('not a local share state change');
    }

    log('*** execution finished');
}

var logcounter = null;
// Fire when local presentation status changes
xapi.status.on('Conference Presentation', checkPresoState);
const xapi = require('xapi');

// Tune message duration (in seconds) and notice to match your deployment needs
const DURATION = 6;
const MESSAGE = "System is being remotely monitored by an administrator";

function remoteMonitorAlert() {
    console.log('Remote monitoring detected, displaying alert');
    // Displays Alert on both Touch and OSD
    xapi.command('UserInterface Message Alert Display', {Duration: DURATION, Text:MESSAGE})
    
    // Displays Text on OSD only
    // xapi.command('UserInterface Message TextLine Display', {x:1, y:1,
    //                                                        Duration: DURATION, Text:MESSAGE})
}

xapi.event.on('VideoSnapshotTaken', remoteMonitorAlert);
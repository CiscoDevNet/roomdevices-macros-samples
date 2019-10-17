const xapi = require('xapi');

// Tune notice to match your deployment needs
const MESSAGE = "System is being remotely monitored by an administrator";

// To prevent realerts, this interval needs to be longer by some seconds than trigger fires when
// continuous snapshot refresh is enabled.  May vary by codec, browser and software.
// Also impacts how long message remains up after monitoring is stopped.
const CHECK_INTERVAL = 15;

// // Gloabl state flags
var alertOn = false
var snapshotTrigger = false

function remoteMonitorTriggered() {
  // Log and store snapshot event state
  console.log('Snapshot event triggered');
  snapshotTrigger = true;
  // Only set Alert if not already set
  if(!alertOn){
    xapi.command('UserInterface Message Alert Display', {Text:MESSAGE});
    alertOn = true;
  }
}

setInterval(function(){
  // If snapshots have discontinued since last interval, clear alert
  if(!snapshotTrigger && alertOn){
    xapi.command('UserInterface Message Alert Clear');
    alertOn = false;
  }
  // Reset state until next check, continuous monitoring will retrip flag when enabled
  else if(snapshotTrigger){
    snapshotTrigger = false;
  }
}, CHECK_INTERVAL * 1000);
  
xapi.event.on('VideoSnapshotTaken', remoteMonitorTriggered);

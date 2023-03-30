/**
 * Limit the volume of a video system to a user definede level < 100.
 * Show a message if this happens
 */
import xapi from 'xapi';

const MAX_VOLUME = 70;

function setVolume(vol) {
  xapi.command('Audio Volume Set', { Level: vol });
}

function alert(title, text, duration = 5) {
  xapi.command('UserInterface Message Alert Display', {
    Title: title,
    Text: text,
    Duration: duration,
  });
}

function limitVolume(volume) {
  if (volume > MAX_VOLUME) {
    setVolume(MAX_VOLUME);
    alert('Volume restricted', 'Max volume on this video system is restriced by a script');
  }
}

function checkInitialVolume() {
  xapi.status
  .get('Audio Volume')
  .then((volume) => { limitVolume(volume); })
  .catch((error) => { console.error(error); });
}

function init() {
  xapi.status.on('Audio Volume', (volume) => {
    console.log(`Volume changed to: ${volume}`);
    limitVolume(volume);
  });
  checkInitialVolume();
}

init();

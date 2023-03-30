import xapi from 'xapi';
import Hue from './hue-lib';

const hue = new Hue();

const lightId = 6; // hue id for light to indicate in-call state
const blinks = 6;

function incomingCall() {
  let i = 0;
  function blink() {
    if (i < blinks) {
      hue.blink(lightId);
      setTimeout(blink, 1000);
    }
    i++;
  }

  blink();
}

hue.loadConfig();
xapi.Event.IncomingCallIndication.on(incomingCall);

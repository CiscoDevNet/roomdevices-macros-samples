const xapi = require('xapi');
const Hue = require('../hue-lib');

const hue = new Hue();

const inCallLamp = 6; // hue id for light to indicate in-call state

async function callStateChanged() {
  const calls = await xapi.Status.SystemUnit.State.NumberOfActiveCalls.get();
  if (calls > 0) {
    const state = hue.Colors.red;
    state.on = true;
    hue.setLightState(inCallLamp, state);
  }
  else {
    hue.setLightState(inCallLamp, hue.Colors.white);
  }
}

hue.loadConfig();
xapi.Status.SystemUnit.State.NumberOfActiveCalls.on(callStateChanged);
callStateChanged();

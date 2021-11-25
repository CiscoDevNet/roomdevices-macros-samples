const xapi = require('xapi');
const Hue = require('../hue-lib');

const hue = new Hue();

const presenceLamp = 6; // hue id for lamp to indicate people presence


// requires xConfiguration RoomAnalytics PeoplePresenceDetector to be on
async function presenceChanged() {
  const present = await xapi.Status.RoomAnalytics.PeoplePresence.get();
  console.log('present', present);
  if (present === 'Unknown') return;
  else {
    const color = present === 'Yes' ? hue.Colors.red : hue.Colors.green;
    hue.setLightState(presenceLamp, Object.assign({ on: true }, color));
  }
}

hue.loadConfig();
xapi.Status.RoomAnalytics.PeoplePresence.on(presenceChanged);
presenceChanged();

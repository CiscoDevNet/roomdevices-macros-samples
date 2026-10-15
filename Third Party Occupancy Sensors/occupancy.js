// occupancy-sync.js
import xapi from 'xapi';

const CONFIG = {
  haHost: 'xx.xx.xx.xx',
  haPort: 8123,
  token: '',
  entityId: 'binary_sensor.aqara_presence_sensor_fp1e_occupancy',
  sensorId: 'fp1e-main',
  pollIntervalMs: 1000,
  clearGraceMs: 2000,
  durationSec: 300,
};

let roomState = 'NotInUse';
let clearSince = null;

function buildUrl() {
  return `https://${CONFIG.haHost}:${CONFIG.haPort}/api/states/${CONFIG.entityId}`;
}

async function getOccupancy() {
  const response = await xapi.Command.HttpClient.Get({
    Url: buildUrl(),
    Header: [`Authorization: Bearer ${CONFIG.token}`],
    AllowInsecureHTTPS: 'True',
    Timeout: 5,
  });

  const body = JSON.parse(response.Body);
  return body.state === 'on';
}

async function setRoomInUse(state) {
  await xapi.Command.RoomAnalytics.RoomInUse.Set(
    state === 'InUse'
      ? {
          ID: CONFIG.sensorId,
          State: 'InUse',
          Duration: CONFIG.durationSec,
        }
      : {
          ID: CONFIG.sensorId,
          State: 'NotInUse',
        }
  );
}

async function loop() {
  try {
    const occupied = await getOccupancy();
    const now = Date.now();

    if (occupied) {
      clearSince = null;

      if (roomState !== 'InUse') {
        console.log('Occupied -> InUse');
        await setRoomInUse('InUse');
        roomState = 'InUse';
      }

      return;
    }

    if (!clearSince) {
      clearSince = now;
    }

    if (now - clearSince >= CONFIG.clearGraceMs) {
      if (roomState !== 'NotInUse') {
        console.log('Clear -> NotInUse');
        await setRoomInUse('NotInUse');
        roomState = 'NotInUse';
      }
    }
  } catch (error) {
    console.log(`Error: ${JSON.stringify(error)}`);
  }
}

console.log('Starting occupancy sync service...');
setInterval(loop, CONFIG.pollIntervalMs);
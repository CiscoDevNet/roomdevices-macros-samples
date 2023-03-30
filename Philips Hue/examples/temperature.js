import xapi from 'xapi';
import Hue from './hue-lib';

const hue = new Hue();

const temperaturePlug = 6; // hue id for device to toggle fan
const temperatureThreshold = 21.5;

async function pollTemperature() {
  try {
    const temp = await xapi.Status.RoomAnalytics.AmbientTemperature.get()
    const tooWarm = temp > temperatureThreshold;
    console.log(temp);
    hue.setLightState(temperaturePlug, { on: tooWarm });
  }
  catch(e) {} // not all devices support it
}

hue.loadConfig();
setInterval(pollTemperature, 1000 * 5);

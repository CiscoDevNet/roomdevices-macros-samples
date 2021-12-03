
const xapi = require('xapi');

function fetch(url, type, body) {
  const data = body ? JSON.stringify(body) : undefined;
  const options = {
    'Url': url,
    'ResultBody': 'PlainText',
    'AllowInsecureHttps': true,
    'Header': 'Content-Type: application/json',
    'Timeout': 15,
  };
  // console.log('fetch', type, url);
  return xapi.command('HttpClient ' + type, options, data);
}

const myColors = {
  red: { hue: 65384, sat: 254 },
  green: { hue: 19000, sat: 200 },
  blue: { hue: 45304, sat: 254 },
  yellow: { hue: 9196, sat: 254 },
  white: { hue: 41346, sat: 86 }
};

class Hue {

  constructor() {
    this.Colors = myColors;
  }

  setConfig(bridgeIp, token) {
    this.ip = bridgeIp;
    this.token = token;
  }

  async discoverBridge() {
    const url = 'https://discovery.meethue.com';
    const result = await fetch(url, 'Get');
    const body = JSON.parse(result['Body']);
    this.ip = body[0].internalipaddress;
    console.log(`Bridge found: ${this.ip}`);
    return this.ip;
  }

  isConfigured() {
    return !!(this.ip && this.token);
  }

  async isConnected() {
    if (!this.isConfigured()) return false;
    try {
      await this.getLightState();
      return true;
    }
    catch (e) {
      return false;
    }
  }

  async createToken() {
    const data = { devicetype : 'CiscoWebexDevice' };
    const url = `https://${this.ip}/api`;
    const result = await fetch(url, 'Post', data);
    const body = JSON.parse(result.Body);
    const error = body[0].error;
    if (error) {
      throw new Error(error.description);
    }
    this.token = body[0].success.username;
    return this.token;
  }

  async getLightState() {
    const url = `https://${this.ip}/api/${this.token}/lights/`;
    const result = await fetch(url, 'Get');
    return JSON.parse(result['Body']);
  }

  async getGroupState() {
    const url = `https://${this.ip}/api/${this.token}/groups/`;
    const result = await fetch(url, 'Get');
    return JSON.parse(result['Body']);

  }

  // id: devices on the hue bridge are integers from 0 and up
  // State {
  //  on [bool],  power
  //  bri [0-254],  brightness
  //  ct ((intval * 347) / 255) + 153; color temp
  //  hue (intval * 65535) / 255 // color
  //  sat [0-255] // saturation
  // }
  setLightState(id, state) {
    const isGroup = id.startsWith('g');
    id = id.replace('g', '');

    const path = isGroup ? `groups/${id}/action` : `lights/${id}/state`;
    const url = `https://${this.ip}/api/${this.token}/${path}`;
    return fetch(url, 'Put', state);
  }


  setLightPower(lightId, on) {
    return this.setLightState(lightId, { on });
  }

  blink(lightId) {
    return this.setLightState(lightId, { alert: 'select' });
  }

  getType(state) {
    const { type } = state;
    if (type === "Color temperature light") {
      return 'color-temperature';
    }
    if (type === "Extended color light") {
      return 'color';
    }
    if (type === "Dimmable light") {
      return 'brightness';
    }
    if (type === 'Room') {
      return 'color'; // TODO look at individual lights
    }
    return 'power';
  }

  saveConfig() {
    const prefs = { ip: this.ip, token: this.token };
    let json = JSON.stringify(prefs).replace(/"/g, '§'); // xapi doesnt like "
    return xapi.Config.FacilityService.Service[4].Name.set(json);
  }

  async loadConfig() {
    const json = await xapi.Config.FacilityService.Service[4].Name.get();
    try {
      const config = JSON.parse(json.replace(/§/g, '"'));
      this.ip = config.ip;
      this.token = config.token;
      const lights = await this.getLightState();
      for (const id in lights) {
        console.log(`Light #${id}: ${lights[id].name} (${lights[id].type})`);
      }
    }
    catch(e) {
      return {};
    }
  }
}

module.exports = Hue;

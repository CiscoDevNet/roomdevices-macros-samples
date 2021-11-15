
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
  return xapi.command('HttpClient ' + type, options, data);
}

class Hue {

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

  async createToken() {
    const data = { devicetype : 'CiscoWebexDevice' };
    const url = `https://${this.ip}/api`;
    const result = await fetch(url, 'Post', data);
    console.log('create user', result);
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

  // id: devices on the hue bridge are integers from 0 and up
  // State {
  //  on [bool],  power
  //  bri [0-254],  brightness
  //  ct ((intval * 347) / 255) + 153; color temp
  //  hue (intval * 65535) / 255 // color
  //  sat [0-255] // saturation
  // }
  setLightState(lightId, state) {
    const url = `https://${this.ip}/api/${this.token}/lights/${lightId}/state`;
    console.log(`PUTting to ${url}`, JSON.stringify(state));
    return fetch(url, 'Put', state);
  }

  setLightPower(lightId, on) {
    return this.blink(lightId);
    return this.setLightState(lightId, { on });
  }

  blink(lightId) {
    this.setLightState(lightId, { alert: 'select' });
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
    }
    catch(e) {
      return {};
    }
  }
}

module.exports = Hue;

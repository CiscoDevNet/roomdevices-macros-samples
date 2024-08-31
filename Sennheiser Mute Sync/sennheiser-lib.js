/**
 * HTTP API Driver for Sennheiser ceiling mic
 * 
 * Remember to enable third party api access and set username / password in the Sennheiser TCCM app
 * Usage:
 * 
 * import Sennheiser from './sennheiser-lib'
 * 
 * const mic = new Sennheiser('10.192.12.35', 'admin', 'mypassword')
 * 
 * mic.setLed(on)
 *  .catch(e => console.warn(e))
 * 
 * mic.setBrightness(55)
 *  .catch(e => console.warn(e))
 */

import xapi from 'xapi'

const LED_API_PATH = '/api/device/leds/ring'

function http(url, username, password, body) {
  const token = btoa(`${username}:${password}`)
  const auth = `Authorization: Basic ${token}`
  const type = 'Content-Type: application/json'
  const options = {
    AllowInsecureHTTPS: true,
    Url: url,
    Header: [type, auth],
    ResultBody: 'PlainText'
  }

  if (!body) {
    return xapi.Command.HttpClient.Get(options)
  }
  return xapi.Command.HttpClient.Put(options, JSON.stringify(body))
}

class Driver {

  constructor(ip, username, password) {
    this.ip = ip
    this.username = username
    this.password = password
  }

  setLed(muted) {
    const url = 'https://' + this.ip + LED_API_PATH
    const body = { micOn: { color: muted ? 'Red' : 'Green' } }

    return http(url, this.username, this.password, body)
  }

  getStatus() {
    const url = 'https://' + this.ip + LED_API_PATH
    return http(url, this.username, this.password)
  }

  setBrightness(brightness) {
    const bri = Number(brightness)
    if (bri < 0 || bri > 5) {
      throw new Error('Brightness should be btw 0 and 5')
    }
    const url = 'https://' + this.ip + LED_API_PATH
    const body = { brightness: bri }

    return http(url, this.username, this.password, body)
  }
}

export default Driver


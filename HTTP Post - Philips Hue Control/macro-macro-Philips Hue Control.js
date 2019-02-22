const xapi = require('xapi');

const hue_UserId = 'vNZSROIb1zWVk2OF4JEPtuAOnKo4Zd5ge4Spd7Vu'; /* Philips Hue username */
const hue_brige_address = '10.0.0.41'; /* IP of hue bridge. If bridge is connected directly to one of the network ports of a codec this will be 169.254.1.30 */
const HUE_API_REST_HEADER = 'Content-Type: application/json';

const HTTP_TIMEOUT = 1; /* How fast (in seconds) the HTTP rest commands should fail with timeout error. */

const LIGHTINTENSITY_OFF = 0;
const LIGHTINTENSITY_FULL = 254;
const LIGHTINTENSITY_PRESENTER = 220;
const LIGHTINTENSITY_AUDIENCE = 10;
const LIGHTINTENSITY_LOCALMEETING = 100;
const LIGHTINTENSITY_HALFWAKE = 50;

const COLOR_RED = 0;
const COLOR_YELLOW = 8000;
const COLOR_GREEN = 21845;
const COLOR_BLUE = 43690;

const SATURATION_FULL = 199;
const SATURATION_RELAXED = 140;

const delay = (amount) => {
  return new Promise((resolve) => {
    setTimeout(resolve, amount);
  });
}

const LIGHTS = {
  strips : {
     'dx80' : 11
  }
};


function _hue_put(lightid, data) {
  var url = 'http://' + hue_brige_address + '/api/' + hue_UserId + '/lights/' + lightid + '/state';
  return xapi.command('HttpClient Put', {
    'Url': url,
    'Header': HUE_API_REST_HEADER,
    'Timeout': HTTP_TIMEOUT },
    JSON.stringify(data)
  ).catch(e => console.error('Command error'));
}

async function allLights(data) {
  const lights = LIGHTS.strips;
  for (const light in lights) {
    const id = lights[light];
    await _hue_put(id, data)
    await delay(100);
  }
}

async function lights(ids, data) {
  for (const id of ids) {
    await _hue_put(id, data);
    await delay(100);
  }
}

function set_mode_halfwake(){
  return allLights({on: true, hue: COLOR_YELLOW, bri: LIGHTINTENSITY_HALFWAKE});
}

function set_mode_localmeeting(){
  return allLights({on: true, hue: COLOR_YELLOW, sat:SATURATION_RELAXED , bri: LIGHTINTENSITY_LOCALMEETING, xy:'[0.5016,0.4151]'});
}

function set_mode_wash(){
  return allLights({on: true, hue: COLOR_YELLOW,  sat:SATURATION_FULL , bri: LIGHTINTENSITY_FULL, xy:'[0.3127,0.329]'});
}

function set_mode_off(){
  return allLights({on: false});
}

function set_signage_color(color){
  lights([
    LIGHTS.strips.dx80
  ], { on: true, hue: color, sat: 254 });
}



function init(){
  xapi.config.set('HttpClient Mode', 'On'); //this needs to be set to on to allow HTTP Post

  /* Event listeners for manual light controls from the touch 10 demo panel */
  xapi.event.on('UserInterface Extensions Widget Action', (event) => {
    if (event.Type === 'clicked') {
      switch(event.WidgetId){
        case 'hue_color_red':
          set_signage_color(COLOR_RED);
          break;
        case 'hue_color_green':
          set_signage_color(COLOR_GREEN);
          break;
        case 'hue_color_blue':
          set_signage_color(COLOR_BLUE);
          break;
        case 'hue_color_yellow':
          set_signage_color(COLOR_YELLOW);
          break;
        case 'hue_preset_dimmed':
          set_mode_halfwake();
          break;
        case 'hue_preset_meeting':
          set_mode_localmeeting();
          break;
        case 'hue_preset_wash':
          set_mode_wash();
          break;
        case 'hue_preset_off':
              allLights({ on: false })
          break;
      }
    }
  });
}

/* Some examples on how the lights can automatically change based on the codec states: */
xapi.event.on('CallDisconnect', (event) => {
  set_signage_color(COLOR_GREEN);
});

xapi.status.on('Call RemoteNumber', (remoteNumber) => {
  set_signage_color(COLOR_RED);
});


xapi.status.on('Standby State', (state) => {
  if(state === 'Standby'){
    set_signage_color(COLOR_GREEN);

  } else if(state === 'Halfwake'){
    set_signage_color(COLOR_GREEN);

  } else if(state === 'Off'){
    set_signage_color(COLOR_YELLOW);
  } 
});


init();

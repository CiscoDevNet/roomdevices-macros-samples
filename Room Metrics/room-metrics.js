/**
Please contact @author German Cheung <gecheung@cisco.com> for any questions. Thanks.

Updates:
2022-02-06: version 0.9.220206
- First release

Acknowledgement:
Memory Functions by Zacharie Gignac & Robert McGonigle
*/

import xapi from 'xapi';

const MACRO_VERSION       = '0.9.220206-9';
const SCRIPT_NAME         = 'room-metrics';

const B_SHOW_WELCOME                = true;
const B_SEND_FEEDBACK_RESET_METRICS = true;
const ROOM_CLEANED_PIN              = '0000';
const SHOW_WELCOME_THRESHOLD        = 15 * 60;

const HTTP_URL          = '';
const HTTP_HEADER       = ['Content-Type: application/json'];
const WORKFLOW_ID       = '';

const TIMER_REFRESH_METRICS  = 5 * 60 * 1000;
const TIME_RESET_METRICS_AT  = 0;

const PANEL_ROOM_METRICS     = 'panel-bve_room_metrics';
const PAGE_ROOM_METRICS      = 'page-room_metrics';

const ACTION_RESET_METRICS   = 'reset_metrics';

const ROOM_WELCOME_TITLE     = 'Welcome to Cisco';
const ROOM_WELCOME_TEXT      = '';
const ROOM_WELCOME_DURATION  = 30;

const ROOM_METRICS_TITLE     = 'Room Metrics';
const RESET_METRICS_TEXT     = 'Please enter Pin to reset metrics';
const RESET_METRICS_SUCCESS_TEXT = 'Room Metrics is reset.';
const RESET_METRICS_SUCCESS_DURATION = 15;

const PIN_INCORRECT_TITLE    = 'Incorrect Pin';
const PIN_FORGET             = 'Forget Pin? Please contact administrator.';
const PIN_INCORRECT_DURATION = 15;

const AMBIENT_NOISE = {
  'very_high'       : {'value': 50, 'name': 'Poor'},
  'medium'          : {'value': 40, 'name': 'Acceptable'},
  'very_low'        : {'value': 0, 'name': 'Excellent'},
}

const ROOM_USAGE = {
  'very_high'       : {'value': 7*60*60, 'name': 'Very High'}, // if meeting > 7 hr, utilize is very high
  'high'            : {'value': 5*60*60, 'name': 'High'},
  'medium'          : {'value': 3*60*60, 'name': 'Medium'},
  'low'             : {'value': 1*60*60, 'name': 'Low'},
  'very_low'        : {'value': 0, 'name': 'Very Low'},
}

const AIR_QUALITY = {
  'very_high'       : {'value': 5.0, 'name': 'Bad - Unacceptable Conditions'},
  'high'            : {'value': 4.0, 'name': 'Poor - Significant Comfort Issues'},
  'medium'          : {'value': 3.0, 'name': 'Medium - Noticeable Comfort Concerns'},
  'low'             : {'value': 2.0, 'name': 'Good - Good Air Quality'},
  'very_low'        : {'value': 0, 'name': 'Excellent - Clean Hygienic Air'},
}

const widgetIds = {
  'panel_room_metrics'   : PANEL_ROOM_METRICS,
  'metric_date'          : 'text-metric_date',
  'metric_occupy'        : 'text-metric_occupy',
  'metric_meet'          : 'text-metric_meet',
  'metric_noise'         : 'text-metric_noise',
  'metric_temperature'   : 'text-metric_temperature',
  'metric_humidity'      : 'text-metric_humidity',
  'metric_air'           : 'text-metric_air',

  'room_clean_pin'       : 'feedback-room_clean_pin',
  'reset_usage'          : 'button-reset_usage'
}

let http_payload = {
  'workflow_id'   : WORKFLOW_ID,
  'payload'       : {
    'timestamp'          : 0,
    'macro_version'      : MACRO_VERSION,
    'mac'                : '',
    'name'               : '',
    'model'              : '',
    'serial_number'      : '',
    'sip_uri'            : '',
    'room_capacity'      : '',
  }
}

let device_status = {
  'sensor_enabled'       : 0,
  'engage_enabled'       : 0,
  'room_capacity'        : 0,
  'last_panel_opened'    : '',
  'last_ts_http_send'    : 0,
  'b_has_camera_lid'     : false,
  'b_show_welcome'       : B_SHOW_WELCOME,
  'b_send_fb_reset_metric' : B_SEND_FEEDBACK_RESET_METRICS,
  'h_refresh_metrics'    : '',
}

const DEVICE_DATA = 'device_data';
const DEVICE_DATA_C = {
  'version'           : '1.0',
  'n_meet'            : 0,
  't_meet'            : 0,
  't_occupy'          : 0,
  'ts_call_start'     : 0,
  'ts_occupy_start'   : 0,
  'ts_people_count'   : 0,
  'last_people_count' : 0,
}
let device_data = JSON.parse(JSON.stringify(DEVICE_DATA_C));

/* ****
*/
async function sendFeedback(action='', data='') {
  handleLog('sendFeedback', `action=${action}`);
  if(!HTTP_URL)   return;

  const mac = await xapi.status.get('Network Ethernet MacAddress').catch(e => {return ''});
  const name = await xapi.status.get('UserInterface ContactInfo Name').catch(e => {return ''});
  const sip_url = await xapi.status.get('UserInterface ContactInfo ContactMethod 1 Number').catch(e => {return ''});
  const serial_number = await xapi.status.get('SystemUnit Hardware Module SerialNumber').catch(e => {return ''});
  const model = await xapi.status.get('SystemUnit ProductId').catch(e => {return ''});

  let payload = JSON.parse(JSON.stringify(http_payload));
  payload.payload.timestamp       = await getTimeNow();
  payload.payload.mac             = mac;
  payload.payload.name            = name;
  payload.payload.model           = model;
  payload.payload.serial_number   = serial_number;
  payload.payload.sip_url         = sip_url;

  payload.payload.action          = action;
  payload.payload.room_capacity   = device_status.room_capacity;
  payload.payload.device_data     = data;

  handleDebug('sendFeedback', `payload`, payload);
  await postHttpClient(HTTP_URL, HTTP_HEADER, JSON.stringify(payload));
}

async function cbCallConnected(status) {
  handleLog('cbCallConnected', `status=${status}`);
  if(status === 'Connected') {
    device_data.n_meet += 1;
    device_data.ts_call_start = await getTimeNow();
    await saveData();
  }
}

async function cbCallDisconnected(event) {
  handleLog('cbCallDisconnected', event);
  device_data.t_meet += parseInt(event.Duration);
  device_data.ts_call_start = 0;
  await saveData();
}

async function cbPeopleChange(cb_name, value) {
  const camera_lid = await xapi.status.get('SystemUnit State CameraLid').catch(e => {return ''});
  const people_presence = await xapi.status.get('RoomAnalytics PeoplePresence').catch(e => {return ''});

  let time_now = await getTimeNow();
  let b_welcome = false;

  if(cb_name == C.ROOM_CAPACITY) {
    device_status.room_capacity = value;
  }
  else if(cb_name == C.PEOPLE_COUNT) {
    value = parseInt(value);
    if(device_data.last_people_count <= 0 && value > 0) {
      device_data.last_people_count = value;
      if(!device_data.ts_occupy_start)    device_data.ts_occupy_start = time_now;

      if(!device_data.ts_people_count || (time_now - device_data.ts_people_count) > SHOW_WELCOME_THRESHOLD)
        b_welcome = true;

      device_data.ts_people_count = time_now;

      if(device_status.b_show_welcome && b_welcome) {
        let t_occupy = device_data.t_occupy;
        t_occupy += (time_now - device_data.ts_occupy_start);
        t_occupy = `${convertToUsage(t_occupy, ROOM_USAGE)} (${convertSecondToHour(t_occupy, 2)} hr)`;

        let t_temp = ((!!device_status.AmbientTemperature) ? `${device_status.AmbientTemperature}°C | ${convertCelsiusToFahrenheit(device_status.AmbientTemperature)}°F` : '');
        let t_humid = ((!!device_status.RelativeHumidity) ? `${device_status.RelativeHumidity}%` : '');
        let t_air = ((!!device_status.AirQuality) ? `${convertToUsage(device_status.AirQuality, AIR_QUALITY)} (${parseFloat(device_status.AirQuality).toFixed(1)})` : '');

        let t_welcome = `Today Room Utilized: ${t_occupy}`;
        if(t_temp)  t_welcome += `<br>Ambient Temperature: ${t_temp}`;
        if(t_humid) t_welcome += `<br>Ambient Humidity: ${t_humid}`;
        if(t_air)   t_welcome += `<br>Air Quality: ${t_air}`;

        displayAlertMessage({
          Title     : ROOM_WELCOME_TITLE,
          Text      : t_welcome,
          Duration  : ROOM_WELCOME_DURATION
        });
      }

      await saveData();
    }
    else if(device_data.last_people_count > 0 && value <= 0) {
      device_data.ts_people_count = time_now;
      device_data.last_people_count = value;

      if(device_data.ts_occupy_start) {
        device_data.t_occupy += time_now - device_data.ts_occupy_start;
        device_data.ts_occupy_start = time_now;
      }

      await saveData();
    }
  }
  else if(cb_name == C.PEOPLE_PRESENCE) {
    if(camera_lid == C.CLOSED) {
      if(value == C.YES) {
        device_data.ts_occupy_start = await getTimeNow();
      }
      else if(device_data.ts_occupy_start) {
        let ts_add = time_now - device_data.ts_occupy_start;
        device_data.t_occupy += ((ts_add > C.PEOPLE_PRESENCE_OFFSET) ? (ts_add - C.PEOPLE_PRESENCE_OFFSET) : ts_add);
        device_data.ts_occupy_start = 0;
        await saveData();
      }
    }
    else if(value == C.NO) {
      device_data.ts_people_count = 0;
      await saveData();
    }
  }

  handleLog('cbPeopleChange', `time_now=${time_now}, b_welcome=${b_welcome}, cb_name=${cb_name}, value=${value}, camera_lid=${camera_lid}, people_presence=${people_presence}`, `device_status`, device_status, `device_data`, device_data);
}

async function cbResetMatric() {
  await xcommand('UserInterface Extensions Panel Open', {PanelId: PANEL_ROOM_METRICS, PageId: PAGE_ROOM_METRICS});
  await xcommand('UserInterface Extensions Panel Close');
  await xcommand('UserInterface Message TextInput Display', {
    Title: ROOM_METRICS_TITLE,
    Text: RESET_METRICS_TEXT,
    FeedbackId: widgetIds.room_clean_pin,
    InputType: 'PIN',
    Placeholder: 'Pin',
    SubmitText: 'Submit'
  });
}

async function cbWidgetAction(event) {
  handleLog('cbWidgetAction', event);
  let event_type = '';
  if(!!event.Type) event_type = event.Type.toLowerCase();
  if(event_type === 'pressed')  return;

  switch(event.WidgetId) {
  case widgetIds.reset_usage:
    if(event_type === 'clicked')
      await cbResetMatric();
    break;
  }
}

async function timerRefreshMetrics() {
  handleDebug('timerRefreshMetrics', `device_data`, device_data);
  clearTimeout(device_status.h_refresh_metrics);
  device_status.h_refresh_metrics = 0;

  if(!!device_status.last_panel_opened && device_status.last_panel_opened == PANEL_ROOM_METRICS && (device_data.ts_call_start || device_data.ts_occupy_start)) {
    device_status.h_refresh_metrics = setTimeout(timerRefreshMetrics, TIMER_REFRESH_METRICS);
    await updateUI();
  }
}

async function refreshMetric(cb_name='', value='') {
  handleLog('refreshMetric', `cb_name=${cb_name}, value=${value}`);

  const ambient_noise = await xapi.status.get('RoomAnalytics AmbientNoise Level A').catch(e => {return ''});
  const ambient_temperature = await xapi.status.get('RoomAnalytics AmbientTemperature').catch(e => {return ''});
  const relative_humidity = await xapi.status.get('RoomAnalytics RelativeHumidity').catch(e => {return ''});
  const sound_level = await xapi.status.get('RoomAnalytics Sound Level A').catch(e => {return ''});
  const peri_connectedDevice = await xapi.status.get('Peripherals ConnectedDevice').catch(e => {return []});

  handleDebug('refreshMetric', `ambient_noise=${ambient_noise}, ambient_temperature=${ambient_temperature}, relative_humidity=${relative_humidity}, sound_level=${sound_level}, peri_connectedDevice=`, peri_connectedDevice);
  if(ambient_noise)         device_status.AmbientNoise = ambient_noise;
  if(ambient_temperature)   device_status.AmbientTemperature = ambient_temperature;
  if(relative_humidity)     device_status.RelativeHumidity = relative_humidity;
  if(sound_level)           device_status.SoundLevel = sound_level;

  for(let val of peri_connectedDevice) {
    handleDebug('refreshMetric', `peri_connectedDevice:val=`, val);
    if(val.RoomAnalytics && val.Name.includes('Room Navigator') && val.Type == 'TouchPanel') {
      if(!!val.RoomAnalytics.AirQuality && !!val.RoomAnalytics.AirQuality.Index)  device_status.AirQuality = val.RoomAnalytics.AirQuality.Index;
      if(!ambient_temperature && !!val.RoomAnalytics.AmbientTemperature)  device_status.AmbientTemperature = val.RoomAnalytics.AmbientTemperature;
      if(!relative_humidity && !!val.RoomAnalytics.RelativeHumidity)      device_status.RelativeHumidity = val.RoomAnalytics.RelativeHumidity;
      if(!!val.NetworkAddress && val.NetworkAddress.startsWith('169.'))   break;
    }
  }

  if(device_status.AirQuality)          device_status.AirQuality = parseFloat(device_status.AirQuality).toFixed(1);
  if(device_status.AmbientTemperature)  device_status.AmbientTemperature = parseFloat(device_status.AmbientTemperature).toFixed(1);
  if(device_status.RelativeHumidity)    device_status.RelativeHumidity = parseInt(device_status.RelativeHumidity);

  device_data.ts = await getLocalSystemTime();
  if(!!device_status.last_panel_opened && device_status.last_panel_opened == PANEL_ROOM_METRICS) await updateUI();
}

async function resetMetric(cb_name='') {
  handleLog('resetMetric', `cb_name=${cb_name}`);
  await xcommand('UserInterface Extensions Panel Close');

  await clearData(cb_name);
  await displayAlertMessage({
    Text: RESET_METRICS_SUCCESS_TEXT,
    Duration: RESET_METRICS_SUCCESS_DURATION
  });

  if(device_status.b_send_fb_reset_metric && cb_name == widgetIds.room_clean_pin) {
    const data = JSON.parse(JSON.stringify(device_data));
    await sendFeedback(ACTION_RESET_METRICS, data);
    device_status.last_ts_http_send = await getTimeNow();
  }
}

async function updateUI(widgets='') {
  handleDebug('updateUI', `widgets`, widgets, 'device_status', device_status, 'device_data', device_data);
  const time_now = await getTimeNow();
  let t_date   = device_data.ts;
  let t_occupy = device_data.t_occupy;
  let t_meet   = device_data.t_meet;
  let n_meet   = device_data.n_meet;

  if(device_data.ts_occupy_start)   t_occupy += (time_now - device_data.ts_occupy_start);
  if(device_data.ts_call_start)     t_meet += (time_now - device_data.ts_call_start);

  t_occupy = `${convertToUsage(t_occupy, ROOM_USAGE)} (${convertSecondToHour(t_occupy, 2)} hr)`;
  t_meet = `${n_meet} (${convertSecondToHour(t_meet, 2)} hr)`;

  let t_noise = ((!!device_status.AmbientNoise) ? `${convertToUsage(device_status.AmbientNoise, AMBIENT_NOISE)} (${device_status.AmbientNoise} dBA / ${device_status.SoundLevel} dBA)` : 'N/A');
  let t_temp = ((!!device_status.AmbientTemperature) ? `${device_status.AmbientTemperature}°C | ${convertCelsiusToFahrenheit(device_status.AmbientTemperature)}°F` : 'N/A');
  let t_humid = ((!!device_status.RelativeHumidity) ? `${device_status.RelativeHumidity}%` : 'N/A');
  let t_air = ((!!device_status.AirQuality) ? `${convertToUsage(device_status.AirQuality, AIR_QUALITY)} (${parseFloat(device_status.AirQuality).toFixed(1)})` : 'N/A');

  if(widgets.length) {
    widgets.forEach((val) => {
      if(val === widgetIds.metric_date)     setWidgetValue(widgetIds.metric_date, t_date);
      if(val === widgetIds.metric_occupy)   setWidgetValue(widgetIds.metric_occupy, t_occupy);
      if(val === widgetIds.metric_meet)     setWidgetValue(widgetIds.metric_meet, t_meet);
      if(val === widgetIds.metric_noise)    setWidgetValue(widgetIds.metric_noise, t_noise);
      if(val === widgetIds.metric_temperature)  setWidgetValue(widgetIds.metric_temperature, t_temp);
      if(val === widgetIds.metric_humidity)     setWidgetValue(widgetIds.metric_humidity, t_humid);
      if(val === widgetIds.metric_air)      setWidgetValue(widgetIds.metric_air, t_air);
    })
  }
  else {
    await setWidgetValue(widgetIds.metric_date, t_date);
    await setWidgetValue(widgetIds.metric_occupy, t_occupy);
    await setWidgetValue(widgetIds.metric_meet, t_meet);
    await setWidgetValue(widgetIds.metric_noise, t_noise);
    await setWidgetValue(widgetIds.metric_temperature, t_temp);
    await setWidgetValue(widgetIds.metric_humidity, t_humid);
    await setWidgetValue(widgetIds.metric_air, t_air);
  }
}

/* ****
*/
const INIT_CONFIG         = 'init_config';

const TIMER_INIT_CONFIG   = 2 * 1000; // in msec
const TIMER_DELAY_TASK    = 3 * 1000; // msec

async function listenOn() {
  handleLog('listenOn');
  xapi.event.on('UserInterface Extensions Widget Action', (event) => cbWidgetAction(event));

  xapi.status.on('RoomAnalytics PeopleCount Current', (value) => cbPeopleChange(C.PEOPLE_COUNT, value));
  xapi.status.on('RoomAnalytics PeopleCount Capacity', (value) => cbPeopleChange(C.ROOM_CAPACITY, value));
  if(device_status.b_has_camera_lid)  xapi.status.on('RoomAnalytics PeoplePresence', (value) => cbPeopleChange(C.PEOPLE_PRESENCE, value));

  xapi.status.on('RoomAnalytics AmbientTemperature', (value) => refreshMetric(C.TEMPERATURE, value));
  xapi.status.on('RoomAnalytics RelativeHumidity', (value) => refreshMetric(C.HUMIDITY, value));
  xapi.status.on('Peripherals ConnectedDevice RoomAnalytics AmbientTemperature', (value) => refreshMetric(C.PERI_TEMPERATURE, value));
  xapi.status.on('Peripherals ConnectedDevice RoomAnalytics RelativeHumidity', (value) => refreshMetric(C.PERI_HUMIDITY, value));
  xapi.status.on('Peripherals ConnectedDevice RoomAnalytics AirQuality Index', (value) => refreshMetric(C.AIR_QUALITY, value));

  xapi.Status.Call.Status.on((status) => cbCallConnected(status));
  xapi.Event.CallDisconnect.on((event) => cbCallDisconnected(event));

  xapi.event.on('UserInterface Extensions Panel Clicked', (event) => {
    handleLog('Panel Clicked', `event`, event)
    if(event.PanelId == PANEL_ROOM_METRICS) {
      device_status.last_panel_opened = PANEL_ROOM_METRICS;
      refreshMetric(PANEL_ROOM_METRICS);
      timerRefreshMetrics();
    }
    else {
      device_status.last_panel_opened = ''
    }
  });

  xapi.event.on('UserInterface Extensions Panel Close', (event) => {
    handleLog('Panel Close', `event`, event);
    device_status.last_panel_opened = '';
  });

  xapi.event.on('UserInterface Message TextInput Response', (event) => {
    handleLog('TextInput Response', `event`, event);
    if(event.FeedbackId == widgetIds.room_clean_pin) {
      if(event.Text == ROOM_CLEANED_PIN) {
        resetMetric(widgetIds.room_clean_pin);
      }
      else {
        displayAlertMessage({
          Title: PIN_INCORRECT_TITLE,
          Text: PIN_FORGET,
          Duration: PIN_INCORRECT_DURATION
        });
      }
    }
  });
}

async function delayedTask() {
  const people_count = await xapi.status.get('RoomAnalytics PeopleCount Current').catch(e => {return 0});

  await restoreData();
  await refreshMetric('delayedTask');
  await listenOn();
  await cbPeopleChange(C.PEOPLE_COUNT, people_count);

  let sec_remain = await getSecondToNext(TIME_RESET_METRICS_AT);
  if(sec_remain)  setTimeout(resetMetric, sec_remain*1000, 'setTimeout');
  handleLog('setTimeout:resetMetric', `ts_next=${TIME_RESET_METRICS_AT}, sec_remain=${sec_remain}`);

  handleLog('delayedTask', `timer=${TIMER_DELAY_TASK}, people_count=${people_count}, device_status=`, device_status);
}

async function initConfig(cb_from='') {
  const su = await xapi.status.get('SystemUnit').catch(e => {return ''});
  const ci_name = await xapi.status.get('UserInterface ContactInfo Name').catch(e => {return ''});
  const room_capacity = await xapi.status.get('RoomAnalytics PeopleCount Capacity').catch(e => {return 0});
  handleLog('initConfig', `version=${MACRO_VERSION}, cb_from=${cb_from}, ci_name=${ci_name}`);

  await xconfig('Macros AutoStart', 'On');
  await xconfig('Macros Mode', 'On');
  await xconfig('Macros UnresponsiveTimeout', '5');
  await xconfig('HttpClient Mode', 'On');
  await xconfig('HttpClient AllowHTTP', 'False');
  await xconfig('HttpClient AllowInsecureHTTPS', 'True');

  if(hasSensor(su.Software.Name)) {
    await xconfig('WebEngine Mode', 'On');
    await xconfig('WebEngine Features WebGL', 'On');
    await xconfig('RoomAnalytics AmbientNoiseEstimation Mode', 'On');
    await xconfig('RoomAnalytics PeopleCountOutOfCall', 'On');
    await xconfig('RoomAnalytics PeoplePresenceDetector', 'On');
    await xconfig('Standby WakeupOnMotionDetection', 'On');
  }

  if(ci_name)   await xconfig(`SystemUnit Name`, ci_name);
  if(su.State.CameraLid)  device_status.b_has_camera_lid = true;
  if(room_capacity > 0)   device_status.room_capacity = room_capacity;

  await restoreExtension();

  if(cb_from == INIT_CONFIG)  setTimeout(delayedTask, TIMER_DELAY_TASK);
}

/* Auxiliary functions
*/
const C = {
  'ON':              'On',
  'OFF':             'Off',
  'OPEN':            'Open',
  'CLOSED':          'Closed',
  'YES':             'Yes',
  'NO':              'No',
  'TRUE':            'True',
  'FALSE':           'False',

  'CALL_CONNECTED':  'call_connected',
  'CALL_DISCONNECT': 'call_disconnect',
  'CALL_STATUS':     'call_status',
  'CALL_STATUS_CONNECTED':   'Connected',
  'CALL_STATUS_DIALLING':    'Dialling',
  'CALL_STATUS_RINGING':     'Ringing',
  'INIT_CONFIG':     'init_config',
  'LOCAL_INSTANCE':  'local_instance',
  'SIGNAGE_URL':     'signage_url',
  'STANDBY':         'standby',
  'STANDBY_OFF':     'standby_off',
  'STANDBY_ON':      'standby_on',
  'STANDBY_ENTERING': 'EnteringStandby',
  'STANDBY_HALFWAKE': 'Halfwake',
  'STANDBY_STANDBY':  'Standby',
  'WEBVIEW':          'webview',
  'WEBVIEW_VISIBLE':         'Visible',
  'WEBVIEW_NOT_VISIBLE':     'NotVisible',

  'PEOPLE_COUNT':     'people_count',
  'PEOPLE_PRESENCE':  'people_presence',
  'PEOPLE_PRESENCE_OFFSET':   (2 * 60),
  'CLOSE_PROXIMITY':  'close_proximity',
  'ROOM_CAPACITY':    'room_capacity',

  'AIR_QUALITY':      'air_quality',
  'AMBIENT_NOISE':    'ambient_noise',
  'HUMIDITY':         'humidity',
  'SOUND_LEVEL':      'soucnd_level',
  'TEMPERATURE':      'temperature',
  'PERI_HUMIDITY':    'peri_humidity',
  'PERI_TEMPERATURE': 'peri_temperature',
};

function convertCelsiusToFahrenheit(celsius) {
  let fahrenheit = '';
  if(!!celsius)   fahrenheit = ((parseFloat(celsius) * 9 / 5) + 32).toFixed(1);
  handleDebug('convertCelsiusToFahrenheit', `celsius=${celsius}, fahrenheit=${fahrenheit}`);
  return fahrenheit;
}

function convertSecondToHour(second, decimal=1) {
  return (second / 3600).toFixed(decimal);
}

function convertToUsage(value, usage_ref) {
  let usage = '';
  if(usage_ref.very_high && value >= usage_ref.very_high.value)   usage = usage_ref.very_high.name;
  else if(usage_ref.high && value >= usage_ref.high.value)        usage = usage_ref.high.name;
  else if(usage_ref.medium && value >= usage_ref.medium.value)    usage = usage_ref.medium.name;
  else if(usage_ref.low && value >= usage_ref.low.value)          usage = usage_ref.low.name;
  else                                                            usage = usage_ref.very_low.name;

  handleDebug('convertToUsage', `value=${value}, usage=${usage}`);
  return usage;
}

async function displayAlertMessage(value) {
  await xcommand(`UserInterface Message Alert Display`, value);
}

const HTTP_POST_TIMEOUT = 5;
async function postHttpClient(url, header, data, timeout=HTTP_POST_TIMEOUT) {
  await xapi.command('HttpClient Post', {Header: header, AllowInsecureHTTPS: true, Timeout: timeout, Url: url}, data)
  .then(r => handleLog('postHttpClient', `status=${r.StatusCode}, url=${url}, data=${data}`))
  .catch(e => handleError('postHttpClient', `url=${url}, timeout=${timeout}, data=${data}`, e));
}

async function setWidgetValue(widget_id, value) {
  handleLog('setWidgetValue', `widget_id=${widget_id}, value=${value}`);
  const widget_type = widget_id.split('-')[0];
  if(widget_type === 'toggle')  value = value.toLowerCase();
  await xcommand('UserInterface Extensions Widget SetValue', {WidgetId: widget_id, Value: value});
}

/**/
async function getTimeNow(sec=1) {
  let ts = (new Date()).getTime();
  if(sec) ts = Math.round(ts/1000);
  return ts;
}

async function getLocalSystemTime() {
  return await xapi.Status.Time.SystemTime.get();  // Hope for NTP is sync'd after delayed sceonds
}

async function getSecondToNext(f_hour, f_minute=0, sys_time='') {
  if(!sys_time)   sys_time = await getLocalSystemTime();
  f_hour = parseInt(f_hour);
  f_minute = parseInt(f_minute);

  const t_hour = await getHour(sys_time);
  const t_min = await getMinute(sys_time);
  const time_now = new Date();
  const time_next = new Date();
  if(t_hour >= f_hour && t_min >= f_minute) f_hour += 24;
  time_next.setHours(f_hour, f_minute, 0, 0);

  const diff_sec = Math.round((time_next.getTime() - time_now.getTime())/1000);
  handleLog('getSecondToNext', `sys_time=${sys_time}, t_hour=${t_hour}, t_min=${t_min}, f_hour=${f_hour}, f_minute=${f_minute}, time_now=${time_now}, time_next=${time_next}, diff_sec=${diff_sec}`);
  return diff_sec;
}

async function getDate(sys_time) {
  return sys_time.split('T')[0];
}

async function getHour(sys_time) {
  return parseInt(sys_time.split('T')[1].split(':')[0]);
}

async function getMinute(sys_time) {
  return parseInt(sys_time.split('T')[1].split(':')[1]);
}

/**/
function handleDebug(func, ...args) {
  console.debug(`${func}:`, JSON.stringify(args));
}

function handleError(func, ...args) {
  console.error(`${func}:`, JSON.stringify(args));
}

function handleLog(func, ...args) {
  console.log(`${func}:`, JSON.stringify(args));
}

function hasSensor(softwareName) {
  handleLog('hasSensor', `softwareName=${softwareName}`);
  switch(softwareName) {
  case 's53200': // sunrise (Webex Room Series + WebexBoard)
  case 's53300': // zenith (Room Kit Pro / Room 70 G2 / Panorama / Desk Pro)
    return true;
  default:
    return false;
  }
}

async function xcommand(path, value='') {
  handleLog('xcommand', `path=${path}`, value);
  return await xapi.command(path, value)
    .catch(e => handleError('xcommand', `path=${path}, value=${JSON.stringify(value)}`, e));
}

async function xconfig(path, value) {
  handleLog('xconfig', `path=${path}`, value);
  return await xapi.config.set(path, value)
    .catch(e => handleError('xconfig', `path=${path}, value=${value}`, e));
}

/* XML */
async function restoreExtension() {
  handleLog('restoreExtension', `PanelId=${PANEL_ROOM_METRICS}`);
  await xapi.Command.UserInterface.Extensions.Panel.Save({PanelId: PANEL_ROOM_METRICS}, `
<Extensions>
  <Panel>
    <PanelId>${PANEL_ROOM_METRICS}</PanelId>
    <Location>HomeScreenAndCallControls</Location>
    <Type>Statusbar</Type>
    <Icon>Info</Icon>
    <Name>Room Metrics</Name>
    <ActivityType>Custom</ActivityType>
    <Page>
      <PageId>${PAGE_ROOM_METRICS}</PageId>
      <Name>Room Metrics</Name>
      <Row>
        <Name>Room Utilization</Name>
        <Widget>
          <WidgetId>text-metric_occupy</WidgetId>
          <Name/>
          <Type>Text</Type>
          <Options>size=4;fontSize=normal;align=left</Options>
        </Widget>
      </Row>
      <Row>
        <Name>Meeting Engaged</Name>
        <Widget>
          <WidgetId>text-metric_meet</WidgetId>
          <Name/>
          <Type>Text</Type>
          <Options>size=4;fontSize=normal;align=left</Options>
        </Widget>
      </Row>
      <Row>
        <Name>Ambient Noise / Sound Level A</Name>
        <Widget>
          <WidgetId>text-metric_noise</WidgetId>
          <Name/>
          <Type>Text</Type>
          <Options>size=4;fontSize=normal;align=left</Options>
        </Widget>
      </Row>
      <Row>
        <Name>Ambient Temperature</Name>
        <Widget>
          <WidgetId>text-metric_temperature</WidgetId>
          <Name/>
          <Type>Text</Type>
          <Options>size=4;fontSize=normal;align=left</Options>
        </Widget>
      </Row>
      <Row>
        <Name>Relative Humidity</Name>
        <Widget>
          <WidgetId>text-metric_humidity</WidgetId>
          <Name/>
          <Type>Text</Type>
          <Options>size=4;fontSize=normal;align=left</Options>
        </Widget>
      </Row>
      <Row>
        <Name>Air Quality (TVOC)</Name>
        <Widget>
          <WidgetId>text-metric_air</WidgetId>
          <Name/>
          <Type>Text</Type>
          <Options>size=4;fontSize=normal;align=left</Options>
        </Widget>
      </Row>
      <Row>
        <Name>Last Update</Name>
        <Widget>
          <WidgetId>text-metric_date</WidgetId>
          <Name/>
          <Type>Text</Type>
          <Options>size=4;fontSize=normal;align=left</Options>
        </Widget>
      </Row>
      <Options/>
    </Page>
    <Page>
      <Name>Reset</Name>
      <Row>
        <Name>Row</Name>
        <Widget>
          <WidgetId>text-reset_usage</WidgetId>
          <Name>Room Metrics</Name>
          <Type>Text</Type>
          <Options>size=2;fontSize=normal;align=left</Options>
        </Widget>
        <Widget>
          <WidgetId>button-reset_usage</WidgetId>
          <Name>Reset Now</Name>
          <Type>Button</Type>
          <Options>size=2</Options>
        </Widget>
      </Row>
      <Row>
        <Name>Row</Name>
        <Widget>
          <WidgetId>test-reset_usage_remark</WidgetId>
          <Name>Remark: Room Metrics will be reset at midnight 12am everyday.</Name>
          <Type>Text</Type>
          <Options>size=4;fontSize=small;align=left</Options>
        </Widget>
      </Row>
      <Options>hideRowNames=1</Options>
    </Page>

  </Panel>
</Extensions>
  `)
  .catch(e => handleError('restoreExtension', `PanelId=${PANEL_ROOM_METRICS}`, e));
}

/**********************************************************************************/
/* Data Storage
*/
async function clearData(cb_name='') {
  handleLog('clearData', `cb_name=${cb_name}`);
  device_data = JSON.parse(JSON.stringify(DEVICE_DATA_C));
  await saveData();
}

async function saveData() {
  device_data.ts = await getLocalSystemTime();
  await mem.write(DEVICE_DATA, device_data);
  handleLog('saveData', `device_data`, device_data);
}

async function restoreData() {
  try {
    device_data = await mem.read(DEVICE_DATA);

    if(!device_data.version || device_data.version != DEVICE_DATA_C.version || !device_data.ts) {
      await clearData('restoreData:version');
    }
    else {
      const sys_time = await getLocalSystemTime();
      const date_now = await getDate(sys_time);
      const date_ts = await getDate(device_data.ts);
      handleLog('restoreData', `sys_time=${sys_time}, date_now=${date_now}, date_ts=${date_ts}`);

      if(date_now != date_ts)   await clearData('restoreData:ts');
    }
  }
  catch(e) {
    handleLog('restoreData', `e`, e)
    await clearData('restoreData:catch');
  }

  handleLog('restoreData', DEVICE_DATA, device_data);
}

/**********************************************************************************/
/**
 * Author and Project Lead: Zacharie Gignac
 * Co-Author and Tester: Robert McGonigle
 *
 * CIFSS - Université Laval
 * Harvard University Information Technology
 *
 * Released: November 2020
 * Updated: February 2021
 *
 * Description; Asynchronous read/write permanent memory
 *
 * Use: Allow the storage of persistant information while working within the Macro editor of Cisco Video Room Devices
 *  For more information, please refer to the guide at
 *  https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/tree/master/Macro%20Memory%20Storage
 */

const config = {
    "storageMacro": "Memory_Storage", //Name for Storage Macro
    "autoImport": {
        "mode": "false", //Use: <true, false, "activeOnly", "custom">
        "customImport": []//Only used when Auto import mode is set to custom
    }
};

var mem = {
    "localScript": SCRIPT_NAME
};

function memoryInit() {
    return new Promise((resolve) => {
        xapi.command('macros macro get', {
            Content: 'True',
            Name: config.storageMacro
        }).then((event) => {
            try {
              let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{')
              let store = JSON.parse(raw)
            }
            catch(e) {
              console.warn('empty storage');
              throw '';
            }
        }).catch(e => {
            console.warn('Uh-Oh, no storage Macro found, building "' + config.storageMacro);
            xapi.command('macros macro save', {
                Name: config.storageMacro
            },
                `var memory = {\n\t"./_$Info": {\n\t\t"Warning": "Do NOT modify this document, as other Scripts/Macros may rely on this information", \n\t\t"AvailableFunctions": {\n\t\t\t"local": ["mem.read('key')", "mem.write('key', 'value')", "mem.remove('key')", "mem.print()"],\n\t\t\t"global": ["mem.read.global('key')", "mem.write.global('key', 'value')", "mem.remove.global('key')", "mem.print.global()"]\n\t\t},\n\t\t"Guide": "https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/tree/master/Macro%20Memory%20Storage"\n\t},\n\t"ExampleKey": "Example Value"\n}`
            ).then(() => {
                mem.print.global();
            });

        });
        resolve();
    });
};

memoryInit().then(() => {
}).catch(e => {
    console.error(e)
});

mem.read = function (key) {
    return new Promise((resolve, reject) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: config.storageMacro
        }).then((event) => {
            let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{')
            let store = JSON.parse(raw)
            let temp;
            if (store[mem.localScript] == undefined) {
                store[mem.localScript] = {}
                temp = store[mem.localScript]
            } else {
                temp = store[mem.localScript]
            }
            if (temp[key] != undefined) {
                resolve(temp[key])
            } else {
                reject(new Error('Local Read Error. Object Key: "' + key + '" not found in \'' + config.storageMacro + '\' from script "' + mem.localScript + '"'))
            }
        })
    });
}

mem.read.global = function (key) {
    return new Promise((resolve, reject) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: config.storageMacro
        }).then((event) => {
            let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{')
            let store = JSON.parse(raw)
            if (store[key] != undefined) {
                resolve(store[key])
            } else {
                reject(new Error('Glabal Read Error. Object Key: "' + key + '" not found in \'' + config.storageMacro + '\''))
            }
        })
    });
}

mem.write = function (key, value) {
    return new Promise((resolve) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: config.storageMacro
        }).then((event) => {
            let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
            let store = JSON.parse(raw);
            let temp;
            if (store[mem.localScript] == undefined) {
                store[mem.localScript] = {};
                temp = store[mem.localScript];
            } else {
                temp = store[mem.localScript]
            };
            temp[key] = value;
            store[mem.localScript] = temp;
            let newStore = JSON.stringify(store, null, 4);
            xapi.command('Macros Macro Save', {
                Name: config.storageMacro
            },
                `var memory = ${newStore}`
            ).then(() => {
                console.debug('Local Write Complete => "' + mem.localScript + '" : {"' + key + '" : "' + JSON.stringify(value) + '"}');
                resolve(value);
            });
        });
    });
};

mem.write.global = function (key, value) {
    return new Promise((resolve) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: config.storageMacro
        }).then((event) => {
            let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
            let store = JSON.parse(raw);
            store[key] = value;
            let newStore = JSON.stringify(store, null, 4);
            xapi.command('Macros Macro Save', {
                Name: config.storageMacro
            },
                `var memory = ${newStore}`
            ).then(() => {
                console.debug('Global Write Complete => "' + config.storageMacro + '" : {"' + key + '" : "' + JSON.stringify(value) + '"}');
                resolve(value);
            });
        });
    });
};

mem.remove = function (key) {
    return new Promise((resolve, reject) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: config.storageMacro
        }).then((event) => {
            let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
            let store = JSON.parse(raw);
            let temp;
            if (store[mem.localScript] == undefined) {
                store[mem.localScript] = {};
                temp = store[mem.localScript];
            } else {
                temp = store[mem.localScript];
            };
            if (temp[key] != undefined) {
                let track = temp[key];
                delete (temp[key]);
                store[mem.localScript] = temp;
                let newStore = JSON.stringify(store);
                xapi.command('Macros Macro Save', {
                    Name: config.storageMacro
                },
                    `var memory = ${newStore}`
                ).then(() => {
                    console.warn('WARNING: Local Object Key {"' + key + '" : "' + track + '"} has been deleted from ' + config.storageMacro + '. Deletetion occured in script "' + mem.localScript + '"');
                    resolve(key);
                });
            } else {
                reject(new Error('Local Delete Error. Object Key: "' + key + '" not found under Object "' + mem.localScript + '{}" in "' + config.storageMacro + '"'));
            };
        });
    });
};

mem.remove.global = function (key) {
    return new Promise((resolve, reject) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: config.storageMacro
        }).then((event) => {
            let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
            let store = JSON.parse(raw);
            if (store[key] != undefined) {
                let track = store[key];
                delete (store[key]);
                let newStore = JSON.stringify(store, null, 4);
                xapi.command('Macros Macro Save', {
                    Name: config.storageMacro
                },
                    `var memory = ${newStore}`
                ).then(() => {
                    console.warn('WARNING: Global Object Key {"' + key + '" : "' + track + '"} has been deleted from ' + config.storageMacro + '. Deletetion occured in script "' + mem.localScript + '"');
                    resolve(key);
                });
            } else {
                reject(new Error('Global Delete Error. Object Key: "' + key + '" not found in "' + config.storageMacro + '"'))
            };
        });
    });
};

mem.print = function () {
    return new Promise((resolve, reject) => {
        mem.read.global(mem.localScript).then((log) => {
            console.log(log);
            resolve(log);
        }).catch(e => new Error('Local Print Error: No local key found in "' + config.storageMacro + '"'));
    });
};

mem.print.global = function () {
    return new Promise((resolve, reject) => {
        xapi.command('Macros Macro Get', {
            Content: 'True',
            Name: config.storageMacro
        }).then((event) => {
            let raw = event.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
            let store = JSON.parse(raw);
            console.log(store);
            resolve(store);
        });
    });
};

mem.info = function () {
        mem.read.global("./_$Info").then((log) => {
            console.log(log);
    });
};
/**********************************************************************************/

/* Start Here
*/
setTimeout(initConfig, TIMER_INIT_CONFIG, INIT_CONFIG);

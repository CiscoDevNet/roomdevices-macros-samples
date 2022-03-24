const xapi = require('xapi');

const DD_TOKEN = 'REPLACE_ME';  // get a Client Token from your Datadog account here: https://app.datadoghq.com/organization-settings/client-tokens
const DD_URL = `https://browser-http-intake.logs.datadoghq.com/v1/input/${DD_TOKEN}`;  // if your Datadog instance is in the EU region, use "datadog.eu" instead of "datadog.com"
const DD_TAGS = 'env:stg,team:rocket';  // comma delimited set of tags to be added to all health data captured by this macro

const CHECK_IF_CALL_FREQUENCY = 60000; // Interval at which script checks for active call; recommended not to change this.

// configure the check frequency and status commands to run during calls
const IN_CALL_CHECK_FREQUENCY = 60000; // one minute by default; NOTE: must be larger (in seconds) than the number of STATUS_LIST commands + the number of peripherals connected to the roomkit.
const IN_CALL_STATUS_COMMAND_LIST = [
  'call',
  'mediachannels call',
  'roomanalytics',
  'cameras',
  'cameras camera 1'
];

// configure the check frequency and status commands to run all the time, regardless of whether the room kit device is in a call
const GENERAL_CHECK_FREQUENCY = 300000; // 5 minutes by default; NOTE: must be larger (in seconds) than the number of STATUS_LIST commands + the number of peripherals connected to the roomkit.
const GENERAL_STATUS_COMMAND_LIST = [
  'network'
];
const MONITOR_PERIPHERALS = true;  // perhipherals monitoring requires extra logic and processing

var tags = '';
const version = 'version:0.2.3';
if (DD_TAGS) {
  tags = `${version},${DD_TAGS}`;
}
var next_in_call_check_interval = IN_CALL_CHECK_FREQUENCY;
var next_general_check_interval = GENERAL_CHECK_FREQUENCY;

const CONTENT_TYPE = "Content-Type: application/json";
var systemInfo = {
    softwareVersion : ''
    , systemName : ''
    , softwareReleaseDate : ''
};


// structuring and sending data

function replaceNumbers(key, value) {
  // need to format numbers in json without quotes
  if (isNaN(value)) {
    return value;
  }
  return parseFloat(value);
}

function formatHealthResults(message, command){

  var data_type = Object.prototype.toString.call(message);

  if (data_type === '[object String]') {
    message = {'value': message};
  } else if ((data_type === '[object Array]') && message.length === 1) {
    message = message[0]
  }

  if (Object.keys(message).length === 0) {
    var message = {'command_response': 'none'};
  } else if (command == 'mediachannels call'){
    var namespace = '';
    for (let i = 0; i < message['Channel'].length; i++) {
      if (message['Channel'][i]['Type'] in message['Channel'][i]) {
        namespace = [
          message['Channel'][i]['Type'],
          message['Channel'][i][message['Channel'][i]['Type']]['ChannelRole'],
          message['Channel'][i]['Direction']
        ].join('_')
        message[namespace] = Object.assign(
          message['Channel'][i]['Netstat'], 
          message['Channel'][i][message['Channel'][i]['Type']]
        )
      } else {
        namespace = [
          message['Channel'][i]['Type'],
          message['Channel'][i]['Direction']
        ].join('_')
        message[namespace] = Object.assign(
          message['Channel'][i]['Netstat']
        )
      }
    }
  }

  return {
    'ddsource': 'Cisco Video Endpoint',
    'ddtags': tags,
    'service': 'Cisco Video Endpoint',
    'system_info': systemInfo,
    'device_data': message,
    'command': command
  }
}

function sendHealthData(message){
  console.log('Message sendHealthData: ' + JSON.stringify(message, replaceNumbers));
  xapi.command('HttpClient Post', { 'Header': [CONTENT_TYPE] , 'Url':DD_URL, 'AllowInsecureHTTPS': 'False'}, JSON.stringify(message, replaceNumbers));
}


// getting data

function getEachPeripheralData(perifData){
  // iterate through the peripherals data and send them as unique events
  if ((Object.prototype.toString.call(perifData) === '[object Array]') && perifData.length >= 1) {
    for (let i = 0; i < perifData.length; i++) {
      setTimeout(() => sendHealthData(formatHealthResults([perifData[i]], 'peripherals connecteddevice')), (i + GENERAL_STATUS_COMMAND_LIST.length + 1)*1000);
    }
  } else {
    setTimeout(() => sendHealthData(formatHealthResults([{'command_response': 'none'}], 'peripherals connecteddevice')), (GENERAL_STATUS_COMMAND_LIST.length + 1)*1000);
  }
}

function checkStatus(statusList){
  // we schedule the sending of data in 1s increments so as to avoid running out of HttpClient handlers on the device
  for (let i = 0; i < statusList.length; i++) {
    setTimeout(() => xapi.status.get(statusList[i]).then((stat) => { 
      sendHealthData(formatHealthResults(stat, statusList[i])); 
    }), i*1000);
  }
}

function getSystemData(){
  xapi.status.get('SystemUnit Software Version').then((value) => {
    systemInfo.softwareVersion = value;
  });
  xapi.config.get('SystemUnit Name').then((value) => {
    if(value === ''){
        xapi.status.get('SystemUnit Hardware Module SerialNumber').then((value) => {
          systemInfo.systemName = value;
        });
    }
    else{
      systemInfo.systemName = value;
    }
  });
  xapi.status.get('SystemUnit Software ReleaseDate').then((value) => {
    systemInfo.softwareReleaseDate = value;
  });
}


function runInCallStatusCheck() {
  checkStatus(IN_CALL_STATUS_COMMAND_LIST);
}


function runGeneralStatusCheck() {
  checkStatus(GENERAL_STATUS_COMMAND_LIST);
  if (MONITOR_PERIPHERALS) {
    xapi.status.get('peripherals connecteddevice').then((perifs) => { getEachPeripheralData(perifs); })
  }
}


// scheduling

function scheduleStatusChecks(countdown_general, countdown_in_call, calls) {
  if (calls.length < 1) {
    countdown_in_call = 0;
  } else {
    countdown_in_call -= CHECK_IF_CALL_FREQUENCY;
    if (countdown_in_call <= 0) {
      setTimeout(() => runInCallStatusCheck(), 1);
      countdown_in_call = IN_CALL_CHECK_FREQUENCY;
    }
  }
  countdown_general -= CHECK_IF_CALL_FREQUENCY;
  if (countdown_general <= 0) {
    setTimeout(() => runGeneralStatusCheck(), countdown_in_call > 0 ? 1 : (IN_CALL_STATUS_COMMAND_LIST.length + 1) * 1000);
    countdown_general = GENERAL_CHECK_FREQUENCY;
  }
  setTimeout(() => xapi.status.get('call').then((res) => { 
    scheduleStatusChecks(countdown_general, countdown_in_call, res); 
  }), CHECK_IF_CALL_FREQUENCY);
}


function monitorRoomKit() {
  getSystemData();
  console.log("got system data, now schedule status checks")
  xapi.status.get('call').then((res) => { 
    scheduleStatusChecks(GENERAL_CHECK_FREQUENCY, 0, res); 
  });
}

monitorRoomKit();

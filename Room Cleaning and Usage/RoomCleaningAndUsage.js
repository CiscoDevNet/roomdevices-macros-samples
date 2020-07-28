//
// Copyright (c) 2020 Cisco Systems
// Licensed under the MIT License 
//
// Room Capacity Alerting Macro
// Records cleaning events, shows time since last used, time since last cleaned, number of times since last cleaned, warns of capacity restrictions.
// Requires a Cisco Webex Room, Board or Desk device with at least peopleCount enabled. If using a Codec with external camera, the Cisco Quad Camera is required to count people out of a call.
// If using a Board, a Touch 10 is required to record cleaning events on the device.

import xapi from 'xapi';

const submitPIN = 1234; //PIN cleaner must provide to submit cleaning time
const enforcePeoplePresence = false; //Turn on peoplePresence on macro start true/false
const DATABASE_NAME = 'RoomMonitoringDB'; //Name of the macro with db contents (create it if it doesn't exist)
const panelId = 'roomCleaningEvent'; //ID of the In-room control that records cleaning events
const panelOrder = 1; //Position of the button
const panelName = "Cleaned Room"; //Name of the button
const panelType = "Home" //Type of button
const panelIcon = "Concierge" //Button icon
const panelColor = '#07C1E4' //Button color
const idleTimer = true; //Show idle timer true/false
const maxPeople = 1;  //Not to exceed occupancy for this room
const alertTime = 30; //Time in seconds to display capacity alert on screen and touch 10
const messageX = 9000; // Message X position
const messageY = 1200; //Message Y position
const exceedText = `Room capacity has been limited, please reduce the number of people in this room to ${maxPeople} ${maxPeople > 1 ? 'people' : 'person'}`; //Alert Text
const exceedTitle = 'Room Capacity Limit Reached'; //Alert Title
const usageTitle = 'Room usage'; //Usage Title
let usageText;

//Usage Message
function msgText(lastUsed, lastCleaned, timesUsed) {
  if (lastCleaned) return `Last used: ${lastUsed} ago.<br>Last cleaned: ${lastCleaned} ago.<br>Room used ${timesUsed} ${timesUsed === 0 || timesUsed > 1 ? 'times' : 'time'} since last cleaned.`;
  return `Last used: ${lastUsed} ago.`;
}

//Macro variables, do not change
const DEFAULT_ENV = {CLEANED:0,TIMESUSED:0};
const PREFIX = 'const json = ';
let ENV;
let timer = null;
let timeElapsed = 0; // seconds
let pPresence = '';
let pCount = -2;

//Convert the timestamp into "Time since"
function formatTime(seconds) {
  let d = Math.floor(seconds / 3600 / 24);
  let h = Math.floor(seconds / 3600 % 24);
  let m = Math.floor(seconds % 3600 / 60);
  let s = Math.floor(seconds % 3600 % 60);
  let dDisplay = d > 0 ? d + (d == 1 ? (h >  0 || m > 0 ? " day, " : " day") : (h >  0 || m > 0 ? " days, " : " days")) : "";
  let hDisplay = h > 0 ? h + (h == 1 ? (m >  0 || s > 0 ? " hour, " : " hour") : (m >  0 || s > 0 ? " hours, " : " hours")) : "";
  let mDisplay = m > 0 ? m + (m == 1 ? " minute" : " minutes") : "";
  let sDisplay = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";

  if (m < 1) {
    return dDisplay + hDisplay + mDisplay + sDisplay; 
  }
  else {
    return dDisplay + hDisplay + mDisplay; 
  }
}

//Show message, used for usage information
function showMsg(text, duration = 5) {
  xapi.command('UserInterface Message TextLine Display', {
    Text: text,
    Duration: duration,
    X: messageX,
    Y: messageY
  });
}

//Show Alert, used for capacity warnings and on entry
function alertDisplay(title, text) {
	xapi.command(
    'UserInterface Message Alert Display',
    {Title : title,
    Text : (text),
    Duration : (alertTime) }
  )
}

//Check if the current people count exceeds the maximum allowed
function compareCount(count) {
  if (count !== pCount) {
    if (count > 0) {
      if (timer !== null) {
        stopTimer();
      }
      console.debug('Count ' + count);
      pCount = count;
      //Warn about room capacity
      if (count > maxPeople) {
        alertDisplay(exceedTitle, exceedText);
        console.debug('*** There are too many people in the room. ',count);
      }
    } else if (count === 0) {
      pCount = count;
      console.debug('No people counted');
      if (timer === null && (pPresence === 'No' || pPresence === 'Unknown')) {
        xapi.command('UserInterface Message Alert Clear');
        tick();
      }
    }
  }
}

//Check if presence status has changed
function comparePresence(status) {
  if (status !== pPresence) {
    if (status === 'Yes') {
      if (timer !== null) {
        stopTimer();
      }
      console.debug('Presence detected');
      pPresence = status;
    } else if (status === 'No' || status === 'Unknown') {
      pPresence = status;
      console.debug('No presence detected');
      if (timer === null && pCount === 0) {
        xapi.command('UserInterface Message Alert Clear');
        tick();
      }
    }
  }
}

//Count seconds
function tick() { 
  timer = setTimeout(tick, 1000);
  timeElapsed++;
  if (ENV.CLEANED !== 0) {
    usageText = msgText(formatTime(timeElapsed), formatTime(Math.floor((new Date() - new Date(ENV.CLEANED)) / 1000)), ENV.TIMESUSED);
  }
  else {
    usageText = msgText(formatTime(timeElapsed));
  }
  if (idleTimer) {
    showMsg(usageText);
  }
}

//Stop counting seconds
function stopTimer() {
  clearTimeout(timer);
  timer = null;
  if (timeElapsed > 0) {
    if (ENV.CLEANED !== 0) {
      usageText = msgText(formatTime(timeElapsed), formatTime(Math.floor((new Date() - new Date(ENV.CLEANED)) / 1000)), ENV.TIMESUSED);
    }
    else {
      usageText = msgText(formatTime(timeElapsed));
    }
    xapi.command('UserInterface Message TextLine Clear');
    alertDisplay(usageTitle, usageText, ENV.TIMESUSED);
    console.debug('Time since last person present ' + timeElapsed + ' seconds');
    console.debug('Number of times used ' + ENV.TIMESUSED + ' times');
    timeElapsed = 0;
    ENV.TIMESUSED = ENV.TIMESUSED + 1;
    write(ENV);
  }
}

// Fetch current people count and set feedback for change in people count
function getPeopleCountStatus() {
  xapi.status
  .get('RoomAnalytics PeopleCount')
  .then((count) => {
    console.debug('Max occupancy for this room is: ' + maxPeople);
    console.debug(`Initial people count is: ${count.Current}`);
    compareCount(parseInt(count.Current));

    // Listen to events
    console.debug('Adding feedback listener to: RoomAnalytics PeopleCount');
    xapi.feedback.on('/Status/RoomAnalytics/PeopleCount', (count) => {
      compareCount(parseInt(count.Current));
      console.debug(`Updated count to: ${count.Current}`);
    });
  })
  .catch((err) => {
    console.debug(`Failed to fetch PeopleCount, err: ${err.message}`);
    console.debug(`Are you interacting with a Room Series? exiting...`);
    xapi.close();
  });
}

//Fetch current people presence and set feedback for change in people presence
function getPeoplePresenceStatus() {
  xapi.status
    .get('RoomAnalytics PeoplePresence')
    .then((status) => {
      console.debug(`Initial people presence status is: ${status}`);
      comparePresence(status);

      // Listen to events
      console.debug('Adding feedback listener to: RoomAnalytics PeoplePresence');
      xapi.feedback.on('/Status/RoomAnalytics/PeoplePresence', (status) => {
          comparePresence(status);
          console.debug(`Updated presence to: ${status}`);
      });
    })
    .catch((err) => {
      console.debug(`Failed to fetch peoplePresence, err: ${err.message}`);
  });
}

//Record the time that cleaning occured
function recordTime() {
  ENV.CLEANED = new Date();
  ENV.TIMESUSED = 0;
  write(ENV);
  alertDisplay(`Submitted`,`Cleaning recorded`);
}

//Listen for PIN responses on cleaning button dialog
xapi.event.on('UserInterface Message TextInput Response', (event) => {
	switch(event.FeedbackId){
    case 'cleanerPIN':
      parseInt(event.Text) == submitPIN ? recordTime() : alertDisplay('Wrong PIN', 'PIN does not match, cleaning event not submitted!');
	break;
	}
});

//Monitor for button presses
xapi.event.on('UserInterface Extensions Panel Clicked', event => {
  switch(event.PanelId) {
    case panelId:
      //Record cleaning event
      xapi.command("UserInterface Message TextInput Display", {
				Duration: 45
				, FeedbackId:'cleanerPIN'
				, InputType: 'PIN'
				, KeyboardState:'Open'
				, Placeholder:'Please enter the PIN to submit cleaning event'
				, SubmitText:'Submit PIN'
				, Title: 'Cleaning PIN'
				, Text: 'Please enter the PIN to submit cleaning event'
			    });
      break;
    default:
      break;
  }
})

//Read database contents
async function read() {
   //Load contents
   let contents;
   try {
      let macro = await xapi.command('Macros Macro Get', { Name: DATABASE_NAME, Content: true });
      contents = macro.Macro[0].Content.substring(PREFIX.length);
   }
   catch(err) {
      //If the DB macro does not exist, create it
      if (err.message === 'No such macro') {
        await xapi.command('Macros Macro Save', { Name: DATABASE_NAME, Overwrite: false}, '');
        contents = '';
      } else {
        console.error(`cannot load contents from macro: ${DATABASE_NAME}`);
        throw new Error("DB_ACCESS_ERROR");
      }
   }
   
   //Parse contents
   try {
      let data;
      if (contents !== '') {
        console.debug(`DB contains: ${contents}`);
        data = JSON.parse(contents);
      } else {
        data = '';
      }
      return data
   }
   catch (err) {
      console.error('DB is corrupted, cannot JSON parse the DB');
      throw new Error('DB_PARSE_ERROR');
   }
}

//Write database contents
async function write(data) {
   // Serialize data as JSON and append prefix
   let contents;
   try {
      contents = PREFIX + JSON.stringify(data);
   }
   catch (err) {
      console.debug('Contents cannot be serialized to JSON');
      throw new Error('DB_SERIALIZE_ERROR');
   }
   
   //Write
   try {
      let res = await xapi.command('Macros Macro Save', { Name: DATABASE_NAME, OverWrite: true, body: contents });
      return (res.status == 'OK');
   }
   catch (err) {
      console.error(`cannot write contents to macro: ${DATABASE_NAME}`);
      throw new Error('DB_ACCESS_ERROR');
   }
}

//Create a UI Extension Button
function addActionPanel() {
  var paneldata = `
    <Extensions>
      <Version>1.7</Version>
      <Panel>
        <Order>${panelOrder}</Order>
        <PanelId>${panelId}</PanelId>
        <Origin>local</Origin>
        <Type>${panelType}</Type>
        <Icon>${panelIcon}</Icon>
        <Color>${panelColor}</Color>
        <Name>${panelName}</Name>
        <ActivityType>Custom</ActivityType>    
      </Panel>
    </Extensions>
    `;
 xapi.command('UserInterface Extensions Panel Save', {PanelId: panelId}, paneldata)
}

//When the macro engine is ready, start
xapi.on('ready', async () => {
  let data = await read();
  //Enable People Count
  xapi.config.set('RoomAnalytics PeopleCountOutOfCall', 'On')
  .then(getPeopleCountStatus())
  .catch((error) => { console.error(error); });
  console.debug('RoomAnalytics PeopleCountOutOfCall Has been Enabled');
  //Enable People Presence, if enforce set true
  if (enforcePeoplePresence) {
    xapi.config.set('RoomAnalytics PeoplePresenceDetector', 'On')
    .then(getPeoplePresenceStatus())
    .catch((error) => { console.error(error); });
    console.debug('RoomAnalytics PeoplePresenceDetector Has been Enabled');
  } else {
    getPeoplePresenceStatus();
  }

  // if env is empty, create a new storage with default env
  if (!data) {
    console.info('No existing ENV, creating default');
    ENV = DEFAULT_ENV;
    await write(ENV);
  }
  else {
    ENV = data;
  }

  //Check if cleaning button exists and create it if it doesn't
  let currentExtensions = await xapi.command('UserInterface Extensions List', {ActivityType: 'custom'});
  let panelPresent = false;
  for (var key in currentExtensions.Extensions.Panel) {
    let panel = currentExtensions.Extensions.Panel[key];
    if (panel.PanelId === panelId) panelPresent = true;
  }
  if (!panelPresent) addActionPanel();
});
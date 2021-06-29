//
// Copyright (c) 2020 Cisco Systems
// Licensed under the MIT License
//
// Room Capacity Alerting Macro
// Records cleaning events, shows time since last used, time since last cleaned, number of times since last cleaned, warns of capacity restrictions.
// Requires a Cisco Webex Room, Board or Desk device with at least peopleCount enabled. If using a Codec with external camera, the Cisco Quad Camera is required to count people out of a call.
// If using a Board, a Touch 10 is required to record cleaning events on the device.

/**
 * Recommended to-dos:
 * - separate memory handling to separate script
 * - only update widget values when panel is shown
 */

 import xapi from 'xapi';

 const pinCode = 1234; //PIN cleaner must provide to submit cleaning time
 const enforcePeoplePresence = false; //Turn on peoplePresence on macro start true/false
 const DATABASE_NAME = 'RoomMonitoringDB'; //Name of the macro with db contents (create it if it doesn't exist)
 const idleTimer = true; //Show idle timer true/false
 const maxPeople = 1;  //Not to exceed occupancy for this room
 const alertTime = 15; //Time in seconds to display capacity alert on screen and touch 10
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
   console.log('compare presence', status);
   if (status !== pPresence) {
     if (status === 'Yes') {
       if (timer !== null) {
         stopTimer();
       }
       console.debug('Presence detected');
       pPresence = status;
     } else if (status === 'No' || status === 'Unknown') {
       console.log('status', status);
       pPresence = status;
       console.debug('No presence detected');
       if (timer === null && pCount === 0) {
         xapi.command('UserInterface Message Alert Clear');
         tick();
       }
     }
   }
 }

 function setWidgetText(WidgetId, text) {
   xapi.Command.UserInterface.Extensions.Widget.SetValue({ WidgetId, Value: text });
 }

 //Count seconds
 function tick() {
   timer = setTimeout(tick, 1000);

   timeElapsed++;
   if (ENV.CLEANED !== 0) {
     const lastCleaned = formatTime(Math.floor((new Date() - new Date(ENV.CLEANED)) / 1000));
     const lastUsed = formatTime(timeElapsed);
     updateUiPanelWithStats(lastCleaned, lastUsed, ENV.TIMESUSED);
     usageText = msgText(lastUsed, lastCleaned, ENV.TIMESUSED);
   }
   else {
     const lastUsed = formatTime(timeElapsed);
     usageText = msgText(lastUsed);
     updateUiPanelWithStats(null, lastUsed, null);
   }
   if (idleTimer) {
     showMsg(usageText);
   }
 }

 function updateUiPanelWithStats(lastCleaned, lastUsed, timesUsed) {
   lastCleaned && setWidgetText('roomCleaningTxtLastCleaned', lastCleaned + ' ago');
   lastUsed && setWidgetText('roomCleaningTxtLastUsed', lastUsed + ' ago');
   Number(timesUsed !== NaN) && setWidgetText('roomCleaningTxtUsed', ENV.TIMESUSED + ' times');
 }

 //Stop counting seconds
 function stopTimer() {
   clearTimeout(timer);
   timer = null;
   if (timeElapsed > 0) {
     if (ENV.CLEANED !== 0) {
       const lastCleaned = formatTime(Math.floor((new Date() - new Date(ENV.CLEANED)) / 1000));
       const lastUsed = formatTime(timeElapsed);
       updateUiPanelWithStats(lastCleaned, lastUsed, ENV.TIMESUSED);
       usageText = msgText(lastUsed, lastCleaned, ENV.TIMESUSED + ' ago');
     }
     else {
       const lastUsed = formatTime(timeElapsed);
       usageText = msgText(lastUsed);
       updateUiPanelWithStats(null, lastUsed, null);
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
   const lastCleaned = formatTime(1);
   const lastUsed = formatTime(1);
   updateUiPanelWithStats(lastCleaned, lastUsed, ENV.TIMESUSED);
 }


 function initUiListeners() {
   //Listen for PIN responses on cleaning button dialog
   xapi.event.on('UserInterface Message TextInput Response', (event) => {
     switch(event.FeedbackId){
       case 'cleanerPIN':
         parseInt(event.Text) == pinCode ? recordTime() : alertDisplay('Wrong PIN', 'PIN does not match, cleaning event not submitted!');
     break;
     }
   });

   xapi.Event.UserInterface.Extensions.Widget.Action.on(e => {
     if (e.WidgetId === 'roomCleaningButtonClean' && e.Type === 'clicked') {
       console.log('prompt pin');
       xapi.command("UserInterface Message TextInput Display", {
         Duration: 45,
         FeedbackId:'cleanerPIN',
         InputType: 'PIN',
         KeyboardState:'Open',
         Placeholder:'Please enter the PIN to submit cleaning event',
         SubmitText:'Submit PIN',
         Title: 'Cleaning PIN',
         Text: 'Please enter the PIN to submit cleaning event',
       });
     }
   })
 }

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

 async function init() {
   let data = await read();
   //Enable People Count
   await xapi.config.set('RoomAnalytics PeopleCountOutOfCall', 'On')
   getPeopleCountStatus();

   initUiListeners();

   console.debug('RoomAnalytics PeopleCountOutOfCall Has been Enabled');
   //Enable People Presence, if enforce set true
   if (enforcePeoplePresence) {
     await xapi.config.set('RoomAnalytics PeoplePresenceDetector', 'On');
     getPeoplePresenceStatus();
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
 }

 init();

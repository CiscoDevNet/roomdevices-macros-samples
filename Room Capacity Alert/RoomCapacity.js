/**
 * Room Capacity Alerting Macro
 * 
 * Uses The Room Analytics People Count API to alert users in a room if they exceed the set capacity limits.
 * 
 */

const xapi = require('xapi');

//Variables you are able to adjust as needed for the Room Capacity and Messaging
const maxPeople = 1;  //Not to exceed occupancy for this room
const alertTime = 20; //Time in seconds to display alert on screen and touch 10
const text2Display = 'Room Capacity Has Been Limited, please reduce the number of people in this room to ' + maxPeople + ' people'; //Alert Text


//Listed below is the code that runs the Room Capacity Alerting using the variables you edited above.  Generally this should not be edited.

//This enables the Room Analytics required for the Macro to function properly
function init() {
  xapi.config.set('RoomAnalytics PeopleCountOutOfCall', 'On')
    .catch((error) => { console.error(error); });
    console.log('RoomAnalytics PeopleCountOutOfCall Has been Enabled');
}

function alertDisplay() {
	xapi.command(
	  	'UserInterface Message Alert Display',
	  	{Title : 'Room Capacity Limit Reached',
	  	Text : (text2Display),
	  	Duration : (alertTime) }
	  )
}

function checkCount(count) {
  if (count > maxPeople) {
    alertDisplay()
    console.log('*** There are too many people in the room. ',count)
  }
}

//Run init function to setup prerequisite configurations
init();
  

// Fetch current count and set feedback for change in peoplecount
xapi.status
    .get('RoomAnalytics PeopleCount')
    .then((count) => {
        console.log('Max occupancy for this room is: ' + maxPeople);
        console.log(`Initial people count is: ${count.Current}`);
        checkCount(count.Current);

        // Listen to events
        console.log('Adding feedback listener to: RoomAnalytics PeopleCount');
        xapi.feedback.on('/Status/RoomAnalytics/PeopleCount', (count) => {
            checkCount(count.Current);
            console.log(`Updated count to: ${count.Current}`);
        });

    })
    .catch((err) => {
        console.log(`Failed to fetch PeopleCount, err: ${err.message}`);
        console.log(`Are you interacting with a Room Series? exiting...`);
        xapi.close();
    });

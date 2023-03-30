/**
 * Room Capacity Alerting Macro
 *
 * Uses The Room Analytics People Count API to alert users in a room if they exceed the set capacity limits.
 *
 * Contributers:
 * Richard Bayes (ribayes@cisco.com)
 * Susanna Moneta (smoneta@cisco.com)
 */

import xapi from 'xapi';

//Variables you are able to adjust as needed for the Room Capacity and Messaging
const alertTime = 20; //Time in seconds to display alert on screen and touch 10


//This enables the Room Analytics required for the Macro to function properly
function init() {
    xapi.config.set('RoomAnalytics PeopleCountOutOfCall', 'On')
    .catch((error) => { console.error(error); });
    console.log('RoomAnalytics PeopleCountOutOfCall Has been Enabled');
}

function alertDisplay(capacity) {
   const text2Display = 'Room capacity has been limited, please reduce the number of people in this room to ' + capacity + ' people';

	xapi.command(
	  	'UserInterface Message Alert Display',
	  	{Title : 'Room Capacity Limit Reached',
	  	Text : (text2Display),
	  	Duration : (alertTime) }
	)
}

function checkCount(current, capacity) {
    if (capacity > 0 && current > capacity) {
        alertDisplay(capacity);
        console.log('*** There are too many people in the room. ', current);
    }
}

//Run init function to setup prerequisite configurations
init();

// Fetch current count and set feedback for change in peoplecount
xapi.status
    .get('RoomAnalytics PeopleCount')
    .then((count) => {
        var current = count.Current;
        var capacity = count.Capacity;

        console.log(`Max occupancy for this room is: ${count.Capacity}`);
        console.log(`Initial people count is: ${count.Current}`);

        checkCount(current, capacity);

        // // Listen to events
        console.log('Adding feedback listener to: RoomAnalytics PeopleCount');
        xapi.status.on('RoomAnalytics PeopleCount', (count) => {
            if (count.Capacity) {
                console.log(`Updated capacity: ` + count.Capacity);
                capacity = count.Capacity;
            } else {
                console.log(`Updated current count: ` + count.Current);
                current = count.Current;
            }
            checkCount(current, capacity);
        })
    })
    .catch((err) => {
        console.log(`Failed to fetch PeopleCount, err: ${err.message}`);
        console.log(`Are you interacting with a Room Series? exiting...`);
        xapi.close();
    });

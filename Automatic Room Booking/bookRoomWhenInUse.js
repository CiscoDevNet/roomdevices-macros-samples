// Room Booking Macro

// Contributers:
// - Susanna Moneta (smoneta@cisco.com)

// Configurations:
// - willPromptUser (true: will prompt user before booking, false: automatically booked)
// - bookOnPresence (true: will attempt to book if presence is detected,
//                   false: will attempt to book on a call or a share)

// If a room is being used this macro will book a room.

const xapi = require("xapi");

const willPromptUser = true; // true or false
const bookOnPresence = false; // true or false

var booked = true;
var willStayUnbooked = false;
var countdownTimer;
var presenceTimer = {
    timer: null, 
    isSet: false
}

function now() {
    let event = new Date();
    return event.toISOString();
}

function stayUnbooked() {
    if (!willStayUnbooked) {
        console.log("Room will be left unbooked for 10 minutes.");
        willStayUnbooked = true;
        setTimeout(function() {
            willStayUnbooked = false;
            checkPresence();
        }, 600000);
    }
}

function bookRoom() {
    xapi.command('Bookings Book',
                 {Duration: 15,
                  StartTime: now(),
                  Title: `Personal Meeting Room`})
    .catch(function(error) {
        console.log("Failed to book: " + error.message);
    });
}

function displayTimer(seconds){
    xapi.command('UserInterface Message Prompt Display',
                 {Text: `This room is in use while unreserved.<br>Booking room in ${seconds} seconds`,
                  Duration: 1,
                  FeedbackId: `countDown`,
                  'Option.1': 'Cancel'});
}

function bookAutomatically() {
    var seconds = 10;
    console.log("Displaying timer.");

    countdownTimer = setInterval(function() {
        if (seconds == 0) {
            clearInterval(countdownTimer);
            bookRoom();
        } else {
            displayTimer(seconds);
            seconds--;
        }
    }, 1000);
}

function promptUser() {
    console.log("Displaying prompt.");
    xapi.command('UserInterface Message Prompt Display',
                 {Text: `This room is not currently reserved.<br>Would you like to book this room?`,
                  FeedbackId: 'bookRoom',
                  Duration: 30,
                  'Option.1': 'Yes',
                  'Option.2': 'No'});
}

function noPresenceDetected() {
    clearTimeout(presenceTimer.timer);
    clearInterval(countdownTimer);
    presenceTimer.isSet = false;
    willStayUnbooked = false;
    console.log('No presenece detected, resetting.');
}

function presenceDetected() {
    if (!booked && !willStayUnbooked) {
            presenceTimer.timer = setTimeout(willPromptUser ? promptUser : bookAutomatically, 20000);
            presenceTimer.isSet = true;
            console.log("Presence timer started.");
    }
}

function checkBookings() {
    xapi.status.get('Bookings Current Id')
    .then((id) => {
        if (id == "" ) {
            booked = false;
        } else {
            booked = true;
            console.log("This room is already booked.");
        }
    })
    .catch(function(error) {
        console.log(`Could not receive current booking status: ${error.message}`);
    });
}

function checkPeopleCount() {
    xapi.status.get('RoomAnalytics PeopleCount Current')
    .then((count) => {
        if (count > 0) {
            console.log('Presence detected: At least one person in the room.');
            presenceDetected();
        }
    })
    .catch((err) => {
        console.log(`Failed to fetch PeopleCount, err: ${err.message}`);
        console.log(`Are you interacting with a Room Series? `);
        console.log(`Set bookOnPresence to false.`);
    });
}

function checkInteraction() {
    xapi.status.get('Conference Presentation')
    .then((presentation) => {
        if (presentation.hasOwnProperty('LocalInstance')) {
            console.log('Presence detected: active share');
            presenceDetected(); 
        }
    })
    .catch((err) => {
        console.log(`Failed to get presentation status: ${err.message}`);
    });
}

function checkPresence() {
    if (bookOnPresence) {
        checkPeopleCount();
    } else {
        checkInteraction();
    }
}

function listenForEvents() {
    xapi.event.on('UserInterface Message Prompt Response', (event) => {
        switch(event.FeedbackId) {
        case `countDown`:
            switch(event.OptionId) {
            case '1':
                clearInterval(countdownTimer);
                stayUnbooked();
                break;
            default:
                break;
            }
            break;
        case `bookRoom`:
            switch(event.OptionId) {
            case '1':
                bookRoom();
                break;
            case '2':
                stayUnbooked();
                break;
            default:
                stayUnbooked();
                break;
            }
            break;
        default:
            break;
        }
    });

    xapi.status.on('Bookings Current Id', (id) => {
        if (id == "" ) {
            booked = false;
        } else {
            booked = true;
            console.log("This room is booked.");
        }
    });

    if (bookOnPresence) {
        xapi.feedback.on('/Status/RoomAnalytics/PeopleCount/Current', (count) => {            
            if (count > 0) {
                console.log('Presence detected: At least one person in the room.');
                presenceDetected();
            } else {
                noPresenceDetected();
            }
        });
    } else {
        xapi.feedback.on('/Status/Conference/Presentation', (presentation) => {
            if (presentation.hasOwnProperty('LocalInstance')) {
                if (!presentation.LocalInstance[0].ghost) {
                    console.log('Presence detected: active share');
                    presenceDetected();
                } else {
                    noPresenceDetected();
                }
            }
        });
    }
}

function init() {
    xapi.config.set('RoomAnalytics PeopleCountOutOfCall', 'On')
      .catch((error) => { console.error(error); });
      
    listenForEvents();
    checkBookings();
    checkPresence();
}

init();

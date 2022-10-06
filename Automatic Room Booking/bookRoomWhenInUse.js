import xapi from 'xapi';

// Room Booking Macro
// Contributers:
// - Susanna Moneta (smoneta@cisco.com)
// Configurations:
// - willPromptUser (true: will prompt user before booking, false: automatically booked)
// - bookOnPresence (true: will attempt to book if presence is detected,
//                   false: will attempt to book on a call or a share)
// -debugMode (true: will be noisy with logs for debugging, false: minimal logging for normal use)
// If a room is being used this macro will book a room.

/////////////////////////////////////////////////////////////
/////// SET CONFIGURATIONS
/////////////////////////////////////////////////////////////
const willPromptUser = false;
const bookOnPresence = true;
const debug_mode = true;
/////////////////////////////////////////////////////////////

var booked = true;
var presence = false;
var stayUnbooked = false;
var bookingStatusTime = -1;
var presenceTimer;
var stayUnbookedTimer;
var autoBookingInterval;

function debug(message) {
    if (debug_mode) {
        console.log(message);
    }
}

function now() {
    let event = new Date();
    return event.toISOString();
}

function bookRoom() {
    debug("Double checking bookings.");
    xapi.status.get("Bookings Availability Status")
    .then((status) => {
        if (status == "Free" || status === "FreeUntil") {
            debug("Booking room.");
            var deltaStatusTime = bookingStatusTime - Date.now();
            if (deltaStatusTime < 0 || deltaStatusTime > 900000) {
                xapi.command("Bookings Book",
                            {Duration: 15,
                            StartTime: now(),
                            Title: "Personal Meeting Room"})
                .catch(function(error) {
                    console.log("Failed to book: " + error.message);
                });
            } else if (deltaStatusTime >= 60000) {
                var duration_minutes = Math.floor(deltaStatusTime / 60000);
                console.log(`Booking room for ${duration_minutes} minute(s)`);
                xapi.command("Bookings Book",
                            {Duration: duration_minutes,
                            StartTime: now(),
                            Title: "Personal Meeting Room"})
                .catch(function(error) {
                    console.log("Failed to book: " + error.message);
                });
            } else {
                console.log("There is a booking in less than a minute. Ignoring...");
            }
        } else {
            booked = true;
            reset();
        }
    });
}

function displayTimer(seconds){
    debug("Displaying timer with " + seconds + "seconds");

    xapi.command("UserInterface Message Prompt Display",
                 {Text: `This room is in use while unreserved.<br>Booking room in ${seconds} seconds`,
                  Duration: 1,
                  FeedbackId: "autoBooking",
                  'Option.1': "Cancel"});
}

function bookAutomatically() {
    console.log("Booking room automatically.");
    
    var seconds = 10;
    autoBookingInterval = setInterval(function() {
        debug("Booking room in " + seconds + " seconds.");
        if (seconds == 0) {
            clearInterval(autoBookingInterval);
            bookRoom();
        } else {
            displayTimer(seconds);
            seconds--;
        }
    }, 1000);
}

function promptUser() {
    console.log("Displaying prompt.")
    xapi.command('UserInterface Message Prompt Display',
                 {Text: `This room is not currently reserved.<br>Would you like to book this room?`,
                  FeedbackId: 'displayPrompt',
                  'Option.1': 'Yes',
                  'Option.2': 'No'});
}

function envokeStayUnbooked() {
    if (!stayUnbooked) {
        console.log("Room will be left unbooked for 10 minutes.");
        stayUnbooked = true;
        stayUnbookedTimer = setTimeout(function() {
            stayUnbooked = false;
            if (presence) {
                attemptBooking();
            }
        }, 600000);
    }
}

function reset() {
    debug("Resetting.");
    clearTimeout(presenceTimer);
    clearTimeout(stayUnbookedTimer);
    clearInterval(autoBookingInterval);
    stayUnbooked = false;
    xapi.command('UserInterface Message Prompt Clear', {FeedbackId: 'displayPrompt'});
}

function attemptBooking() {
    if (!stayUnbooked && !booked && presence) {
        presenceTimer = setTimeout(willPromptUser ? promptUser : bookAutomatically, 20000);
        console.log("Presence timer started. (20 seconds)");
    } else {
        if (stayUnbooked) {
            debug("Staying unbooked.");
        }
        if(booked){
            debug("Already booked.");
        }
        if(!presence) {
            debug("Presence not detected");
        }
    }
}

function updatePeopleCount(count) {
    debug("Current people count: " + count);
    if (count > 0) {
        if (!presence) {
            debug("Presence detected");
            presence = true;
            attemptBooking();
        } else {
            debug("Presence was already detected.");
        }
    } else {
        debug("No presence detected.");
        presence = false;
        reset();
    }
}

function getPresence() {
    if (bookOnPresence) {
        debug("Getting people count.");
        xapi.status.get("RoomAnalytics PeopleCount Current")
        .then((count) => {
            updatePeopleCount(count);
        })
        .catch((err) => {
            console.log(`Failed to fetch PeopleCount, err: ${err.message}`);
        });
    } else {
        debug("Getting presentation.");
        xapi.status.get("Conference Presentation")
        .then((presentation) => {
            if (presentation.hasOwnProperty('LocalInstance')) {
                if (!presence) {
                    debug("Presence detected");
                    presence = true;
                    attemptBooking();
                } else {
                    debug("Presence was already detected.");
                }
            } else {
                debug("No presence detected.");
                presence = false;
                reset();
            }
        })
        .catch((err) => {
            console.log(`Failed to fetch current presentation, err: ${err.message}`);
        });
    }
}

function getAvailabilityStatus() {
    debug("Checking if room is available.");
    xapi.status.get("Bookings Availability")
    .then((availability) => {
        if (availability.Status == "Free") {
            bookingStatusTime = -1;
            if (booked) {
                debug("Room is currently available.");
                booked = false;
                attemptBooking();
            } else {
                debug("Room was already available.");
            }
        } else if (availability.Status == "FreeUntil") {
            debug(`Free until ${availability.TimeStamp}`);
            bookingStatusTime = Date.parse(availability.TimeStamp);

            if (booked) {
                debug("Room is currently available.");
                booked = false;
                attemptBooking();
            } else {
                debug("Room was already available.");
            }
        } else {
            debug("Room is currently booked.");
            booked = true;
            reset();
        }
    })
    .catch(function(error) {
        console.log(`Could not receive current booking status: ${error.message}`);
    });
}

function startEventListener() {
    debug("Event listeners started.");

    xapi.status.on("Bookings Availability", getAvailabilityStatus);
    
    if (willPromptUser) {
        xapi.event.on("UserInterface Message Prompt Response", (event) => {
            debug("Prompt response event detected.");
            switch(event.FeedbackId) {
            case "displayPrompt":
                switch (event.OptionId) {
                case '1':
                    debug("Detected response: Booking prompt accepted.");
                    bookRoom();
                    break;
                case '2':
                    debug("Detected response: Booking prompt declined.");
                    envokeStayUnbooked();
                    break;
                default:
                    break;
                }
                break;
            default:
                break;
            }
        });
    } else {
        xapi.event.on("UserInterface Message Prompt Response", (event) => {
            debug("Automatic booking response event detected.")
            switch(event.FeedbackId) {
            case "autoBooking":
                switch (event.OptionId) {
                case '1':
                    debug("Detected response: Automatic booking canceled.");
                    clearInterval(autoBookingInterval);
                    envokeStayUnbooked();
                    break;
                default:
                    break;
                }
            default:
                break;
            }
        });
    }

    if (bookOnPresence) {
        xapi.status.on("RoomAnalytics PeopleCount Current", (count) => {
            updatePeopleCount(count);
        });
    } else {
        xapi.status.on("Conference Presentation", (presentation) => {
            if (presentation.hasOwnProperty('LocalInstance')) {
                if (!presentation.LocalInstance[0].ghost) {
                    if (!presence) {
                        debug("Presence detected");
                        presence = true;
                        attemptBooking();
                    } else {
                        debug("Presence was already detected.");
                    }
                } else {
                    debug("No presence detected.");
                    presence = false;
                    reset();
                }
            }
        });
    }
}

function init() {
    debug("Initializing.")

    //Set required configuration for People Count
    xapi.config.set('RoomAnalytics PeopleCountOutOfCall', 'On')
      .catch((error) => { console.error(error); });

    startEventListener();
    getAvailabilityStatus();
    getPresence();
}

init();

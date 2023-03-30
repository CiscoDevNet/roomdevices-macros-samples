import xapi from 'xapi';

const Sunday = 0, Saturday = 6;


const ScheduleTime = '10:00';  // Set this to the time you want to have the device do something

const SchedulerDialNumber = 'mydailymeetingnumber@mydomain.com'; //The number/URL you want the device to call at schedule


function schedule(time, action) {
    let [alarmH, alarmM] = time.replace('.', ':').split(':');
    let now = new Date();
    now = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
//    print("Time now:" + now);
    let difference = parseInt(alarmH) * 3600 + parseInt(alarmM) * 60 - now;
    if (difference <= 0) difference += 24 * 3600;

    return setTimeout(action, difference * 1000);
}


function dialStandup() {
    const weekDay = new Date().getDay();
    if (weekDay !== Sunday && weekDay !== Saturday) {
        xapi.command('Dial', { Number: SchedulerDialNumber });
    }

    schedule(ScheduleTime, dialStandup); // schedule it for the next day
}



schedule(ScheduleTime, dialStandup);

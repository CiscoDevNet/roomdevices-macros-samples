/**
 * Library that makes it easy to schedule jobs for certain times of the day.
 * Time is specified in 24 h clock, like '11:30'
 * 
 * todo: support am/pm
 * validate inputs
 */

function isWeekend() {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

function schedule(time, action) {
    let [hour, minute] = time.replace('.', ':').split(':').map(i => Number(i));
    if (isNaN(hour) || isNaN(minute)) {
      throw new Error('Not able to parse time');
    }
    let now = new Date();
    now = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    let difference = parseInt(hour) * 3600 + parseInt(minute) * 60 - now;
    if (difference <= 0) difference += 24 * 3600;

    const h = Math.floor(difference / 3600);
    const m = Math.floor((difference / 60) % 60);
    const s = Math.floor(difference % 60);
    console.log(time, ': fire in', h, 'hours', m, 'min', s, 'sec');

    return setTimeout(action, difference * 1000);
}

function scheduleDaily(time, action, onlyWeekdays = false) {
  schedule(time, () => {
    if (!onlyWeekdays || !isWeekend()) {
      action();
    }
    scheduleDaily(time, action, onlyWeekdays); // schedule for next day too
  });
}

module.exports = { schedule, scheduleDaily };

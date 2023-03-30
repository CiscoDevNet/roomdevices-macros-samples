/**
 * Library that makes it easy to schedule jobs for certain times of the day.
 * Time is specified in 24 h clock, like '11:30'
 *
 * todo: support am/pm
 */

 function isWeekend() {
  const day = new Date().getDay();
  return day === 0 || day === 6;
}

function parseTime(time) {
    let [hour, minute] = time.replace('.', ':').split(':').map(i => Number(i));
    const valid = !isNaN(hour) && !isNaN(minute) && hour >= 0 && hour < 24 && minute >= 0 && minute < 60;
    if (!valid) throw new Error('Not able to parse time. Expected format: HH:mm (24 hour clock)');
    return [hour, minute];
}

/**
 * Check if the given time is before current time
 * @param time Time in HH:mm format
 */
function isBeforeNow(time) {
  const [h, m] = parseTime(time);
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  if (hour === h) return m < minute;
  return h < hour;
}

class Scheduler {

  /**
   * Schedule a one time action at a certain time. if time is in the past, schedule tomorrow
   */
  schedule(time, action) {
      let [hour, minute] = parseTime(time);
      let now = new Date();
      now = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

      let difference = parseInt(hour) * 3600 + parseInt(minute) * 60 - now;
      if (difference <= 0) difference += 24 * 3600;

      const h = Math.floor(difference / 3600);
      const m = Math.floor((difference / 60) % 60);
      const s = Math.floor(difference % 60);
      console.log(time, ': fire in', h, 'hours', m, 'min', s, 'sec');

      this.timerId = setTimeout(action, difference * 1000);
  }

  scheduleDaily(time, action, onlyWeekdays = false) {
    this.schedule(time, () => {
      if (!onlyWeekdays || !isWeekend()) {
        action();
      }
      this.scheduleDaily(time, action, onlyWeekdays); // schedule for next day too
    });
  }
  cancel() {
    // console.log('cancel timer', this.timerId);
    clearTimeout(this.timerId);
  }
}

export { Scheduler, parseTime, isBeforeNow, isWeekend };

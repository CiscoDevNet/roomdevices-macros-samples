/**
 * Changes signage between different URLs at regular interval
 * Eg show news, weather, company info, vacation schedules, traffic etc
 */
import xapi from 'xapi';

const urls = [
  'https://random.dog/',
  'https://xkcd.com/now/',
  'https://cisco.com',
];

let currentIndex = -1;
const secondsPerUrl = 20;

async function setSignage(url) {
  try {
    await xapi.Config.Standby.Signage.Url.set(url);
  }
  catch(e) {
    console.warn('Not able to set signage URL');
  }
}

function next() {
  currentIndex++;
  if (currentIndex >= urls.length) {
    currentIndex = 0;
  }

  const url = urls[currentIndex];
  setSignage(url);
}

function init() {
  xapi.Config.Standby.Signage.Mode.set('On');
  setInterval(next, secondsPerUrl * 1000);
}

init();

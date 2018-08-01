/* An adjustable meeting timer that can be started from the touch panel
 * in the meeting room. Shows a timer on the main screen that counts down
 * until zero, then plays a notification sound.
 */
const xapi = require('xapi');

let startTime = -1; // minutes
let timeLeft = 0; // seconds
let timer = 0;

const Sound = 'CallWaiting';
const ButtonPreset = 'timer_quick_options';

const EndMessages = [
  'Time\'s up, dude!',
  'Time just flew by, didn\'t it?',
  'So... What\'s next?',
  'OK that\'s it',
];

const IdleMsg = 'Press number to start timer, see counter on main screen. Press same number to stop.';
const TxtId = 'timer_text';

function showMsg(text, duration = 5) {
  xapi.command('UserInterface Message TextLine Display', {
    Text: text,
    Duration: duration,
    X: 9000,
    Y:500
  });
}

function showAlert(title, text, duration = 5) {
  xapi.command('UserInterface Message Alert Display', {
    Title: title,
    Text: text,
    Duration: duration,
  });
}

function clearScreen() {
  xapi.command('UserInterface Message TextLine Clear');
}


function formatTime(time) {
  let min = Math.floor(time / 60);
  if (min < 10) min = `0${min}`;
  let sec = time % 60;
  if (sec < 10) sec = `0${sec}`;
  return `${min}:${sec}`;
}

function playSound() {
  xapi.command('Audio Sound Play', { Sound });
  setTimeout(() => xapi.command('Audio Sound Stop'), 8000);
}


function stopTimer() {
  clearTimeout(timer);
  timer = 0;
}

function timerFinished() {
  cancel();
  playSound();
  setTimeout(() => playSound(), 2000); // play twice
  const msg = EndMessages[ Math.floor(Math.random() * EndMessages.length) ];
  showAlert('00:00', msg, 30, 2);
  xapi.command('UserInterface Extensions Widget UnsetValue', { WidgetId: ButtonPreset });
}

function showTime() {
  const text = `Time left: ${formatTime(timeLeft)} s`;
  showMsg(text, 2);
  setWidgetValue(TxtId, text);
}

function tick() {
  
  if (timeLeft < 0) timerFinished();
  else{
    timer = setTimeout(tick, 1000);
    showTime();
  }
  timeLeft--;
}

function startTimer() {
  showTime();
  tick();
}

function setWidgetValue(widgetId, value) {
  xapi.command('UserInterface Extensions Widget SetValue', {
    WidgetId: widgetId,
    Value: value,
  }).catch(() => {}); // will fail for most timer_quick_option values
}

function start(minutes) {
  cancel();
  startTime = Math.max(1, parseInt(minutes));
  timeLeft = startTime * 60;
  setWidgetValue(ButtonPreset, startTime);
  startTimer();
}

function cancel() {
  console.log('cancel');
  clearScreen();
  stopTimer();
  xapi.command('UserInterface Extensions Widget UnsetValue', { WidgetId: ButtonPreset });
  setWidgetValue(TxtId, IdleMsg);
  startTime = -1;
}

function onGuiEvent(e) {
  if (e.Type !== 'released' || e.WidgetId !== ButtonPreset) return;
  if (parseInt(e.Value) === startTime || e.Value === 0) cancel();
  else start(e.Value);
}

function setupGui() {
  xapi.event.on('UserInterface Extensions Widget Action', onGuiEvent);
  xapi.command('UserInterface Extensions Widget UnsetValue', { WidgetId: ButtonPreset });
  setWidgetValue(TxtId, IdleMsg);
}

setupGui();

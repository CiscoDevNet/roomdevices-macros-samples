const xapi = require('xapi');

let startTime = -1; // minutes
let timeLeft = 0; // seconds
let timer = 0;

const Sound = 'CallWaiting';

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
  const msg =  'Time is up!';
  showAlert('00:00', msg, 30, 2);
}

function showTime() {
  const text = `Time left of scheduled meeting: ${formatTime(timeLeft)}`;
  showMsg(text, 2);
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


function start(seconds) {
  cancel();
  startTime = Math.max(1, parseInt(seconds));
  timeLeft = startTime;
  startTimer();
}

function cancel() {
  console.log('cancel');
  clearScreen();
  stopTimer();
  startTime = -1;
}

function onGuiEvent(e) {
  if (e.Type !== 'released' || e.WidgetId !== ButtonPreset) return;
  if (parseInt(e.Value) === startTime || e.Value === 0) cancel();
  else start(e.Value);
}

xapi.Event.Bookings.TimeRemaining.on(event => {
  start(event.Seconds);
})


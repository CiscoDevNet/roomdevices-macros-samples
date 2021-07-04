const xapi = require('xapi');

const PIN_CODE = '1234';

function askForPin(text = 'Enter PIN code') {
  xapi.command('UserInterface Message TextInput Display', {
    FeedbackId: 'pin-code',
    Text: text,
    InputType: 'PIN',
    Placeholder: ' ',
    Duration: 0,
  });
}

function onResponse(code) {
  console.log('try pin', code);
  if (code === PIN_CODE)
  {
    console.log('pin correct');
    xapi.config.set('UserInterface Features HideAll', 'False');
  }
  else {
    console.log('pin failed');
    askForPin('Incorrect PIN, try again');
  }
}

function listenToEvents() {
  xapi.event.on('UserInterface Message TextInput Response', (event) => {
    if (event.FeedbackId === 'pin-code')
      onResponse(event.Text);
  });
  xapi.event.on('UserInterface Message TextInput Clear', (event) => {
    if (event.FeedbackId === 'pin-code') {
      xapi.command('Standby Halfwake');
    }
  });
  xapi.status.on('Standby State', (state) => {
    if (state === 'Off') {
      xapi.config.set('UserInterface Features HideAll', 'True');
      askForPin();
    }
  });
}

listenToEvents();

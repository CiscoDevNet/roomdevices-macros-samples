// child safe end call slider
const xapi = require('xapi');

function guiEvent(e) {
  if (e.WidgetId === 'end-call' && e.Type === 'released' && e.Value > 225) {
    xapi.command('Call Disconnect');
    xapi.command('UserInterface Extensions Panel Close');
    // reset slider for next time:
    xapi.command('UserInterface Extensions Widget SetValue', { WidgetId: 'end-call', Value: 0 });
  }
}

function alert(title, text = '', duration = 5) {
  xapi.command('UserInterface Message Alert Display', {
    Title: title,
    Text: text,
    Duration: duration,
  });
}

function setEndCallVisible(visible) {
  xapi.config.set('UserInterface Features Call End', visible ? 'Auto' : 'Hidden');
}

function init() {
  xapi.config.set('UserInterface Features Call End', 'Auto');
  xapi.event.on('UserInterface Extensions Widget Action', guiEvent);

  // prevent mute in call (child safety)
  xapi.status.on('Audio Microphones Mute', val => {
    if (val === 'On') {
      xapi.command('Audio Microphones Unmute');
      alert('Mute is disabled by a child safety macro.');
    }
  });

  // we turn on/off the hide end button each time we start/stop the call, so if the macro is removed
  // the end call is always showing again
  xapi.Status.Call.on((e) => {
    if (new Date().getHours() >= 19) return; // kids are sleeping anyways

    xapi.Status.Call.get()
      .then((list) => {
        const inCall = list.length > 0;
        setEndCallVisible(!inCall);
      });
  })
}

init();
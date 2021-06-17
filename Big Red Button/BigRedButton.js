import xapi from 'xapi';

const action = 'toggleMute';

function toggleMute() {
  xapi.Command.Audio.Microphones.ToggleMute();
}

async function toggleHalfwake() {
  const state = await xapi.Status.Standby.State.get();
  if (state === 'Halfwake') {
    xapi.Command.Standby.Deactivate();
  }
  else {
    xapi.Command.Standby.Halfwake();
  }
}

async function onKey({ Key, Type }) {
  if (Type !== 'Released') return;

  if (Key === 'KEY_SPACE') {
    console.log('go!');
    const calls = await xapi.Status.Call.get();
    const inCall = calls.length > 0;
    if (inCall) {
      if (action === 'toggleMute') {
        toggleMute();
      }
      else if (action === 'endCall') {
        xapi.Command.Call.Disconnect();
      }
    }
    else {
      toggleHalfwake();
    }
  }
}

function init() {
  xapi.Config.Peripherals.InputDevice.Mode.set('On')
    .catch(() => console.error('Looks like your device doesnt support USB peripherals'));
  xapi.Event.UserInterface.InputDevice.Key.Action
    .on(onKey);
}

init();

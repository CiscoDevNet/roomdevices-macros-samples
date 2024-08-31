/**
 * Macro that ensures a Sennheiser mic shows the same mute indicator as a Cisco video device during a call.
 *
 * When the device is out of call, then mute indicator is turned off.
 *
 * If the macro at any point is unable to indicate the correct status on the Sennheiser mic,
 * it will display a prominent warning about this on the main video screen.
 */
import xapi from 'xapi';
import Sennheiser from './sennheiser-lib'

// You must update these yourself:

const ip = '169.254.1.246'
const username = 'api'
const password = 'xxx'

const mic = new Sennheiser(ip, username, password)

function showSyncWarning() {
  xapi.Command.UserInterface.Message.TextLine.Display({
    Text: '🚨 Warning: Microphone mute indicator might be wrong. 🚨',
    X: 5000,
    Y: 5000,
  })
}

function hideSyncWarning() {
  xapi.Command.UserInterface.Message.TextLine.Clear()
}

async function syncWithMute() {
  const onOff = await xapi.Status.Audio.Microphones.Mute.get()
  const muted = onOff == 'On'
  try {
    await mic.setLed(muted)
    hideSyncWarning()
  }
  catch(e) {
    console.error(e)
    showSyncWarning()
  }
}

async function syncWithCalls() {
  const numberOfCalls = await xapi.Status.SystemUnit.State.NumberOfActiveCalls.get()
  const brightness = (numberOfCalls > 0) ? 5 : 0
  try {
    await mic.setBrightness(brightness)
    hideSyncWarning()
  }
  catch(e) {
    console.error(e)
    showSyncWarning()
  }
}

function init() {
  // Required for the video device to talk http to the mic
  xapi.Config.HttpClient.Mode.set('On')
  xapi.Config.HttpClient.AllowInsecureHTTPS.set('True')

  // Sync when macro starts:
  syncWithMute()
  syncWithCalls()

  // Sync whenever incall or mute changes
  xapi.Status.Audio.Microphones.Mute.on(syncWithMute)
  xapi.Status.SystemUnit.State.NumberOfActiveCalls.on(syncWithCalls)
}

init()

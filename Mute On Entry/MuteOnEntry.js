/**
 * Automatically mutes the device whenever a new call is started.
 * @author Tore Bjolseth @ cisco.com 2025
 */
import xapi from 'xapi'

let wasInCall = false
const muteVideo = false

function alert(text, duration = 2) {
  xapi.Command.UserInterface.Message.Alert.Display({
    Text: text,
    Duration: duration,
  })
}

async function callsChanged() {
  const inCall = Number(await xapi.Status.SystemUnit.State.NumberOfActiveCalls.get())
  // detect new call
  if (!wasInCall && inCall) {
    try {
      xapi.Command.Audio.Microphones.Mute()
      if (muteVideo) {
        xapi.Command.Video.Input.MainVideo.Mute()
      }
      alert('🤫 You have been automatically muted')
    }
    catch(e) {
      console.error(e)
    }
  }

  wasInCall = inCall
}

function init() {
  xapi.Status.SystemUnit.State.NumberOfActiveCalls.on(callsChanged)
}

init()

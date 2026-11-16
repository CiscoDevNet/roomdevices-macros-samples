/**
 * Automatically mutes the device whenever a new call is started.
 * @author Tore Bjolseth @ cisco.com 2025
 */
import xapi from 'xapi'

// minimum number of participants already in meeting for auto-mute to happen
const minParticipants = 10

// whether to video mute too
const muteVideo = true;


let wasInCall = false

function alert(text, duration = 2) {
  xapi.Command.UserInterface.Message.Alert.Display({
    Text: text,
    Duration: duration,
  })
}

async function countParticipants() {
  const list = await xapi.Command.Conference.ParticipantList.Search()
  // dont count laptops that are paired with a video device
  return list?.Participant?.filter(p => p?.Status !== 'observer')?.length || 0
}

async function callsChanged() {
  const inCall = Number(await xapi.Status.SystemUnit.State.NumberOfActiveCalls.get())
  // detect new call
  if (!wasInCall && inCall) {
    const count = await countParticipants()
    if (count < minParticipants) return
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
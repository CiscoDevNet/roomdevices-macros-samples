/**
 * Let's you mute/umute yourself from the home screen, without being in a call, so you dont have to
 * remember muting after you have joined.
 * 
 * Button changes color and text depending on mute state.
 * 
 * If you want to stay muted after end of call,
 * see(https://roomos.cisco.com/xapi/Configuration.Conference.MicUnmuteOnDisconnect.Mode/)
 * 
 * Author: Tore Bjolseth @ Cisco
 */
import xapi from 'xapi';

const PanelId = 'soft-mute'
const green = '#148579'
const red = '#d43b52'

function toggleMute() {
  xapi.Command.Audio.Microphones.ToggleMute()
}

async function muteChanged() {
  const value = await xapi.Status.Audio.Microphones.Mute.get()
  const muted = value === 'On'
  const Color = muted ? red : green
  const Name = muted ? 'Muted' : 'Not muted'

  try {
    xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId, Color, Name })
  }
  catch(e) {
    console.warn(e)
  }
}

function init() {
  xapi.Status.Audio.Microphones.Mute.on(muteChanged)

  // make sure it's correct when macro starts
  muteChanged()

  xapi.Event.UserInterface.Extensions.Panel.Clicked.on(e => {
    console.log(e)
    if (e.PanelId === PanelId) {
      toggleMute()
    }
  })
}

init()


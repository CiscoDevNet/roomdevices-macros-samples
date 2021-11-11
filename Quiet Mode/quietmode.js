/**
 * Extension that enables/disables quiet mode at office hours.
 * Typically useful for home office devices.
 *
 * Inspired by work of Sebastian Olsson
 * @author Tore Bjolseth tbjolset@cisco.com
 */


// TODO:
// possibility to set hours from device

import xapi from 'xapi';
import { scheduleDaily, isBeforeNow, isWeekend } from './schedule';

// When the device activates in the morning
const dayStart = '07:55';

// When the device deactivates in the evening
const dayEnd = '17:05';

const standbyDelayNormal = 10;
const standbyDelayDoNotDisturb = 1;

// This will power down the device completely. This renders most of the other settings useless
const turnOffCompletely = false;

// Disable all the default productity apps (Call, Whiteboard, ...)
const toggleHomeScreenButtons = false;
const toggleWakeOnMotion = true;
const toggleUltrasound = true;
const toggleSoundEffects = true;
const toggleAssistant = true;
const toggleBrightness = true;
const toggleStandbyDelay = true;

// Which image to use in quiet mode. leave empty for none
const backgroundUrl = 'https://images.unsplash.com/photo-1620503374956-c942862f0372?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=2670&q=80&t=abstract';

const panelId = 'quietmode';

async function isBusy() {
  const calls = await xapi.Status.SystemUnit.State.NumberOfActiveCalls.get();
  return calls > 0;
}

async function setQuietMode(on) {
  console.log('set quiet mode', on);

  const busy = await isBusy();
  if (busy) {
    return;
  }

  xapi.Command.UserInterface.Extensions.Widget.SetValue({ Value: on ? 'on' : 'off', WidgetId: 'quiet-mode' });

  const msg = !on
    ? 'Disabling quiet mode.'
    : 'Enabling quiet mode. Time to chill!';

  if (on && turnOffCompletely) {
    const warningTime = 10;
    const info = 'Shutting down device soon.<br>Power on with the button behind the screen.';
    xapi.Command.UserInterface.Message.Alert.Display({ Text: info, Duration: warningTime });
    setTimeout(() => xapi.Command.SystemUnit.Boot( { Action: 'Shutdown' }), warningTime * 1000);
    return;
  }

  xapi.Command.UserInterface.Message.Alert.Display({ Text: msg, Duration: 5 });

  if (on) {
    xapi.Command.Conference.DoNotDisturb.Activate();
    if (backgroundUrl) {
      console.log('set wallpaper', backgroundUrl);
      xapi.Command.UserInterface.Branding.Fetch({ Type: 'Background', URL: backgroundUrl })
        .catch(() => console.warn('Not able to set wallpaper'));
    }
    xapi.Config.Video.Selfview.Default.Mode.set('Off');
  }
  else {
    xapi.Command.Conference.DoNotDisturb.Deactivate();
    if (backgroundUrl) {
      xapi.Command.UserInterface.Branding.Clear();
    }
  }

  if (toggleWakeOnMotion) {
    xapi.Config.Standby.WakeupOnMotionDetection.set(on ? 'Off' : 'On');
  }
  if (toggleSoundEffects) {
    xapi.Config.UserInterface.SoundEffects.Mode.set(on ? 'Off' : 'On');
  }
  if (toggleAssistant) {
    xapi.Config.UserInterface.Assistant.Mode.set(on ? 'Off' : 'On');
  }
  if (toggleHomeScreenButtons) {
    xapi.Config.UserInterface.Features.HideAll.set(on ? 'True' : 'False');
  }
  if (toggleUltrasound) {
    xapi.Config.Audio.Ultrasound.MaxVolume.set(on ? 0 : 70);
  }
  if (toggleStandbyDelay) {
    xapi.Config.Standby.Delay.set(on ? standbyDelayDoNotDisturb : standbyDelayNormal);
  }
  // for some weird reason, parts of the api is not public yet
  // if (toggleBrightness) {
  //   xapi.Config.Video.Output.Connector[1].BrightnessMode.set(value)
  //   .catch(() => console.warn('Device cannot adjust brightness'));
  // }
}

async function widgetAction(evt) {
  const { WidgetId, Value, Type } = evt;
  console.log(evt);
  if (WidgetId === 'quiet-mode' && Type === 'released') {
    const on = Value === 'on';
    setQuietMode(on);
  }
}

function init() {
  scheduleDaily(dayStart, () => setQuietMode(false), false);
  scheduleDaily(dayEnd, () => setQuietMode(true), false);
  xapi.Event.UserInterface.Extensions.Widget.Action.on(widgetAction);

  // on boot, check whether to toggle mode
  const isOfficeHoursNow = !isWeekend() && isBeforeNow(dayStart) && !isBeforeNow(dayEnd);
  console.log('boot: set do not disturb', isOfficeHoursNow);
  setQuietMode(!isOfficeHoursNow);
}

init();

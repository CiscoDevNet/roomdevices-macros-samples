/**
 * Extension that enables/disables quiet mode at office hours.
 * Typically useful for home office devices.
 *
 * Inspired by work of Sebastian Olsson
 * @author Tore Bjolseth tbjolset@cisco.com
 */

let userSettings = {
  // Whether or not we will use the times below to automatically start/stop quiet mode
  useSchedule: true,

  // When the device activates in the morning
  dayStart: '08:00',

  // When the device deactivates in the evening
  dayEnd: '17:00',

  photoFrame: false,
}

const photoFrameUrl = 'https://webexframe.netlify.app/';

// How many minutes it takes before we go to standby during office hours
const standbyDelayNormal = 10;

// How many minutes it takes before we go to standby after work hours
const standbyDelayDoNotDisturb = 2;

// This will power down the device completely instead of donotdisturb. This renders most of the other settings useless
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
const backgroundUrl = '';




// -------------------------------------------------------------------------------
// Internal code - feel free to change if you feel like it
// -------------------------------------------------------------------------------

import xapi from 'xapi';
import { Scheduler, isBeforeNow, isWeekend } from './schedule';


const timerDayStart = new Scheduler();
const timerDayEnd = new Scheduler();
let lastStandbyState = '';

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
    if (backgroundUrl && !userSettings.photoFrame) {
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
  if (toggleStandbyDelay && !userSettings.photoFrame) {
    xapi.Config.Standby.Delay.set(on ? standbyDelayDoNotDisturb : standbyDelayNormal);
  }
  // for some weird reason, parts of the api is not public yet
  // if (toggleBrightness) {
  //   xapi.Config.Video.Output.Connector[1].BrightnessMode.set(value)
  //   .catch(() => console.warn('Device cannot adjust brightness'));
  // }
}

function changeTime(dateTime, change) {
  const parts = dateTime.split(':');
  const time = parseInt(parts[0]) + change;
  return Math.max(0, Math.min(time, 23)) + ':' + parts[1];
}

function setWidgetValue(WidgetId, Value) {
  xapi.Command.UserInterface.Extensions.Widget.SetValue({ WidgetId, Value })
    .catch(() => console.warn('Unable to set widget value', WidgetId));
}

async function widgetAction(evt) {
  const { WidgetId, Value, Type } = evt;
  // console.log(evt);
  if (WidgetId === 'quiet-mode' && Type === 'released') {
    const on = Value === 'on';
    setQuietMode(on);
  }
  else if (WidgetId === 'quietmodestart' && Type === 'released') {
    if (!userSettings.useSchedule) return;
    const change = Value === 'increment' ? +1 : -1;
    userSettings.dayStart = changeTime(userSettings.dayStart, change);
    onSettingsChanged();
    save(userSettings);
  }
  else if (WidgetId === 'quietmodeend' && Type === 'released') {
    if (!userSettings.useSchedule) return;
    const change = Value === 'increment' ? +1 : -1;
    userSettings.dayEnd = changeTime(userSettings.dayEnd, change);
    onSettingsChanged();
    save(userSettings);
  }
  else if (WidgetId === 'quietmodescheduled' && Type === 'changed') {
    userSettings.useSchedule = Value === 'on';
    onSettingsChanged();
    save(userSettings);
  }
  else if (WidgetId === 'quietmode-screensaver' && Type === 'changed') {
    const on = Value === 'on';
    try {
      if (on) {
        await xapi.Command.UserInterface.Branding.Clear();
        await xapi.Config.Standby.Signage.Mode.set('On');
        await xapi.Config.Standby.Signage.Url.set(photoFrameUrl);
        await xapi.Config.Standby.Signage.InteractionMode.set('Interactive');
        await xapi.Config.Standby.Delay.set(standbyDelayNormal);
        userSettings.photoFrame = true;
      }
      else {
        await xapi.Config.Standby.Signage.Mode.set('Off');
        userSettings.photoFrame = false;
      }
      save(userSettings);
    }
    catch(e) {
      console.warn(e);
      xapi.Command.UserInterface.Message.Alert.Display({
        Text: 'Not able to toggle - does your device support web content?', Duration: 5,
      });
    }
  }
  else if (WidgetId === 'quietmode-halfwake') {
    xapi.Command.Standby.Halfwake();
  }
}

function onSettingsChanged() {
    const scheduled = userSettings.useSchedule;
    setWidgetValue('quietmodestart', scheduled ? userSettings.dayStart : '-');
    setWidgetValue('quietmodeend', scheduled ? userSettings.dayEnd : '-');
    setWidgetValue('quietmodescheduled', scheduled ? 'on' : 'off');
    setWidgetValue('quietmode-screensaver', userSettings.photoFrame ? 'on' : 'off');
    schedule();
}

async function save(prefs) {
  let json = JSON.stringify(prefs).replace(/"/g, '§'); // xapi doesnt like "
  return xapi.Config.FacilityService.Service[5].Name.set(json);
}

async function load(defaults) {
  const json = await xapi.Config.FacilityService.Service[5].Name.get();
  try {
    return JSON.parse(json.replace(/§/g, '"'));
  }
  catch(e) {
    return defaults;
  }
}

function schedule() {
  timerDayStart.cancel();
  timerDayEnd.cancel();
  if (userSettings.useSchedule) {
    timerDayStart.scheduleDaily(userSettings.dayStart, () => setQuietMode(false), true);
    timerDayEnd.scheduleDaily(userSettings.dayEnd, () => setQuietMode(true), true);
  }
}

// if coming from standby, go to photo frame if on
function onStandbyChanged(state) {
  if (userSettings.photoFrame && lastStandbyState === 'Standby' && state === 'Off') {
    xapi.Command.Standby.Halfwake();
  }
  lastStandbyState = state;
}

async function init() {
  userSettings = await load(userSettings);
  onSettingsChanged();

  xapi.Event.UserInterface.Extensions.Widget.Action.on(widgetAction);

  // on boot, check whether to toggle mode
  const isOfficeHoursNow = !isWeekend() && isBeforeNow(userSettings.dayStart) && !isBeforeNow(userSettings.dayEnd);
  setQuietMode(!isOfficeHoursNow);

  // bug in ui extensions: need to make widgets update properly
  xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: 'quietmode', Color: '#1D805E' });

  // detect when exiting standy
  xapi.Status.Standby.State.on(onStandbyChanged);
}

init();

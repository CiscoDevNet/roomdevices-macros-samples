/**
 * Automatically update your Webex user status if the device is
 * being actively used in office hours. The duration is set to 8 hours by
 * default, after that the status is automatically cleared.
 *
 * Specify the status text for this device
 * (eg "in office", "working from home" etc) and the
 * working hours below
 *
 * @author Tore Bjolseth (Device Technology Group, Cisco Norway)
 */
import xapi from 'xapi';

const deviceStatus = '🏰 In office today';
const startHour = 8;
const endHour = 16;
const askBeforeChanging = true;
const durationHours = 8;
const minActiveMinutes = 10;
let timerId;

// If false, don't update status if one is already set (eg a holiday status)
const overrideExisting = false;

let lastPromptTime;

const prompt = {
  Title: 'Looks like you are using this device',
  Text: `Set your status to '${deviceStatus}'?`,
  Duration: 600,
  FeedbackId: 'prompt-change-status',
  'Option.1': 'Yes',
  'Option.2': 'No',
};

function alert(Title, Text, Duration = 5) {
  xapi.Command.UserInterface.Message.Alert.Display({
    Title, Text, Duration,
  });
}

function getStatus() {
  return xapi.Status.Webex.Services.UserPresence.CustomStatus.get();
}

function onResponse(e) {
  if (e.FeedbackId !== prompt.FeedbackId) {
    return;
  }
  if (e.OptionId == 1) {
    const minutes = 60 * durationHours;
    setStatus(deviceStatus, minutes);
  }
}

function setStatus(status, minutes) {
  try {
    xapi.Command.UserPresence.CustomStatus.Set({ Status: status, Timeout: minutes });
    console.log('update status to', status, 'for minutes', minutes);
    alert(`User status was automatically set`, `New status: ${status}`, 5);
  }
  catch(e) {
    console.warn('User presence api not available');
    alert('Not able to set user status', '', 5);
  }
}

function promptSetStatus() {
  const now = new Date().toDateString();
  if (askBeforeChanging) {
    if (now !== lastPromptTime) {
      xapi.Command.UserInterface.Message.Prompt.Display(prompt);
      lastPromptTime = now;
    }
  }
  else {
    const minutes = 60 * durationHours;
    setStatus(deviceStatus, minutes);
  }
}

async function checkAndUpdateStatus() {
  try {
    const status = await getStatus();
    if (status && !overrideExisting) {
      console.log('dont override existing state');
      return;
    }

    const standbyState = await xapi.Status.Standby.State.get();
    const isActive = standbyState === 'Off';
    const now = new Date();
    const hour = now.getHours();
    const isWeekDay = now.getDay() !== 0 && now.getDay() !== 6;
    const officeHours = hour >= startHour && hour < endHour;
    if (isActive && isWeekDay && officeHours && deviceStatus && status !== deviceStatus) {
      promptSetStatus();
    }
  }
  catch(e) {
    console.error('User presence api not available?');
    console.log(e.toString());
  }
}

function onStandbyChanged(state) {
  clearTimeout(timerId);
  if (state === 'Off') {
    timerId = setTimeout(checkAndUpdateStatus, minActiveMinutes * 60 * 1000);
  }
}

function init() {
  xapi.Status.Standby.State.on(onStandbyChanged);
  xapi.Event.UserInterface.Message.Prompt.Response.on(onResponse);
}

init();

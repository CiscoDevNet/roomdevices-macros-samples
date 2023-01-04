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

const deviceStatus = '🏠 Working From Home';
const startHour = 7;
const endHour = 17;
const durationHours = 8;
const pollIntervalMinutes = 5;

function alert(Title, Text, Duration = 5) {
  xapi.Command.UserInterface.Message.Alert.Display({
    Title, Text, Duration,
  });
}

function getStatus() {
  return xapi.Status.Webex.Services.UserPresence.CustomStatus.get();
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
  // TODO prompt before setting?
  const minutes = 60 * durationHours;
  setStatus(deviceStatus, minutes);
}

async function checkAndUpdateStatus() {
  try {
    const standbyState = await xapi.Status.Standby.State.get();
    const isActive = standbyState === 'Off';
    const status = await getStatus();
    const now = new Date();
    const hour = now.getHours();
    const isWeekDay = now.getDay() !== 0 && now.getDay() !== 6;
    const officeHours = hour >= startHour && hour < endHour;
    if (isActive && isWeekDay && officeHours && status && status !== deviceStatus) {
      promptSetStatus();
    }
  }
  catch(e) {
    console.error('User presence api not available?');
    console.log(e);
  }
}

function init() {
  // dont check right away, we dont want to update if the device woke up by itself
  setInterval(checkAndUpdateStatus, 1000 * 60 * pollIntervalMinutes);
}

init();
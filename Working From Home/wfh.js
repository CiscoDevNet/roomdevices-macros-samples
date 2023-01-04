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

const deviceStatus = '🏠 Working From Home'; // 'In the Office';
const startHour = 8;
const endHour = 16;
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
    const hour = new Date().getHours();
    const officeHours = hour >= startHour && hour < endHour;
    if (isActive && officeHours && status && status !== deviceStatus) {
      promptSetStatus();
    }
  }
  catch(e) {
    console.log('User presence api not available');
  }
}

function init() {
  // dont check right away, we dont want to update if the device woke up by itself
  setInterval(checkAndUpdateStatus, 1000 * 60 * pollIntervalMinutes);
}

init();
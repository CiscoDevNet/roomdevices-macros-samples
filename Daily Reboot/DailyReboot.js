const xapi = require('xapi');

//Define hour and minute for boot every day (device time)
const hourBoot = 21; // 0-23
const minuteBoot = 0; // 0-59

function rebootTimer() {

  const now = new Date();
  const targetRebootTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hourBoot, minuteBoot, 0, 0);
  const timeUntilBoot = targetRebootTime - now;

  if (timeUntilBoot > 0) { // Test boot time if its upcoming or in the past

    setTimeout(readyForBoot, timeUntilBoot);
    console.log('Setting reboot timer for defined time of day... (Daily reboot scheduler macro)');

  } else { // If time has passed this day, set targetRebootTime for tomorrow

    targetRebootTime.setDate(targetRebootTime.getDate() + 1);

    const nextBootTime = targetRebootTime - now;

    setTimeout(readyForBoot, nextBootTime);

    console.log('Defined time of day is in the past, setting next reboot timer for tomorrow... (Daily Reboot scheduler macro)');

  }
}

async function readyForBoot() { // Safety function, test if the device is part of a call before reboot, other tests can be added here if needed

  const testActiveCalls = (v1, v2, v3) => parseInt(v1) > 0 || parseInt(v2) > 0 || parseInt(v3) > 0;

  var activeCalls = await xapi.Status.SystemUnit.State.NumberOfActiveCalls.get()
  var activeCallsInProgress = await xapi.Status.SystemUnit.State.NumberOfInProgressCalls.get()
  var activeCallsSuspended = await xapi.Status.SystemUnit.State.NumberOfSuspendedCalls.get() 

  if (testActiveCalls(activeCalls, activeCallsInProgress, activeCallsSuspended)) { // Part of an active call? Postpone for 1 hour

    console.log('Device seems to be part of a call.. postponing reboot for 1 hour.. (Daily Reboot scheduler macro)')
    setTimeout(readyForBoot, 60 * 60 * 1000)

  } else { // Not part of a call, go ahead and reboot

    boot();

  }
}

function boot() {

    xapi.Command.SystemUnit.Boot();
    console.log('Executing scheduled reboot... (Daily Reboot scheduler macro)');

}

rebootTimer();  
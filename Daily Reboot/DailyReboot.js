const xapi = require('xapi');

//Define hour for boot
const hourBoot = 21;
const minuteBoot = 6;

function rebootTimer() {
  // Set boot time to defined time of day above
  const now = new Date();

  const targetRebootTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hourBoot, minuteBoot, 0, 0);
  const timeUntilBoot = targetRebootTime - now;

  // Test boot time if its upcoming or in the past
  if (timeUntilBoot > 0) {
    setTimeout(boot, timeUntilBoot)
    // console.log('Setting reboot timer for defined time of day... (Macro boot)')
  } else { // If time has passed this day, set next
    targetRebootTime.setDate(targetRebootTime.getDate() + 1); 
    const nextBootTime = targetRebootTime - now
    setTimeout(boot, nextBootTime)
    // console.log('Defined time of day is in the past, setting next reboot timer for tomorrow... (Macro boot)')
  }
}

function boot(){
  xapi.Command.SystemUnit.Boot();
  // console.log('Executing scheduled reboot... (Macro boot)')
}

rebootTimer();  
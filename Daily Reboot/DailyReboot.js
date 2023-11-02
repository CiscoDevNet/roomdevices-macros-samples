 //Define hour and minute for boot every day (device time)
 const hourBoot = 3; // 0-23 (Default 3am, numbers are without leading zeroes)
 const minuteBoot = 0; // 0-59 (Default sharp)
 const leadingZero = (number) => (number < 10 ? `0${number}` : number);
 
 function rebootTimer() {
 
   const now = new Date();
   const targetRebootTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hourBoot, minuteBoot, 0, 0);
   const timeUntilBoot = targetRebootTime - now;
 
   if (timeUntilBoot > 0) { // Test boot time if its upcoming or in the past
 
     setTimeout(readyForBoot, timeUntilBoot);
     console.log(`Setting reboot timer for today at ${leadingZero(hourBoot)}:${leadingZero(minuteBoot)}... (Daily reboot scheduler macro)`);
 
   } else { // If time has passed this day, set targetRebootTime for tomorrow
 
     targetRebootTime.setDate(targetRebootTime.getDate() + 1);
 
     const nextBootTime = targetRebootTime - now;
 
     setTimeout(readyForBoot, nextBootTime);
 
     console.log(`Defined time has passed for today, setting next reboot timer at ${leadingZero(hourBoot)}:${leadingZero(minuteBoot)} tomorrow... (Daily Reboot scheduler macro)`);
 
   }
 }
 
 async function readyForBoot() { // Safety function, test if the device is part of a call before reboot, other tests can be added here if needed
 
   const testState = (v) => !['Initialized', 'Sleeping'].includes(v)
   var state = await xapi.Status.SystemUnit.State.System.get()
 
   console.log(state)
 
   if (testState(state)) { // Part of an active call? Postpone for 1 hour
 
     console.log(`Device seems not to be ready for reboot due to device state being: ${state}. Postponing reboot for 1 hour.. (Daily Reboot scheduler macro)`)
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
# Cisco CE / RoomOS / MTR Video Endpoints Macros - DailyReboot

This macro is designed to perform a daily reboot of the Cisco CE/RoomOS/MTR video endpoints. If the device is in an active call at the scheduled reboot time, the reboot will be postponed for one hour.

---

![Sample In-Room Control Screenshot](daily_reboot.png)

---

## Requirements
1. Cisco Room Device 
2. Firmware RoomOS 10.19.1.x or newer.
3. Devices running MTR must be registered on Control Hub for this macro to work. 

## Configuration steps
Edit the following constants:

- 'hourBoot' to specify the hour of the day for the device reboot (values: 0-23)
- 'minuteBoot' to specify the minute of the specified 'hourBoot' (values: 0-59)

For example, if you set 'hourBoot' to 21 and 'minuteBoot' to 10, the device will reboot at 21:10 on the same or next day, depending on when the macro was initiated.

## How it works

Upon launching the macro, it will retrieve the current time and check if the specified 'hourBoot' and 'minuteBoot' have already passed for the current day or are scheduled for the future. If the specified time has already passed, the macro will automatically schedule the reboot for the same hour on the next day.

If the device is engaged in an active call at the scheduled reboot time, the reboot will be repeatedly postponed for a duration of 1 hour until the device becomes available and is no longer in a call.

## Support for this macro

For support related to this macro, please contact Magnus Ohm (mohm@cisco.com). Contacting via the Webex Messenging App is preferred.


# Unbook Empty Room

**Target :** Releasing the room when no one is attending.

This macro use the data collected by the Cisco Video Conferencing endpoints to determine if the room is really used during a meeting. When a booking start the macro starts to listen to the metrics update events.

The following metrics are used:

**Active Call**       -> the number of calls in progress

**Presence**         -> presence detection

**People Count**      -> the number of people counted in the room

**Sound Level**       -> the sound level in the room

**Presentation Mode** -> the presentation mode (Off / Receiving / Sending)

**Requirements**

The xAPI to Decline a meeting in this Macro is currently a Public-Preview API. Until it is made Public you will need to obtain a Developer Option Key for your device to have access to the API.

This will only be needed while the API is in Public-Preview.

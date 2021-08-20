# Cisco CE Room Devices - Macros
Here you can find a selection of macros for CE Room Devices. Macros is a great new feature intruduced in CE9.2 that allows you to customise your Room Device. It is especially powerful in combination with the In-Room Control Extensions of the Cisco Touch 10 Control Panel.

Note: The macros can also be browsed and saved easily from [roomos.cisco.com](https://roomos.cisco.com)

Macros available:


| Macro        | Description           |
| :------------------------ |:-------------|
| AppleTV Control      | Add an Apple TV remote control to the touch 10. All communication is done directly via HDMI-CEC. No control system needed.      |
| Audio Call Dial Pad | Ereate an in-room control application that adds a dedicated audio call dial pad to the Touch 10 |
| Audio Safe Guard      | Enforce a maximum output volume on the device. Demostrates a simple macro using API statuses and commands     |
| Block Outgoing Calls | Block certain numbers in a reject list from being called from the system. |
| Big Red Button | Quick action such as muting with a connected USB device |
| Camera control with wide angle view      | Your custom camera control page, including creating a wide angle view of two cameras and controlling both simultaneously.      |
| Conditional Autoanswer with Prompt      | Auto answer on incoming calls - but only for a select number of remote sites      |
| Join 3rd Party Meeting | A Join Meeting Panel/Text Input lets you join 3rd party non-Webex meetings (SIP, eg MicroSoft Teams or Zoom) |
| Join Zoom with DTMF Zoom Tools | Join a Zoom call easily from a Webex Device |
| Language Selector      | By default the touch 10 does not have a way for the end user to select the interface language. This macro adds this feature. Great for those multi-language environments. |
| Multi-Content Solution | Compose multiple video inputs to one presentation source and send to far-end |
| Pin Code Lock | Require user to enter pin code when using the video system |
| Remote Monitoring Alert | Display OSD\Touch warning text when video snapshots (aka remote monitoring) are being captured |
| Room Capacity Alert | Display Alert on the device if a set capacity is exceeded - Based on people count API |
| Room Cleaning and Usage | Records cleaning events, shows time since last used, time since last cleaned, number of times since last cleaned, warns of capacity restrictions. |
| Room Kit Pro SX80 GPIO | See how to get the device to perform some actions when triggering a change on the built in GPIO. Add an one-button-to-dial button on the wall. |
| Scheduled Actions | Have the endpint device automatically perform actions, like placing a call, at a specified time and day. |
| Smart Dual Screen Presentation | Allows primary monitor on multiscreen systems to display preso content when not in a video call. |
| Speed Dials Panel | Always dialling the same few numbers from the meeting room. Maybe want to add calling 911 or the Pizza Place more prominent?     |
| TicTacToe      | Fun Game which allows the user to see how to update images and panels in real time with relation to user input!    |
| WebApps Manager  | This macro allows simple management of ad-hoc local web apps on a device by providing a user interface to add new apps and remove existing ones. |
| Library - Send Webex Message | Send a Webex (chat) message from the video device using the Webex APIs |
| Library - Weather Forecast | Get global weather forecase from free Norwegian weather service |

## Requirements
1. Cisco Room Device (MX, SX, DX, Room, Board or Desk series)
2. Firmware CE9.2.1 or newer. Some macro  using newer features require newer firmware. See the requiremens list specified within each macro
3. Admin user access to endpoint

## Getting Started
1. Read the document [Working with Macros and In-room Controls](https://www.cisco.com/c/dam/en/us/td/docs/telepresence/endpoint/ce92/sx-mx-dx-room-kit-customization-guide-ce92.pdf) for a comprehensive introduction of In-Room Controls, Macros as well as step-by-step instructions on how to build and upload your code.
2. Watch this video for a quick introduction of what In-Room Controls are: https://youtu.be/IQ2Z104Xf50

## Additional Information
##### XAPI
Documentation for the XAPI can be found in the [Command References overview](https://www.cisco.com/c/en/us/support/collaboration-endpoints/telepresence-quick-set-series/products-command-reference-list.html).

## Disclaimer
This example is only a sample and is **NOT guaranteed to be bug free and production quality**.

The sample macros are meant to:
- Illustrate how to use the CE Macros.
- Serve as an example of the step by step process of building a macro using JavaScript and integration with the Codec XAPI
- Provided as a guide for a developer to see how to initialize a macro and set up handlers for user and dialog updates.

The sample macros are made available to Cisco partners and customers as a convenience to help minimize the cost of Cisco Finesse customizations. Cisco does not permit the use of this library in customer deployments that do not include Cisco Video Endpoint Hardware.

## Support Notice
[Support](http://developer.cisco.com/site/devnet/support) for the macros is provided on a "best effort" basis via DevNet. Like any custom deployment, it is the responsibility of the partner and/or customer to ensure that the customization works correctly and this includes ensuring that the macro is properly integrated into 3rd party applications.

It is Cisco's intention to ensure macro compatibility across versions as much as possible and Cisco will make every effort to clearly document any differences in the XAPI across versions in the event that a backwards compatibility impacting change is made.

Cisco Systems, Inc.<br>
[http://www.cisco.com](http://www.cisco.com)<br>
[http://developer.cisco.com/site/roomdevices](http://developer.cisco.com/site/roomdevices)

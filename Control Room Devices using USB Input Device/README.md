# Cisco CE Video Endpoints Macros - Using USB input devices like Keyboard and RF Remote Controls to control the Room Devices.
These macros demonstrate how to control a Cisco video endpoint using a USB Keyboard - or other input devices like remote controls buttons that uses USB and reports itself as a keybyard/H.I.D. device.
The devices support standard USB Keyboards and should work with basically any type of keyboard. However, Cisco has not tested all devices.

---

This sample gadget contains the following files:

macro-samples/
	Prompt for Pin/
	README.md (this file)
       QWERTY_Dialling.js (macro that allows dialling using a standard keyboard)
       RemoteControl.js (macro that shows an example of binding button presses to device actions)


## Requirements
1. Supported Cisco Room Devices: All Room Kits (CE9.5). DX70, DX80.
2. Firmware CE9.5 or newer. CE9.6/RoomOS October for DX Series.
3. Admin user access to API

## Usage
1.  See the latest version of the [Cisco Webex Board, Desk, and Room Series Customization Guide](https://www.cisco.com/c/en/us/support/collaboration-endpoints/spark-room-kit-series/products-installation-and-configuration-guides-list.html)    for a comprehensive introduction to UI extensions and macros; as well as step-by-step instructions on how to build and upload your code.

## Additional Information
##### xAPI
Documentation for the xAPI can be found in the [Command References overview](https://www.cisco.com/c/en/us/support/collaboration-endpoints/telepresence-quick-set-series/products-command-reference-list.html).

## Disclaimer
This example is only a sample and is **NOT guaranteed to be bug free and production quality**.

The sample macros are meant to:
- Illustrate how to use the CE Macros.
- Serve as an example of the step-by-step process of building a macro using JavaScript and integration with the device xAPI
- Provided as a guide for a developer to see how to initialize a macro and set up handlers for user and dialog updates.

The sample macros are made available to Cisco partners and customers as a convenience to help minimize the cost of Cisco Finesse customizations. Cisco does not permit the use of this library in customer deployments that do not include Cisco Video Endpoint Hardware.

## Support Notice
[Support](http://developer.cisco.com/site/devnet/support) for the macros is provided on a "best effort" basis via DevNet. Like any custom deployment, it is the responsibility of the partner and/or customer to ensure that the customization works correctly and this includes ensuring that the macro is properly integrated into 3rd party applications.

It is Cisco's intention to ensure macro compatibility across versions as much as possible and Cisco will make every effort to clearly document any differences in the xAPI across versions in the event that a backwards compatibility impacting change is made.

Cisco Systems, Inc.<br>
[http://www.cisco.com](http://www.cisco.com)<br>
[http://developer.cisco.com/site/roomdevices](http://developer.cisco.com/site/roomdevices)

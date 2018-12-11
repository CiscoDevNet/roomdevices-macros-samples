# Cisco CE Video Endpoints Macros - Room Kit Pro Video Compositing
This macro and corresponding In-Room Control sample demonstrates the video compositing capabilites of the Room Kit Pro device. It shows compositing for the main video stream, the presentation stream and local composition

---

This sample gadget contains the following files:

     macro-samples/
	Room Kit Pro Video Compositing/
		README.md (this file)
		CustomMainAndPresentation.js (the macro for main and presentation compositing)
		LocalLayoutControls.js (the macro for local compositing)
		roomcontrolconfig_roomkitpro_videocompositing.xml (in-room control definition file)
        roomcontrolconfig_roomkitpro_videocompositing.zip (Package for provisioning)


## Requirements
1. Cisco Room Kit Pro Video endpoint. A subset of the functionality applies also to other Room Kits.
2. Firmware CE9.6.1 or newer.
3. Admin user access to endpoint

## Usage
1. Read the document "Working with Macros and In-room Controls" for an overview about In-Room Controls, Macros as well as step-by-step instructions on how to build and upload your code.

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

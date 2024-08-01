# Cisco Room Devices Macros - Create Web App with Authentication Controls
This macro allows the creation of local web apps on a device that, when exited, prompt the user to clear their login information. This is useful for apps like whiteboarding where confidential or personal user information remains accessible.

## Requirements
1. A Cisco Webex Board or Desk device

| Minimum RoomOs Version | Webex Cloud | Webex Edge (Hybrid Cloud) | On-Premise | Microsoft Teams Room On Cisco Devices    |
|:-----------------------|:------------|:--------------------------|:-----------|:-----------------------------------------|
| 11.13.1.16 - Board Pro | ✅ Yes      | ✅ Yes                     | ✅ Yes     | ✅ Yes                                   |  
| 11.6.1.5 - Desk Pro    | ✅ Yes      | ✅ Yes                     | ✅ Yes     | ✅ Yes                                   |  

## Usage
1. Customize the WebAppClearCache.js variables section.
2. Leverage the local web interface of the device or Control Hub to deploy and activate this macro.

## Disclaimer

This solution will clear the cache to ALL web apps. This may have an impact on other solutions and was validated in a pre-production environment. This example is only a sample and is **NOT guaranteed to be bug free and production quality**.

The sample macros are meant to:
- Illustrate how to use the CE Macros.
- Serve as an example of the step-by-step process of building a macro using JavaScript and integration with the device xAPI
- Provided as a guide for a developer to see how to initialize a macro and set up handlers for user and dialog updates.

The sample macros are made available to Cisco partners and customers as a convenience to help minimize the cost of customizations. Cisco does not permit the use of this library in customer deployments that do not include Cisco Video Endpoint Hardware.

## Support Notice
[Support](http://developer.cisco.com/site/devnet/support) for the macros is provided on a "best effort" basis via DevNet. Like any custom deployment, it is the responsibility of the partner and/or customer to ensure that the customization works correctly and this includes ensuring that the macro is properly integrated into 3rd party applications.

It is Cisco's intention to ensure macro compatibility across versions as much as possible and Cisco will make every effort to clearly document any differences in the xAPI across versions in the event that a backwards compatibility impacting change is made.

Cisco Systems, Inc.<br>
[http://www.cisco.com](http://www.cisco.com)<br>
[http://developer.cisco.com/site/roomdevices](http://developer.cisco.com/site/roomdevices)


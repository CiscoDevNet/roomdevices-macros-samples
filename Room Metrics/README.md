# Room Metrics

## Room Metrics is ...

+ a way to display some **utilization** and **environmental** metrics about the device of the day
    + How many **meetings** and **meeting minutes** have been conducted
    + How much time the room has been engaged (but not in a call)
    + **Ambient Noise**, **Ambient Temperature**, **Relative Humidity**, **Air Qulaity** (1)
+ a way for people to decide whether to stay in the room continuously or to pick another room with less utilized of the day.
+ metrics can be reset on-demand (right after room cleaning) or will be reset automatically at midnight


(1) The availability of some metrics are depending on Cisco Video Device models.

## Trigger Conditions
+ Whenever a person comes into the room, a **Welcome notification** will pop up on the screen (and touch device) for **30** seconds.
+ There is a **Room Metrics** button (available in call or out-of-call) to show the metrics.

### On Screen
![room-metrics-1](https://user-images.githubusercontent.com/102512136/234561630-391b6ef1-ab1c-4770-b339-341ed7223f14.png)

### On Touchpanel
![room-metrics-3](https://user-images.githubusercontent.com/102512136/234561869-bd9278b4-6a20-449c-89d3-bacccf5166b0.png)
![room-metrics-4](https://user-images.githubusercontent.com/102512136/234561937-b56bb610-ab21-4548-836b-875636eaf30c.png)
![room-metrics-5](https://user-images.githubusercontent.com/102512136/234561949-7389410d-f9f2-4bb1-913c-a907cef8f2e7.png)

## Requirements
1. A Cisco Webex Room, Board or Desk device
2. RoomOS Software

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

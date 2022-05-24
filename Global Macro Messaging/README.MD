# Global Macro Messaging

Global Macro Messaging (GMM) is a set of functions to standardize the communication across macros running localy on a Webex Room Device, between Room Devices on the same network, or devices within the same Webex Control Hub org. They are meant to provide an integrator/developer a set of simple to use tools to provide consistent and meaningful context to your work but also to help jump start your more complex work.

## Requirements
- A compatible Webex Room Device
- Admin access to this device
- Knowledge of the xApi
- Knowledge of ES6 Javascript

### Optional Requirements
- Admin access to your Webex Control Hub instance

## How to Install
- Navigate to the GlobalMacroMessaging.js file
- Copy the entirety of ```const GMM``` into any macro that needs to pass Status, Error or Command messages between Macros or Devices

# Functions
GMM contains all functions neccessary to communicate with all 3 methods.

## Subscribing to GMM messages
- In order for any macro to listen to incoming events posted by other macros/devices you must first subscribe to these messages

```javascript
GMM.on(event=>{
  console.log(event)
})
```
- The base structure of the payload for this event is

```javascript
{
  App: 'string',
  Source: { Type: 'string', Id: 'string' },
  Type: 'string',
  Value: 'string'
}
```
### App

## Inter-Macro Communication

### GMM.status(string)
- Posting a status tells other macros on your device what your script is doing. This could be as simple as a string or a whole packet of information nested in a JSON object
```javascript
GMM.status('myStatusMessage');

const myObject = {
  state: 'divided',
  color: 'blue'
};

GMM.status(myObject);
```

# Global Macro Messaging

## About
Global Macro Messaging (GMM) is a set of functions to standardize the communication across macros running localy on a Webex Room Device, between Room Devices on the same network, or devices within the same Webex Control Hub org. They are meant to provide an integrator/developer a set of simple to use tools to provide consistent and meaningful context to your work as well as jump start developement on more complext solutions.=

## Features
- Create Status, Error and Command events within a macro to be intercepted by:
  - Another macro running on the same device
  - Another macro running on another device on the same Network
  - Another device within your Webex Organization
- Read and Write persitent data
  - Forked from [Macro Memory Storage](https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/tree/master/Macro%20Memory%20Storage)
  - Allows you to write data to a secondary macro, and read from that file within your script
- Task Scheduling
- Messaging into the Webex App

## Requirements
- A compatible Webex Room Device
  - Admin access to this device
- Working knowledge of
  - The Device xApi
  - The Webex APIs
  - ES6 Javascript and Best Practices

### Optional Requirements
- Admin access to your Webex Control Hub instance

## How to Install
- Navigate to the GlobalMacroMessaging.js file
- Copy the entirety of ```const GMM``` into any macro that needs to pass Status, Error or Command messages between Macros or Devices

## Functions

### Classes
- - -

#### GMM.Connect.Local()
- Class
- Used for Inter-Macro communication on the same device
- Works for On-Premise, Edge for Devices, or Full Cloud deployments

|Method|Description|
|:---|:---|
|.status(message)|Prepares a Status message. Requires a string or JSON object literal. To be followed by .post() or .queue(id) method|
|.command(message)|Prepares a Command message. Requires a string or JSON object literal. To be followed by .post() or .queue(id) method|
|.error(message)|Prepares a Error message. Requires a string or JSON object literal. To be followed by .post() or .queue(id) method|
|.post()|Async. Sends payload off into the system to be caught by GMM.Event.Receiver.on() subscription|
|.queue(id)|Places payload into a queue to be later posted by the GMM.Event.Queue.on() subscription in 250ms intervals. GMM.Event.Receiver.on() subscription still required to intercept message|

Use
```javascript
import xapi from 'xapi';
import { GMM } from './GMM_Lib'

//Instantiate new GMM.Connect.Local() object
const localCallout = new GMM.Connect.Local()

//Post a status
localCallout.status('Test Status String').post()

//Queue a command
localCallout.command('Test Command String').queue('ID_001')

//Post an Error with JSON object literal
const myObject = {
  Error: 'An error occured',
  Cause: 'Unknown',
  Action: 'No recommended action at this time'
}
localCallout.error(myObject).post()
```
- - -

#### GMM.Connect.IP(CommonUsername, CommonPassword, IP_Array)
- Class
- Used for Inter-Macro communication between Webex Room devices via IP communication, using the putxml API
- Requires Local Admin account
- Works for On-Premise, Edge for Devices, or Full Cloud deployments

|Method|Description|
|:---|:---|
|.status(message)|Prepares a Status message. Requires a string or JSON object literal. To be followed by .post() or .queue(id) method|
|.command(message)|Prepares a Command message. Requires a string or JSON object literal. To be followed by .post() or .queue(id) method|
|.error(message)|Prepares a Error message. Requires a string or JSON object literal. To be followed by .post() or .queue(id) method|
|.passIP(stack)|Default value: 'v4'. Appends this device's IPv4 address to the payload. Replace stack parameter with 'v6' to append IPv6 address|
|.passAuth(username, password)|Passes along the username and password to the receiving CODEC as an encoded string|
|.post()|Async. Sends payload off into the system to be caught by GMM.Event.Receiver.on() subscription|
|.queue(id)|Places payload into a queue to be later posted by the GMM.Event.Queue.on() subscription in 250ms intervals. GMM.Event.Receiver.on() subscription still required to intercept message|

Use
```javascript
import xapi from 'xapi';
import { GMM } from './GMM_Lib'

//Instantiate new GMM.Connect.IP() object
const ip_callout = new GMM.Connect.IP('CommonUsername', 'CommonPassword', ipAddress_1, ipAdress_2, ...) //Accepts 1 or More IP addresses

//Post a status
ip_callout.status('Test Status String').post()

//Queue a command
ip_callout.command('Test Command String').queue()

//Post an Error with JSON object literal
const myObject = {
  Error: 'An error occured',
  Cause: 'Unknown',
  Action: 'No recommended action at this time'
}
ip_callout.error(myObject).post()

//Append IPv4/IPv6
ip_callout.status('Test Status String').passIP().post()
ip_callout.command('Test Command String').passIP('v6').post()

//Append Auth
ip_callout.status('Test Status String').passAuth('myUsername', 'mySecretCode').post()

//Append IP & Auth
ip_callout.command('Test Command String').passIP('v6').passAuth('myOtherUsername', 'myOtherSecretCode').post()
```
- - -

#### GMM.Connect.Webex(CommonAuthToken, DeviceId_Array)
- Class
- Used for Inter-Macro communication between Webex Room devices via Webex Cloud xApi communication
- Requires Bot Token
- Requires Edge for Devices or Full Cloud Registration

|Method|Description|
|:---|:---|
|.status(message)|Prepares a Status message. Requires a string or JSON object literal. To be followed by .post() or .queue(id) method|
|.command(message)|Prepares a Command message. Requires a string or JSON object literal. To be followed by .post() or .queue(id) method|
|.error(message)|Prepares a Error message. Requires a string or JSON object literal. To be followed by .post() or .queue(id) method|
|.passDeviceId()|Appends this device's Cloud Device ID to the payload.|
|.passAuth()|Appends auth token initialized in the object to the receiving CODEC|
|.post()|Async. Sends payload off into the system to be caught by GMM.Event.Receiver.on() subscription|
|.queue(id)|Places payload into a queue to be later posted by the GMM.Event.Queue.on() subscription in 250ms intervals. GMM.Event.Receiver.on() subscription still required to intercept message|

Use
```javascript
import xapi from 'xapi';
import { GMM } from './GMM_Lib'

//Instantiate new GMM.Connect.Webex() object
const webex_callout = new GMM.Connect.Webex('myToken', deviceId_1, deviceId_2, ...) //Accepts 1 or More Device IDs

//Post a status
webex_callout.status('Test Status String').post()

//Queue a command
webex_callout.command('Test Command String').queue()

//Post an Error with JSON object literal
const myObject = {
  Error: 'An error occured',
  Cause: 'Unknown',
  Action: 'No recommended action at this time'
}
webex_callout.error(myObject).post()

//Append Device ID
webex_callout.status('Test Status String').passDeviceId().post()

//Append Auth
webex_callout.status('Test Status String').passAuth().post()

//Append Device ID & Auth
webex_callout.command('Test Command String').passDeviceId().passAuth().post()
```
- - -

#### GMM.Message.Webex.User('CommonAuthToken', email_Array)
- Class
- Used to post Messages to users on the Webex App
- Requires Bot Token
- Requires Access to Webex Cloud

|Method|Description|
|:---|:---|
|.body(message)|Prepares body as a markdown string. To be followed by .post() method|
|.formattedBody(title, subtitle, body, data, footer)|Prepares a pre-formatted markdown string. To be followed by .post() method|
|.post()|Async. Sends payload off to Webex|

Use
```javascript
import xapi from 'xapi';
import { GMM } from './GMM_Lib'

//Instantiate new GMM.Message.Webex.User() object
const report = new GMM.Message.Webex.User('myToken', user_Email_1, user_Email_2, ...) // Accpets 1 or More email addresses

//Send message to webex
report.body('My Simple Message to Webex').post()

//Send Pre-formatted message to Webex
report.body('Alert', 'Out of snacks in the cafeteria', 'We should convince upper managment to provide hot meals in addition to keeping to snacks at the ready', 'Last known snack break: 13:45', '- Room 5025').post()
```
- - -

#### GMM.Message.Webex.Room()
- Class
- Used to post Messages to specific Rooms IDs on the Webex App
  - The bot must be added to the space before sending messages, else this will error
- Requires Bot Token
- Requires Access to Webex Cloud

|Method|Description|
|:---|:---|
|.body(message)|Prepares body as a markdown string. To be followed by .post() method|
|.formattedBody(title, subtitle, body, data, footer)|Prepares a pre-formatted markdown string. To be followed by .post() method|
|.post()|Async. Sends payload off to Webex|

Use
```javascript
import xapi from 'xapi';
import { GMM } from './GMM_Lib'

//Instantiate new GMM.Message.Webex.Room() object
const report = new GMM.Message.Webex.Room('myToken', roomID_1, roomID_2, ...) // Accpets 1 or More Room IDs
// Be sure to add this bot to each Room ID before posting message, else this will error

//Send message to webex
report.body('My Simple Message to Webex').post()

//Send Pre-formatted message to Webex
report.body('Alert', 'Out of snacks in the cafeteria', 'We should convince upper managment to provide hot meals in addition to keeping to snacks at the ready', 'Last known snack break: 13:45', '- Room 5025').post()
```
- - - 

### Subscriptions

#### GMM.Event.Receiver.On(callBack)
- Subscription
- Used to intercept messages sent by GMM.Connect.Local(), GMM.Connect.IP(), and GMM.Connect.Webex()

Event Payload Format
|Key|Value|
|:---|:---|
|App|Name of the Macro responsible for sending this message|
|Source|Type: which class was used to send this payload; Id: Serial address of sending device, unless sent locally. Source may contain additional Keys for Auth, IPv4, IPv6, or Device ID|
|Type| Message type: Status, Command, Error|
|Value| Message string or JSON Object Literal sent by GMM.Connect.Local(), GMM.Connect.IP(), and GMM.Connect.Webex()|


Use
```javascript
import xapi from 'xapi';
import { GMM } from './GMM_Lib'

GMM.Event.Receiver.On(event => {
  console.log(event)
})
/*
Example Event Payload
{ 
  App: 'Macro_Name',
  Source: { Type: 'Local', Id: 'localhost' },
  Type: 'Status',
  Value: 'Sending a Status' 
}
*/
```
- - - 

#### GMM.Event.Queue.on(callBack)
- Subscription
- Used to processed any object using the .queue(id) method
- If GMM.Event.Queue.on(callBack) is not declared, you're queued requests will not run
- Must run in the same script that is queuing these requests

Event Payload Format
|Key|Value|
|:---|:---|
|Queue_ID|Current ID processed in the queue. Used for request tracking|
|Response|HTTPClient Repsones|
|QueueStatus| Contains a count of remaining queued items, a pool of IDs left in the queue, and the current delay of the queue|


Use
```javascript
import xapi from 'xapi';
import { GMM } from './GMM_Lib'

GMM.Event.Queue.On(event => {
  console.log(event)
})
/*
Example Event Payload
{ 
  Queue_ID: 'undefined',
  Response: { "Response from HTTP Client" },
  QueueStatus:
   { RemainingRequests: 2,
     IdPool: [ '_01', '_02' ],
     CurrentDelay: '250 ms' } 
}
*/
```

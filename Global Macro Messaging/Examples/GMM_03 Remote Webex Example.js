/********************************************************
Copyright (c) 2022 Cisco and/or its affiliates.
This software is licensed to you under the terms of the Cisco Sample
Code License, Version 1.1 (the "License"). You may obtain a copy of the
License at
               https://developer.cisco.com/docs/licenses
All use of the material herein must be in accordance with the terms of
the License. All rights not expressly granted by the License are
reserved. Unless required by applicable law or agreed to separately in
writing, software distributed under the License is distributed on an "AS
IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
or implied.
*********************************************************

 * Author:                  Robert(Bobby) McGonigle Jr
 *                          Technical Marketing Engineer
 *                          Cisco Systems
 *                          bomcgoni@cisco.com
 * 
 * 
 * Consulting Engineer:     Gerardo Chaves
 *                          Technical Solutions Architect
 *                          Cisco Systems
 * 
 * 
 * Released: May 16, 2022
 * Updated: June 21, 2022
 * 
 * Description: 
 *    - Example 3 for the GMM_lib
 *    - Be sure to review examples [1, 2] before continuing
 *    - Review this before moving onto the next Example
 * 
 * Script Dependencies
 *    - GMM_Lib
 *      - Library for GMM
 *      - Have this installed, saved, and remain disabled. It is imported into each example
 *    - GMM_Event Receiver
 *      - Used for examples
 *      - Have this installed and enabled on all Room Devices you use as you navigate through examples 1-4
 * 
*/

import xapi from 'xapi';
import { GMM } from './GMM_Lib'
//^^ First we import GMM into our Project

//Define the Device ID of the system you want to communicate using the Webex Cloud xApi
const myWebexDevice = 'deviceID_001'

//Create an object of the Class GMM.Connect.Webex()
//  - GMM.Connect.Webex(AuthToken, DeviceId_Array)

const webexCallout = new GMM.Connect.Webex('super_secret_authToken', myWebexDevice)

//NOTE: It's Poor Practice to store an Auth Token within a Macro. 
//      Though this function needs one to work, it's best you find a method to securely pass it to the function

//Use this webexCallout object to post Status, Command, or Error Messages
//  - SetTimeout is not required, we use this to space out requests as they print to the console
setTimeout(function () {
  //Status Example
  webexCallout.status('Sending a Status').post()
  // - webexCallout is our newly initialized class
  // - status is the type of message we want to send, along with the message we plan on sending
  // - post sends the message along into the codec
  //     The same format is true for command and error messages
}, 2000)

setTimeout(function () {
  //Command Example
  webexCallout.command('Sending a Command').post()
}, 4000)

setTimeout(function () {
  //Error Example
  webexCallout.error('Sending and Error').post()
}, 6000)

/* 
On the Receiving CODEC, you'll need the same GMM.Event.Receiver.on() subscription we used in Lesson 1

Since this is communication over the Webex Cloud xApi, you'll need another CODEC with the GMM_Lib installed 
    as well as the GMM_Event Receiver Macro running on that device
*/

//We're not limited to 1 device at a time either
//  - You can build an array of devices to send messages in bulk
//  - So long as they share a auth token
//    - If you have different auth tokens, then define a new connection using GMM.Connect.IP()
//       and be sure to post to each new connection as needed

//Create anobject object of the Class GMM.Connect.IP(), but let's pass in a whole array of devices instead
const myWebexDevices = [
  'deviceID_001',
  'deviceID_002',
  'deviceID_003'
]
const webexCallout_Group = new GMM.Connect.Webex('super_secret_authToken', myWebexDevices)

//NOTE: It's Poor Practice to store an Auth Token within a Macro. 
//      Though this function needs one to work, it's best you find a method to securely pass it to the function

///Use this webexCallout_Group object to post Status, Command, or Error Messages
//  - Just like a single connection, bulk connections are written using the same methods
setTimeout(function () {
  //Status Example
  webexCallout_Group.status('Sending a Status').post()
}, 8000)

setTimeout(function () {
  //Command Example
  webexCallout_Group.command('Sending a Command').post()
}, 10000)

setTimeout(function () {
  //Error Example
  webexCallout_Group.error('Sending and Error').post()
}, 12000)

//Just know you'll need to listen to these events on each CODEC you're talking too
//  Feel free to install the GMM_Event Receiver script on each device to see the messages pour in

// There are 2 more methods you can add to the chain, should you need too
//  Their purpose it to pass along information the receiving CODEC you can use to talk back to the CODEC that sent the message
// - passDeviceId()
//   - Passes along the sending Device's DeviceId to the receiving CODEC based on the stack parameter
//     - This device must be registered the same org as the receiving device
// - passAuth()
//   - Passes along the auth token initialized in the object to the receiving CODEC
//     - If not declared, the function will error

// Ex: ipCallout.command('Sending a Command').passDeviceId().passAuth().post()
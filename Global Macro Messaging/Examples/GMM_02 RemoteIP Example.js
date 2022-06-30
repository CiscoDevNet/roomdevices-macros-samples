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
 *    - Example 2 for the GMM_lib
 *    - Be sure to review examples [1] before continuing
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
//^^ Import GMM into our Project

//Define the IP of the system you want to communicate with over the network
const myRemoteDevice = '0.0.0.2'

//Create an object of the Class GMM.Connect.IP()
//  - GMM.Connect.IP(Username, Password, IP_Array)

const ipCallout = new GMM.Connect.IP('admin', 'super_secret_code', myRemoteDevice)

//NOTE: It's Poor Practice to store credentials within a Macro. 
//      Though this function needs them to work, it's best you find a method to securely pass it to the function

//Use this ipCallout object to post Status, Command, or Error Messages
//  - SetTimeout is not required, we use this to space out requests as they print to the console
setTimeout(function () {
  //Status Example
  ipCallout.status('Sending a Status').post()
  // - ipCallout is our newly initialized class
  // - status is the type of message we want to send, along with the message we plan on sending
  // - post sends the message along into the codec
  //     The same format is true for command and error messages
}, 2000)

setTimeout(function () {
  //Command Example
  ipCallout.command('Sending a Command').post()
}, 4000)

setTimeout(function () {
  //Error Example
  ipCallout.error('Sending and Error').post()
}, 6000)

/* 
On the Receiving CODEC, you'll need the same GMM.Event.Receiver.on() subscription we used in Lesson 1

Since this is communication over IP, you'll need another CODEC with the GMM_Lib installed as well as the GMM_Event Receiver script
    running on that device
*/


//We're not limited to 1 device at a time either
//  - You can build an array of devices to send messages in bulk
//  - So long as they share a common username and password
//    - If you have different usernames and passwords, then define a new connection using GMM.Connect.IP()
//       and be sure to post to each new connection as needed

//Create anobject object of the Class GMM.Connect.IP(), but let's pass in a whole array of devices instead
const myRemoteDevices = ['0.0.0.2', '0.0.0.3', '0.0.0.4']
const ipCallout_Group = new GMM.Connect.IP('admin', 'super_secret_code', myRemoteDevices)

//NOTE: It's Poor Practice to store credentials within a Macro. 
//      Though this function needs them to work, it's best you find a method to securely pass it to the function

///Use this ipCallout_Group object to post Status, Command, or Error Messages
//  - Just like a single connection, bulk connections are written using the same methods
setTimeout(function () {
  //Status Example
  ipCallout_Group.status('Sending a Status').post()
}, 8000)

setTimeout(function () {
  //Command Example
  ipCallout_Group.command('Sending a Command').post()
}, 10000)

setTimeout(function () {
  //Error Example
  ipCallout_Group.error('Sending and Error').post()
}, 12000)

//Just know you'll need to listen to these events on each CODEC you're talking too
//  Feel free to install the GMM_Event Receiver Macro on each device to see the messages pour in

// There are 2 more methods you can add to the chain, should you need too
//  Their purpose it to pass along information the receiving CODEC you can use to talk back to the CODEC that sent the message
// - passIP(stack)
//   - Stack Values: 'v4', 'v6'
//   - Passes along the IPv4 or IPv6 to the receiving CODEC based on the stack parameter
//     - IPv4 is default if not declared
// - passAuth(username, passcode)
//   - Accepts a string
//   - Passes along the username and password to the receiving CODEC as an encoded string
//     - If not declared, the function will error

// Ex: ipCallout.command('Sending a Command').passIP('v6').passAuth('someUser', 'someSecret').post()

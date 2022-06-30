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
 *    - Example 1 for the GMM_lib
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

//Create an object of the Class GMM.Connect.Local()
//  - This only needs to be declared once per macro

const localCallout = new GMM.Connect.Local()

//Use this localCallout object to post Status, Command, or Error Messages
//  - SetTimeout is not required, we use this to space out requests as they print to the console
setTimeout(function () {
  //Status Example
  localCallout.status('Sending a Status').post()
  // - localCallout is our newly initialized class
  // - status is the type of message we want to send, along with the message we plan on sending
  // - post sends the message along into the codec
  //     The same format is true for command and error messages
}, 2000)

setTimeout(function () {
  //Command Example
  localCallout.command('Sending a Command').post()
}, 4000)

setTimeout(function () {
  //Error Example
  localCallout.error('Sending and Error').post()
}, 6000)

//In another macro, subscribe to the incoming events using GMM.Event.Receiver.on(value => console.log(value))
//  Feel Free to install the GMM_Event Receiver Macro to see these messages come in
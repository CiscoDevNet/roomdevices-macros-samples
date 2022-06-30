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
 * Released: May 21, 2022
 * Updated: June 21, 2022
 * 
 * Description: 
 *    - Example 4 for the GMM_lib
 *    - Be sure to review examples [1, 2, 3, 4] before continuing
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

/*
Send Messages into the Webex App
- Like lesson 3, we'll instantiate a class with an auth token
- This class is GMM.Message.Webex[User/Room]()

Let's first pick the folks we want to message on the Webex App
*/

const myUserGroup = ['friend#1@example.com', 'friend#2@example.com', 'iRanOutOfFriends@example.com'];
//Note, these are fictional emails. Replace them with 1 or more emails that has an Active Webex Account

//Create an object of the Class GMM.Message.WebexUser('AuthToken', email_Array)

const mailer = new GMM.Message.Webex.User('super_secret_authToken', myUserGroup)
//NOTE: It's Poor Practice to store an Auth Token within a Macro. 
//      Though this function needs one to work, it's best you find a method to securely pass it to the function

//Now use this mailer object to post Messages into the Webex App for these users
//  - SetTimeout is not required, we use this to space out requests as they post to Webex
setTimeout(function () {
  //We can send a simple message with the body() method
  //  This is sent as markdown, so format as you see fit
  mailer.body('This is a Message from the GMM Library').post()
}, 2000)

setTimeout(function () {
  //Or you can use the formattedBody() method which accepts a
  // Title, Subtitle, Body, Data and Footer parameter
  mailer.formattedBody('Hello World', 'This is my Subtitle', 'Here is the body of my message', JSON.stringify({ Message: 'And if I want to pass in data', Info: 'I surely can' }), 'Footers are where it\'s really at though').post()
}, 4000)

/*
//Messages can be sent to Rooms on Webex as well, not just user emails
// Simply instantiate the same object, but use .Room() instead of .User() as well as provide the RoomIDs
//   You want to communicate with

const myWebexSpaces = ['roomId#1', 'roomId#2', 'roomId#X']

const space_mailer = new GMM.Message.Webex.Room('super_secret_authToken', myWebexSpaces)

setTimeout(function(){
  //We can send a simple message with the body() method
  //  This is sent as markdown, so format as you see fit
  space_mailer.body('This is a Message from the GMM Library').post()
}, 2000)

setTimeout(function(){
  //Or you can use the formattedBody() method which accepts a
  // Title, Subtitle, Body, Data and Footer parameter
  space_mailer.formattedBody('Hello World', 'This is my Subtitle', 'Here is the body of my message', JSON.stringify({Message: 'And if I want to pass in data', Info: 'I surely can'}), 'Footers are where it\'s really at though').post()
}, 4000)
*/
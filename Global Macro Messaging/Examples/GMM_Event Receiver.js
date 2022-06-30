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
 *    - This Demo is used to catch messages being sent from other Macros or Room Devices
 *    - Have this installed and enabled on all Room Devices you use as you navigate through examples 1-4
 * 
 * Script Dependencies
 *    - GMM_Lib
 *      - Library for GMM
 *      - Have this installed, saved, and remain disabled. It is imported into each example
 * 
*/

import xapi from 'xapi';
import { GMM } from './GMM_Lib'

GMM.Event.Receiver.on(event => {
  // Though not required, GMM provides enough context for you to organize your code
  // We'll separate each message we posted above using switch case, and print the those events to the console
  //   with different log levels
  switch (event.Type) {
    case 'Status':
      console.log(event)
      break;
    case 'Command':
      console.warn(event)
      break;
    case 'Error':
      console.error(event)
      break;
  }
})

/*
The console body should look similar to this

{ App: 'GMM_01 Local Example',
  Source: { Type: 'Local', Id: 'localhost' },
  Type: 'Status',
  Value: 'Sending a Status' }
{ App: 'GMM_01 Local Example',
  Source: { Type: 'Local', Id: 'localhost' },
  Type: 'Command',
  Value: 'Sending a Command' }
{ App: 'GMM_01 Local Example',
  Source: { Type: 'Local', Id: 'localhost' },
  Type: 'Error',
  Value: 'Sending and Error' }

- We may have only sent a simple message but there is enough context for you
  to identify what kind of message was sent, from which app, and where it came from

- This becomes even more important as we use GMM to communicate with other CODECs
  in your future designs
*/
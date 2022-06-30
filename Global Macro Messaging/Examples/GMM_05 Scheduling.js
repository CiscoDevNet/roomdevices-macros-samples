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
Schedule tasks

As the name suggests, you can schedule a task on a specific hour and minute
  by using the GMM.Event.Schedule.on('time', event =>{}) subscription

//This is a modified function of the Scheduled Actions macro found on roomos.cisco.com
   https://roomos.cisco.com/macros/Scheduled%20Actions
*/

//This subscription takes a 24hr format time and will fire an event once per day at
//  given time, per the devices local time
GMM.Event.Schedule.on('04:00', event => {
  console.log(event) // Log output: '{ Message: '[04:00] Scheduled event fired' }'
  //Run the code you need to run at 4am here
})

GMM.Event.Schedule.on('14:00', event => {
  console.log(event) // Log output: '{ Message: '[14:00] Scheduled event fired' }'
  //Run the code you need to run at 2pm here
})
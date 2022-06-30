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
 *    - Example 4 for the GMM_lib
 *    - Be sure to review examples [1, 2, 3] before continuing
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

/*
 * In examples 1-3, we demonstrated how to use the .post() method
 *     "There is another" and that's .queue(id)
 * 
 *  The .queue(id) method functions similarly to .post(), but rather than sending the payload immediately
 *     the payload is instead placed in a queue
 * 
 * Queuing your posts will help with rate limiting and making sure all posts hit their targets
 * 
 * Room Devices can establish a limited number of connections on their own, so a queue can be used
 *     to pace your requests so they don't error out to soon, ensuring that they all reach their destination
 * 
*/

/*
 * We'll use GMM.Connect.IP() class from lesson 2 to demonstrate the Queue
 * 
 * Know that GMM.Connect.Local() and GMM.Connect.Webex() can use the queue method
*/

//Define the IP of the system you want to communicate with over the network
const myRemoteDevice = '0.0.0.2'

//Create an object of the Class GMM.Connect.IP()
const ipCallout = new GMM.Connect.IP('admin', 'super_secret_code', myRemoteDevice)

//NOTE: It's Poor Practice to store credentials within a Macro. 
//      Though this function needs them to work, it's best you find a method to securely pass it to the function

setTimeout(function () {
  //Start by making a post for comparison
  ipCallout.status('Sending a Status Post').post()
}, 2000)

setTimeout(async function () {
  //Now queue a few more
  await ipCallout.status('Queuing a Status').queue()
  await ipCallout.command('Queuing a Command').queue('_01')
  await ipCallout.error('Queuing and Error').queue('_02')
}, 4000)


/*
 * Notice how the queued commands haven't executed yet
 *
 * That's because, in order for the queue to be processed, we need to run it
 *
 * There is a subscription for the Queue
 *
 *   GMM.Event.Queue.on(value => console.log(value));
 *
 * The queue will need to be declared in the Macro that's sending, and GMM.Event.Receiver.on() will still be needed to intercept it
 *
 * This queue, by default, will process the posts in the order in which the request was received in your script every 250ms
 *    Should you need to increase or decrease the queue delay, go to the GMM_Lib macro and modify the 
 *    GMM.Config.queueInternvalInMs object
 *    250ms held up well in testing, but feel free to make changes for your use case
 *
 * The queue will then provide a Queue Summary in the queue as a callback
 *
 * The .queue(id) method also has an id parameter. Should you need to track a specific call in the queue,
 *    you can add an id and listen for when it was processed within the queue subscription
 * 
 * To see how the queue runs, uncomment the GMM.Event.Queue.on() subscription below, save and run this macro again
*/


GMM.Event.Queue.on(report => {
  //The queue will continuously log a report to the console, even when it's empty.
  //To avoid additional messages, we can filter the Queues Remaining Requests and avoid it if it's equal to Empty
  if (report.QueueStatus.RemainingRequests != 'Empty') {
    report.Response.Headers = [] // Clearing Header response for the simplicity of the demo, you may need this info
    console.log(report)
  }
  //When using the Queue, Queue IDs are important to tracking responses, should you need to handle anything based on this response
  switch (report.Queue_ID) {
    case '_01':
      //Run code in response to the custom Queue ID of _01
      break;
    case '_02':
      //Run code in response to the custom Queue ID of _02
      break;
    default:
      //Any undefined IDs can be handled here, or left alone
      break;
  }
})


/*
A typical Queue report will contain the following

{ Queue_ID: 'undefined',
  Response: { "Response from HTTP Client" },
  QueueStatus:
   { RemainingRequests: 2,
     IdPool: [ '_01', '_02' ],
     CurrentDelay: '250 ms' } }
*/
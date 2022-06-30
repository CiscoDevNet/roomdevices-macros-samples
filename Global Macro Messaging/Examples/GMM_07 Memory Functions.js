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
Read and Write to a Memory Storage Macro

For those familiar with Memory Functions found here
https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/tree/master/Macro%20Memory%20Storage

The read and write functions have been merged into GMM to simplify deployment and keep all good tools available in on spot
*/

//First you'll want to be sure you have the Memory_Storage Macro installed, 
//  if not, it's best to run the GMM.memoryInit() function when your script initiates
//  Feel free to uncomment the example below

/*
async function init(){
  await GMM.memoryInit()
  //This checks to see if Memory_Storage exists, if it doesn't, it will build it for you
}

init()
*/

//Writing to Memory
//  - GMM.write(key, value)
//  - GMM.write.global(key, value)

function delay(ms) { return new Promise(resolve => { setTimeout(resolve, ms) }) }
//We'll be using this delay function for this demo. Know it's not necessary, but is a useful tool to have

function getRandomInt(max) {return Math.floor(Math.random() * max);}
//We'll be using this random integer function for this demo as well

async function myFunction() {
  //Let's be sure our Memory_Storage script is available
  //  You should only need to do this once per macro, no need to run GMM.memoryInit() multiple times
  await GMM.memoryInit()
  // Now write something to memory
  await GMM.write('myObject', 'Hello World')

  await delay(1000)

  //Now, let's pull that data we wrote, and log it to the console
  const read = await GMM.read('myObject')
  console.log(read)

  const myRandomKey = `moreInfo${getRandomInt(10000000)}`

  await delay(5000)
  //Let's see what happens if the key we're looking for doesn't exist
  try {
    const readMore = await GMM.read(myRandomKey)
    console.log(readMore)
  } catch (e) {
    //And log that error to the console
    console.error(e)

    //Because this errored, let's provide data for this key
    const newData = { Message: 'Who doesn\'t like JSON', It: 'is the bee\'s knees', Even: { When: 'You Nest', The: 'Data' } }
    await GMM.write(myRandomKey, newData)
  }
  await delay(5000)
  try {
    const readMore = await GMM.read('moreInfo')
    console.log(readMore)
  } catch (e) {
    //Should't error now :)
  }
  await delay(5000)

  //Both read and write have global equivalents too
  //By default, reading and writing exist solely within the macro you're working in
  //Should you need to access the data at a higher level, you can use .Global

  //The last example here will be reading all the data for our macro
  const allTheMem =  await GMM.read.global(module.name.replace('./', ''))
  console.warn(allTheMem)
}

myFunction()
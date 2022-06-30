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
 *    - Real World use case based on example 2 from GMM
 *      - Please review examples [1, 2] before using this Macro
 * 
 * Script Dependencies
 *    - GMM_Lib
 *      - Library for GMM
 *      - Have this installed, saved, and remain disabled. It is imported into each example
*/

/*
GMM_In Focus is practical use of the GMM.Connect.IP() Class

This Macro was made for Webex Room Devices in a Lab Environment

For those who are familiar with working on multiple Room Device in a lab environment
  you know that the Ultrasound Level interfere with testing on a particular device and
  calling out "Ok Webex" to invoke the assistant can be problematic in a lab

GMM_In Focus provides a panel button on your device that allows you to place this system into "Focus"
  Meaning, you're ready to work on this device

When a device is in focus, Audio Ultrasound is set to 70 and the Wakeword for Webex Assistant is enabled
  Using GMM, a message is sent to all other devices outlined below to set Audio Ultrasound to 0
  and to disable the Wakeword for Webex assistant

Giving anyone who's working diligently in a lab, the ability to switch to a device they need to "Focus" On
  Without needing to manually adjust the config of all other devices in your lab

To install, simply edit the config below to match your Labs System, and install this macro and the GMM_Lib
  on each device in your lab
  Only this macro needs to be active on your devices, leave GMM_Lib inactive in your Macro Editor
*/

import xapi from 'xapi';
import { GMM } from './GMM_Lib'


//We set up a config, where we provide the Auth for all lab endpoints
const config = {
  cred: {
    Username: 'admin',
    Password: 'super_secret_code'
  },
  //Here we list all out devices and provide their IP
  //Include all your devices, even the device this is hosted on
  //  We handle the unnecessary IP below, so you can have identical scripts across all devices
  //  No need to modify this per endpoint :) 
  //Add in as many devices as you need for your lab
  //  I have 6, hence why there are 6 below
  labDevices: {
    DeskPro: '0.0.0.2',
    RoomKitMini: '0.0.0.3',
    RoomKit: '.0.0.04',
    RoomKitPro: '.0.0.05',
    Room55: '0.0.0.6',
    Sx80: '0.0.0.7'
  }
}

//This function places the system into Focus
async function enterFocus() {
  xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: 'focus_on_me', Visibility: 'Hidden' })
  xapi.Command.UserInterface.Message.Alert.Display({ Title: 'System Entered Focus', Text: 'Access to Webex Assistant and Ultrasound Pairing enabled', Duration: 5 })
  xapi.Config.Audio.Ultrasound.MaxVolume.set(70)
  xapi.Config.VoiceControl.Wakeword.Mode.set('On')
  console.log({ Message: 'System Entered Focus' })
  try {
    await messageLab.command('exitFocus').post()
  } catch (e) { console.debug(e) }
  await GMM.write('inFocus', true)
}

//This function places the system out of Focus
async function exitFocus() {
  xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: 'focus_on_me', Visibility: 'Auto' })
  xapi.Command.UserInterface.Message.Alert.Display({ Title: 'System Lost Focus', Text: 'Access to Webex Assistant and Ultrasound Pairing disabled', Duration: 5 })
  await GMM.write('inFocus', false)
  xapi.Config.Audio.Ultrasound.MaxVolume.set(0)
  xapi.Config.VoiceControl.Wakeword.Mode.set('Off')
  console.log({ Message: 'System Exited Focus' })
}

// messageLab will be the object we instantiate our GMM.Connect.IP() class
// We call it here, because it's later given a value in the init() function below
var messageLab = ''

//We use GMM to store a custom state using Memory
//This state allows us to recover our Focus on Reboot
async function init() {
  //Identify out own IPv4, so we know to exclude it from our messaging
  const self = await xapi.Status.Network[1].IPv4.Address.get()
  
  //Establishing Memory, to be sure the Memory_Storage Macro exists
  await GMM.memoryInit()
  var state = false
  try { 
    //Then, we try to read the current state
    state = await GMM.read('inFocus') 
  } catch (e) { 
    //If we error out, this could be because this is the first time
    //The script has run, so we'll write an initial default stat of false
    await GMM.write('inFocus', false); state = false; 
  }
  
  //Then we build the UI
  await buildUI()
  
  //Depending on the state of Focus the device is in, we'll hide or show the "Place into Focus" panel button
  if (!state) {
    xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: 'focus_on_me', Visibility: 'Auto' })
    xapi.Config.Audio.Ultrasound.MaxVolume.set(0)
    xapi.Config.VoiceControl.Wakeword.Mode.set('Off')
  } else {
    xapi.Config.Audio.Ultrasound.MaxVolume.set(70)
    xapi.Config.VoiceControl.Wakeword.Mode.set('On')
  }
  
  //We're ready instantiate out GMM.Connect.IP() Class, so we can communicate to the devices in our lab
  messageLab = new GMM.Connect.IP(config.cred.Username, config.cred.Password, formIPArray(self))
  console.log({ Message: 'Init Complete', Status: `${state == true ? 'In Focus, Ultrasound set to Default Level, Webex Assistant Enabled': 'Out of Focus, Ultrasound set to 0, Webex Assistant Disabled'}` })
}

init()


//Here, we convert the Nested JSON table in the Config above
//  into an array that's consumable by GMM.Connect.IP()
function formIPArray(self) {
  const dev = Object.getOwnPropertyNames(config.labDevices)
  var list = []
  for (let i = 0; i < dev.length; i++) {
    if (config.labDevices[dev[i]] != self) {
      list.push(config.labDevices[dev[i]])
    }
  }
  return list
}

//Listens for when the "Place into Focus" panel is pressed
xapi.Event.UserInterface.Extensions.Panel.Clicked.on(event => {
  switch (event.PanelId) {
    case 'focus_on_me':
      enterFocus()
      break;
  }
})

//Used to listen for a message from another device, requesting to be in focus
GMM.Event.Receiver.on(event => {
  switch (event.App) {
    case module.name.replace('./', ''):
      if (event.Type == 'Command' && event.Value == 'exitFocus') {
        exitFocus()
      }
      break;
  }
})

//Constructs the User Interface of the In Focus macro
async function buildUI() {
  const xml = `<Extensions><Panel><Type>Statusbar</Type><Icon>Info</Icon><Color>#ad5baa</Color><Name>Place into Focus</Name><ActivityType>Custom</ActivityType></Panel></Extensions>`
  await xapi.Command.UserInterface.Extensions.Panel.Save({
    PanelId: 'focus_on_me'
  }, xml)
  await xapi.Command.UserInterface.Extensions.Panel.Update({ PanelId: 'focus_on_me', Visibility: 'Hidden' })
  console.debug({ Message: 'UI Built' })
}
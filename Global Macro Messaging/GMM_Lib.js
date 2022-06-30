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
 * Special Thanks:          Zacharie Gignac
 *                          Université Laval
 *                          - Contributions made to the 
 *                            original Memory_Functions have 
 *                            been merged in GMM_Lib version 1.7.0
 * 
 * Released: May 16, 2022
 * Updated: June 30, 2022
 * 
 * Version: 1.9.2
*/

import xapi from 'xapi';

export const GMM = {
  //Config Start
  Config: {
    queueInternvalInMs: 250, // Interval in Milliseconds which the queue processes each request. Default: 250
  },
  //Config End, do not edit below this line
  DevConfig: {
    version: '1.9.2'
  },
  DevAssets: {
    queue: [],
    regex: /[\\]*"Auth[\\]*"\s*:\s*[\\]*"([a-zA-Z0-9\/\+\=\_\-]*)\s*[\\]*"/gm,
    mem: {
      storage: 'Memory_Storage',
      base: {
        './GMM_Lib_Info': {
          Warning: 'DO NOT MODIFY THIS FILE. It is accessed by multiple scripts running on this device',
          Description: {
            1: 'Memory_Storage is accessed by either the Memory_Functions Macro or the GMM_Lib Macro to store and retreive data for various customizations',
            2: 'GMM_Lib has merged the Read and Write functions of Memory Functions',
            Guides: {
              Memory_Functions: 'https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/tree/master/Macro%20Memory%20Storage',
              GMM_Lib: ''
            }
          },
          ExampleData: {
            Key: 'Value',
            biggerKey: {
              More: 'Values'
            }
          }
        }
      }
    }
  },
  memoryInit: async function () {
    try {
      await xapi.Command.Macros.Macro.Get({ Name: GMM.DevAssets.mem.storage })
    } catch (e) {
      console.warn(`Uh-Oh, no Memory Storage Found, building ${GMM.DevAssets.mem.storage}`)
      await xapi.Command.Macros.Macro.Save({ Name: GMM.DevAssets.mem.storage }, `var memory = ${JSON.stringify(GMM.DevAssets.mem.base, null, 2)}`)
    }
    return new Promise(resolve => {
      resolve()
    })
  },
  read: async function (key) {
    const location = module.require.main.name.replace('./', '')
    var macro = ''
    try {
      macro = await xapi.Command.Macros.Macro.Get({ Name: GMM.DevAssets.mem.storage, Content: 'True' })
    } catch (e) { }
    return new Promise((resolve, reject) => {
      const raw = macro.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
      let data = JSON.parse(raw);
      let temp;
      if (data[location] == undefined) {
        data[location] = {};
        temp = data[location];
      } else {
        temp = data[location];
      }
      if (temp[key] != undefined) {
        resolve(temp[key]);
      } else {
        reject(new Error(`Local Read Error. Object: [${key}] was not found in [${GMM.DevAssets.mem.storage}] for Macro [${location}]`))
      }
    })
  },
  write: async function (key, value) {
    const location = module.require.main.name.replace('./', '')
    var macro = ''
    try {
      macro = await xapi.Command.Macros.Macro.Get({ Name: GMM.DevAssets.mem.storage, Content: 'True' })
    } catch (e) { };
    return new Promise((resolve) => {
      const raw = macro.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
      let data = JSON.parse(raw);
      let temp;
      if (data[location] == undefined) {
        data[location] = {};
        temp = data[location];
      } else {
        temp = data[location];
      }
      temp[key] = value;
      data[location] = temp;
      const newStore = JSON.stringify(data, null, 2);
      xapi.Command.Macros.Macro.Save({ Name: GMM.DevAssets.mem.storage }, `var memory = ${newStore}`).then(() => {
        console.debug(`Local Write Complete => ${location}: {"${key}" : "${value}"}`);
        resolve(value);
      });
    })
  },
  Message: {
    Webex: {
      User: class {
        constructor(CommonBotToken, ...userEmail_Array) {
          this.Params = {
            Url: 'https://webexapis.com/v1/messages',
            Header: ['Content-Type: application/json', 'Authorization: Bearer ' + CommonBotToken,],
            AllowInsecureHTTPS: 'True'
          }
          this.group = userEmail_Array.toString().split(',')
          xapi.Config.HttpClient.Mode.set('On')
          xapi.Config.HttpClient.AllowInsecureHTTPS.set('True')
          console.warn({ '⚠ Warning ⚠': `The HTTPClient has been enabled by instantiating an object with the GMM.Message.Webex.User class found in the ${module.name.replace('./', '')} macro` })
          console.error({ '⚠ Warning ⚠': `Be sure to securely store your bot token. It is POOR PRACTICE to store any authentication tokens within a Macro` })
        }
        body(message) {
          this.message = `- - -\n# Message:\n${message}`
          return this
        }
        formattedBody(title = 'Title', subtitle = 'Subtitle', body = 'Message Body', data = '', footer = '') {
          this.message = `- - -\n- - -\n# ${title}\n### ${subtitle}\n **----------------------------------** \n${body}\n${data == '' ? '' : `\`\`\`\n${data}\n\`\`\`\n`}${footer = '' ? '' : `_${footer}_`}\n`
          return this
        }
        async post() {
          const deviceSerial = await xapi.Status.SystemUnit.Hardware.Module.SerialNumber.get()
          const name = await xapi.Status.UserInterface.ContactInfo.Name.get()
          const ip = await xapi.Status.Network[1].IPv4.Address.get().catch(async e => {
            console.debug(e)
            const IPv6 = await xapi.Status.Network[1].IPv6.Address.get()
            return IPv6
          })
          var groupError = []
          for (let i = 0; i < this.group.length; i++) {
            try {
              const body = {
                "toPersonEmail": this.group[i],
                "markdown": this.message + `\n **---------------------------------------** \n **[ Device Info ]-------------------------** \n DisplayName: ${name}\nSerial: ${deviceSerial}\nAddress: [${ip}](https://${ip}/)\nTimestamp: ${new Date()}\nMacro(App): ${module.require.main.name.replace('./', '')}`
              }
              const request = await xapi.Command.HttpClient.Post(this.Params, JSON.stringify(body))
              console.debug({ Message: `Message sent to [${this.group[i]}] on the Webex App`, Message: this.message, Response: `${request.StatusCode}:${request.status}` })
            } catch (e) {
              e['GMM_Context'] = {
                Destination: this.group[i],
                Message: 'Failed to send message to Webex User',
                PossibleSolution: 'Invite this user to Webex or else this bot can not send messages to this user'
              }
              groupError.push(e)
            }
          }
          if (groupError.length > 0) {
            throw groupError
          }
        }
      },
      Room: class {
        constructor(CommonBotToken, ...roomId_Array) {
          this.Params = {
            Url: 'https://webexapis.com/v1/messages',
            Header: ['Content-Type: application/json', 'Authorization: Bearer ' + CommonBotToken,],
            AllowInsecureHTTPS: 'True'
          }
          this.group = roomId_Array.toString().split(',')
          console.warn({ '⚠ Warning ⚠': `The HTTPClient has been enabled by instantiating an object with the GMM.Message.Webex.Room class found in the ${module.name.replace('./', '')} macro` })
          console.error({ '⚠ Warning ⚠': `Be sure to securely store your bot token. It is POOR PRACTICE to store any authentication tokens within a Macro` })
        }
        body(message) {
          this.message = `- - -\n# Message:\n${message}`
          return this
        }
        formattedBody(title = 'Title', subtitle = 'Subtitle', body = 'Message Body', data = '', footer = '') {
          this.message = `- - -\n- - -\n# ${title}\n### ${subtitle}\n **----------------------------------** \n${body}\n${data == '' ? '' : `\`\`\`\n${data}\n\`\`\`\n`}${footer = '' ? '' : `_${footer}_`}\n`
          return this
        }
        async post() {
          const deviceSerial = await xapi.Status.SystemUnit.Hardware.Module.SerialNumber.get()
          const name = await xapi.Status.UserInterface.ContactInfo.Name.get()
          const ip = await xapi.Status.Network[1].IPv4.Address.get().catch(async e => {
            console.debug(e)
            const IPv6 = await xapi.Status.Network[1].IPv6.Address.get()
            return IPv6
          })
          var groupError = []
          for (let i = 0; i < this.group.length; i++) {
            try {
              const body = {
                "roomId": this.group[i],
                "markdown": this.message + `\n **---------------------------------------** \n **[ Device Info ]-------------------------** \n DisplayName: ${name}\nSerial: ${deviceSerial}\nAddress: [${ip}](https://${ip}/)\nTimestamp: ${new Date()}\nMacro(App): ${module.require.main.name.replace('./', '')}`
              }
              const request = await xapi.Command.HttpClient.Post(this.Params, JSON.stringify(body))
              console.debug({ Message: `Message sent to [${this.group[i]}] on the Webex App`, Message: this.message, Response: `${request.StatusCode}:${request.status}` })
            } catch (e) {
              e['GMM_Context'] = {
                Destination: this.group[i],
                Message: 'Failed to send message to Webex Room',
                PossibleSolution: 'Invite this bot to that Webex Room Destination, or else it can not send messages to the room'
              }
              groupError.push(e)
            }
          }
          if (groupError.length > 0) {
            throw groupError
          }
        }
      }
    }
  },
  Connect: {
    Local: class {
      constructor() {
        this.App = module.require.main.name.replace('./', '')
        this.Payload = { App: this.App, Source: { Type: 'Local', Id: 'localhost' }, Type: '', Value: '' }
      }
      status(message) {
        if (message == undefined || message == '') {
          throw new Error(`Message parameter not fullfilled in .status(message) method. It must contain string or JSON Object Literal`)
        }

        this.Payload['Type'] = 'Status'
        this.Payload['Value'] = message
        return this
      }
      error(message) {
        if (message == undefined || message == '') {
          throw new Error(`Message parameter not fullfilled in .error(message) method. It must contain string or JSON Object Literal`)
        }

        this.Payload['Type'] = 'Error'
        this.Payload['Value'] = message
        return this
      }
      command(message) {
        if (message == undefined || message == '') {
          throw new Error(`Message parameter not fullfilled in .command(message) method. It must contain string or JSON Object Literal`)
        }
        this.Payload['Type'] = 'Command'
        this.Payload['Value'] = message
        return this
      }
      async queue() {
        GMM.DevAssets.queue.push({ Payload: JSON.parse(JSON.stringify(this.Payload)), Type: 'Local', Id: '_local' })
        console.debug({ Message: `Local Payload queued`, Payload: JSON.stringify(this.Payload) })
      }
      async post() {
        await xapi.Command.Message.Send({ Text: JSON.stringify(this.Payload) })
        console.debug({ Message: `Local [Command] sent from [${this.App}]`, Payload: JSON.stringify(this.Payload) })
      }
    },
    IP: class {
      constructor(CommonUsername, CommonPassword, ...ipArray) {
        this.Params = {
          Url: ``,
          Header: ['Content-Type: text/xml', `Authorization: Basic ${btoa(CommonUsername + ':' + CommonPassword)}`],
          AllowInsecureHTTPS: 'True'
        }
        this.Payload = { App: module.require.main.name.replace('./', ''), Source: { Type: 'Remote_IP', Id: '' }, Type: '', Value: '' }
        this.group = ipArray.toString().split(',')
        xapi.Config.HttpClient.Mode.set('On')
        xapi.Config.HttpClient.AllowInsecureHTTPS.set('True')
        console.warn({ '⚠ Warning ⚠': `The HTTPClient has been enabled by instantiating an object with the GMM.Connect.IP class found in the ${module.name.replace('./', '')} macro` })
        console.error({ '⚠ Warning ⚠': `Be sure to securely store your device credentials. It is POOR PRACTICE to store any credentials within a Macro` })
      }
      status(message) {
        if (message == undefined || message == '') {
          throw new Error(`Message parameter not fullfilled in .status(message) method. It must contain string or JSON Object Literal`)
        }
        this.Payload['Type'] = 'Status'
        this.Payload.Value = message
        return this
      }
      error(message) {
        if (message == undefined || message == '') {
          throw new Error(`Message parameter not fullfilled in .error(message) method. It must contain string or JSON Object Literal`)
        }
        this.Payload['Type'] = 'Error'
        this.Payload['Value'] = message
        return this
      }
      command(message) {
        if (message == undefined || message == '') {
          throw new Error(`Message parameter not fullfilled in .command(message) method. It must contain string or JSON Object Literal`)
        }
        this.Payload['Type'] = 'Command'
        this.Payload['Value'] = message
        return this
      }
      passIP(stack = 'v4') {
        if (stack != 'v4' && stack != 'v6') {
          throw new Error(`[${stack}] is an invalid IPstack. Accepted Values for the method .passIP(stack) are "v4" or "v6"`)
        }
        this.Payload.Source[`IP`] = stack
        return this
      }
      passAuth(username = '', password = '') {
        if (username == '') {
          throw new Error('Username parameter was missing from method: .passAuth(username, password)')
        }
        if (password == '') {
          throw new Error('Password parameter was missing from method: .passAuth(username, password)')
        }
        this.Payload.Source['Auth'] = btoa(`${username}:${password}`)
        console.error({ '⚠ Warning ⚠': `The passAuth() method has been applied to this payload`, Value: this.Payload.Value })
        return this
      }
      async queue(id) {
        this.Payload.Source.Id = await xapi.Status.SystemUnit.Hardware.Module.SerialNumber.get()
        if (typeof this.Payload.Source.IP != 'undefined') {
          var temp = JSON.stringify(this.Payload.Source.IP).replace(/"/g, '')
          this.Payload.Source[`IP${this.Payload.Source.IP}`] = await xapi.Status.Network[1][`IP${this.Payload.Source.IP}`].Address.get()
          delete this.Payload.Source.IP
        }
        for (let i = 0; i < this.group.length; i++) {
          this.Params.Url = `https://${this.group[i]}/putxml`
          const body = `<Command><Message><Send><Text>${JSON.stringify(this.Payload)}</Text></Send></Message></Command>`
          GMM.DevAssets.queue.push({ Params: JSON.parse(JSON.stringify(this.Params)), Body: body, Device: this.group[i], Type: 'Remote_IP', Id: `${id}` })
          console.debug({ Message: `Remote_IP message queued for [${this.group[i]}]`, Payload: JSON.stringify(this.Payload).replace(GMM.DevAssets.regex, `"Auth":"***[HIDDEN]***"`) })
        }
        delete this.Payload.Source[`IP${temp}`]
        delete this.Payload.Source.Auth
      }
      async post() {
        this.Payload.Source.Id = await xapi.Status.SystemUnit.Hardware.Module.SerialNumber.get()
        if (typeof this.Payload.Source.IP != 'undefined') {
          var temp = JSON.stringify(this.Payload.Source.IP).replace(/"/g, '')
          this.Payload.Source[`IP${this.Payload.Source.IP}`] = await xapi.Status.Network[1][`IP${this.Payload.Source.IP}`].Address.get()
          delete this.Payload.Source.IP
        }
        var groupError = []
        for (let i = 0; i < this.group.length; i++) {
          this.Params.Url = `https://${this.group[i]}/putxml`
          const body = `<Command><Message><Send><Text>${JSON.stringify(this.Payload)}</Text></Send></Message></Command>`
          try {
            const request = await xapi.Command.HttpClient.Post(this.Params, body)
            console.debug({ Message: `Remote_IP message sent to [${this.group[i]}]`, Payload: JSON.stringify(this.Payload).replace(GMM.DevAssets.regex, `"Auth":"***[HIDDEN]***"`), Response: `${request.StatusCode}:${request.status}` })
          } catch (e) {
            e['GMM_Context'] = {
              Destination: this.group[i],
              Message: {
                Type: this.Payload.Type,
                Value: this.Payload.Value,
                Payload: JSON.stringify(body).replace(GMM.DevAssets.regex, `"Auth":"***[HIDDEN]***"`)
              }
            }
            groupError.push(e)
          }
        }
        delete this.Payload.Source[`IP${temp}`]
        delete this.Payload.Source.Auth
        if (groupError.length > 0) {
          throw groupError
        }
      }
    },
    Webex: class {
      constructor(CommonBotToken, ...deviceIdArray) {
        this.Params = {
          Url: `https://webexapis.com/v1/xapi/command/Message.Send`,
          Header: [`Authorization: Bearer ${CommonBotToken}`, 'Content-Type: application/json'],
          AllowInsecureHTTPS: 'True'
        }
        this.Payload = { App: module.require.main.name.replace('./', ''), Source: { Type: 'Remote_Webex', Id: '' }, Type: '', Value: '' }
        this.group = deviceIdArray.toString().split(',')
        this.Auth = btoa(CommonBotToken)
        xapi.Config.HttpClient.Mode.set('On')
        xapi.Config.HttpClient.AllowInsecureHTTPS.set('True')
        console.warn({ '⚠ Warning ⚠': `The HTTPClient has been enabled by instantiating an object with the GMM.Connect.Webex class found in the ${module.name.replace('./', '')} macro` })
        console.error({ '⚠ Warning ⚠': `Be sure to securely store your bot token. It is POOR PRACTICE to store any authentication tokens within a Macro` })
      }
      status(message) {
        if (message == undefined || message == '') {
          throw new Error(`Message parameter not fullfilled in .status(message) method. It must contain string or JSON Object Literal`)
        }
        this.Payload['Type'] = 'Status'
        this.Payload.Value = message
        return this
      }
      error(message) {
        if (message == undefined || message == '') {
          throw new Error(`Message parameter not fullfilled in .error(message) method. It must contain string or JSON Object Literal`)
        }
        this.Payload['Type'] = 'Error'
        this.Payload['Value'] = message
        return this
      }
      command(message) {
        if (message == undefined || message == '') {
          throw new Error(`Message parameter not fullfilled in .command(message) method. It must contain string or JSON Object Literal`)
        }
        this.Payload['Type'] = 'Command'
        this.Payload['Value'] = message
        return this
      }
      passDeviceId() {
        this.passId = true
        return this
      }
      passToken(newToken = '') {
        if (newToken != '') {
          this.Payload.Source['Auth'] = newToken
        } else {
          this.Payload.Source['Auth'] = atob(this.Auth.toString())
        }
        console.error({ '⚠ Warning ⚠': `The passToken() method has been applied to this payload and will be sent to the following group of devices`, Group: JSON.stringify(this.group), Value: this.Payload.Value, Reminder: 'Be sure to securely store your bot token. It is POOR PRACTICE to store a any authentication tokens within a Macro' })
        return this
      }
      async queue(id) {
        this.Payload.Source.Id = await xapi.Status.SystemUnit.Hardware.Module.SerialNumber.get()
        var discoverDeviceId = async function (header, serial) {
          try {
            const url = `https://webexapis.com/v1/devices?serial=${serial}`
            const request = await xapi.Command.HttpClient.Get({
              Url: url,
              Header: header,
              AllowInsecureHTTPS: 'True'
            })
            return JSON.parse(request.Body)
          } catch (e) {
            console.error({ Error: e.message, StatusCode: e.data.StatusCode, Message: 'Device ID request failed, returning as [not found]' })
            return { items: [] }
          }
        }
        if (typeof this.passId != 'undefined') {
          var temp = await discoverDeviceId(this.Params.Header, this.Payload.Source.Id)
          this.Payload.Source['DeviceId'] = temp.items == '' ? 'Not Found' : temp.items[0].id
        }
        this.Payload.Source.Id = await xapi.Status.SystemUnit.Hardware.Module.SerialNumber.get()
        for (let i = 0; i < this.group.length; i++) {
          const body = { deviceId: this.group[i], arguments: { Text: JSON.stringify(this.Payload) } }
          GMM.DevAssets.queue.push({ Params: this.Params, Body: JSON.stringify(body), Device: this.group[i], Type: 'Remote_Webex', Id: `${id}` })
          console.debug({ Message: `Remote_Webex message queued for [${this.group[i]}]`, Payload: JSON.stringify(this.Payload).replace(GMM.DevAssets.regex, `"Auth":"***[HIDDEN]***"`) })
        }
        delete this.Payload.Source.DeviceId
        delete this.Payload.Source.Auth
      }
      async post() {
        this.Payload.Source.Id = await xapi.Status.SystemUnit.Hardware.Module.SerialNumber.get()
        var discoverDeviceId = async function (header, serial) {
          try {
            const url = `https://webexapis.com/v1/devices?serial=${serial}`
            const request = await xapi.Command.HttpClient.Get({
              Url: url,
              Header: header,
              AllowInsecureHTTPS: 'True'
            })
            return JSON.parse(request.Body)
          } catch (e) {
            console.error({ Error: e.message, StatusCode: e.data.StatusCode, Message: 'Device ID request failed, returning as [not found]' })
            return { items: [] }
          }
        }
        if (typeof this.passId != 'undefined') {
          var temp = await discoverDeviceId(this.Params.Header, this.Payload.Source.Id)
          this.Payload.Source['DeviceId'] = temp.items == '' ? 'Not Found' : temp.items[0].id
        }
        var groupError = []
        for (let i = 0; i < this.group.length; i++) {
          const body = { deviceId: this.group[i], arguments: { Text: JSON.stringify(this.Payload) } }
          try {
            const request = await xapi.Command.HttpClient.Post(this.Params, JSON.stringify(body))
            console.debug({ Message: `Remote_Webex message sent to [${this.group[i]}]`, Payload: JSON.stringify(this.Payload).replace(GMM.DevAssets.regex, `"Auth":"***[HIDDEN]***"`), Response: `${request.StatusCode}:${request.status}` })
          } catch (e) {
            e['GMM_Context'] = {
              Destination: this.group[i],
              Message: {
                Type: this.Payload.Type,
                Value: this.Payload.Value,
                Payload: JSON.stringify(body).replace(GMM.DevAssets.regex, `"Auth":"***[HIDDEN]***"`)
              }
            }
            groupError.push(e)
          }
        }
        delete this.Payload.Source.DeviceId
        delete this.Payload.Source.Auth
        if (groupError.length > 0) {
          throw groupError
        }
      }
    }
  },
  Event: {
    Receiver: {
      on: function (callback) {
        xapi.Event.Message.Send.on(event => {
          console.debug(event.Text)
          callback(JSON.parse(event.Text))
        })
      },
      once: function (callback) {
        xapi.Event.Message.Send.once(event => {
          console.debug(event.Text)
          callback(JSON.parse(event.Text))
        })
      }
    },
    Schedule: {
      on: function (timeOfDay = '00:00', callBack) {
        //Reference
        //https://github.com/CiscoDevNet/roomdevices-macros-samples/blob/master/Scheduled%20Actions/Scheduler.js
        const [hour, minute] = timeOfDay.replace('.', ':').split(':');
        const now = new Date();
        const parseNow = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        let difference = parseInt(hour) * 3600 + parseInt(minute) * 60 - parseNow;
        if (difference <= 0) {
          difference += 24 * 3600
        };
        console.debug({ Message: `Scheduled Event subscription set for ${timeOfDay} will fire in ${difference} seconds` })
        return setTimeout(function () {
          const message = { Message: `[${timeOfDay}] Scheduled event fired` }
          callBack(message)
          setTimeout(function () {
            GMM.Event.Schedule.on(timeOfDay, callBack)
          }, 1000)
        }, difference * 1000);
      },
      once: function (timeOfDay = '00:00', callBack) {
        const [hour, minute] = timeOfDay.replace('.', ':').split(':');
        const now = new Date();
        const parseNow = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
        let difference = parseInt(hour) * 3600 + parseInt(minute) * 60 - parseNow;
        if (difference <= 0) {
          difference += 24 * 3600
        };
        console.debug({ Message: `Scheduled Event set for ${timeOfDay} will fire in ${difference} seconds` })
        return setTimeout(function () {
          const message = { Message: `[${timeOfDay}] Scheduled event fired` }
          callBack(message)
        }, difference * 1000);
      }
    },
    Queue: {
      on: async function (callBack) {
        const message = {}
        const remainingIds = function () { var pool = []; for (let i = 0; i < GMM.DevAssets.queue.length; i++) { pool.push(GMM.DevAssets.queue[i].Id) }; return pool; }
        if (GMM.DevAssets.queue.length > 0) {
          switch (GMM.DevAssets.queue[0].Type) {
            case 'Local':
              await xapi.Command.Message.Send({ Text: JSON.stringify(GMM.DevAssets.queue[0].Payload) })
              message['Queue_ID'] = GMM.DevAssets.queue[0].Id
              console.debug({ Message: `${GMM.DevAssets.queue[0].Type} Queue ID [${GMM.DevAssets.queue[0].Id}] processed`, Payload: GMM.DevAssets.queue[0].Payload })
              GMM.DevAssets.queue.shift()
              message['QueueStatus'] = { RemainingRequests: GMM.DevAssets.queue.length == 0 ? 'Clear' : GMM.DevAssets.queue.length, IdPool: remainingIds(), CurrentDelay: `${GMM.Config.queueInternvalInMs} ms` }
              callBack(message)
              break;
            case 'Remote_IP':
              try {
                const request_ip = await xapi.Command.HttpClient.Post(GMM.DevAssets.queue[0].Params, GMM.DevAssets.queue[0].Body)
                message['Queue_ID'] = GMM.DevAssets.queue[0].Id
                message['Response'] = request_ip
                console.debug({ Message: `${GMM.DevAssets.queue[0].Type} Queue ID [${GMM.DevAssets.queue[0].Id}] processed and sent to [${GMM.DevAssets.queue[0].Device}]`, Payload: GMM.DevAssets.queue[0].Body.replace(GMM.DevAssets.regex, `"Auth":"***[HIDDEN]***"`), Response: `${request_ip.StatusCode}:${request_ip.status}` })
                GMM.DevAssets.queue.shift()
                message['QueueStatus'] = { RemainingRequests: GMM.DevAssets.queue.length == 0 ? 'Empty' : GMM.DevAssets.queue.length, IdPool: remainingIds(), CurrentDelay: `${GMM.Config.queueInternvalInMs} ms` }
                callBack(message)
              } catch (e) {
                message['Queue_ID'] = GMM.DevAssets.queue[0].Id
                message['Response'] = e
                console.debug({ Message: `${GMM.DevAssets.queue[0].Type} Queue ID [${GMM.DevAssets.queue[0].Id}] processed and sent to [${GMM.DevAssets.queue[0].Device}]`, Payload: GMM.DevAssets.queue[0].Body.replace(GMM.DevAssets.regex, `"Auth":"***[HIDDEN]***"`), Response: `${request_ip.StatusCode}:${request_ip.status}` })
                GMM.DevAssets.queue.shift()
                message['QueueStatus'] = { RemainingRequests: GMM.DevAssets.queue.length == 0 ? 'Empty' : GMM.DevAssets.queue.length, IdPool: remainingIds(), CurrentDelay: `${GMM.Config.queueInternvalInMs} ms` }
                callBack(message)
                console.error({ Error: e.message, StatusCode: e.data.StatusCode, Message: `${GMM.DevAssets.queue[0].Type} Queue ID [${GMM.DevAssets.queue[0].Id}] processed and erred on [${GMM.DevAssets.queue[0].Device}]`, Payload: GMM.DevAssets.queue[0].Body.replace(GMM.DevAssets.regex, `"Auth":"***[HIDDEN]***"`) })
              }
              break;
            case 'Remote_Webex':
              try {
                const request_webex = await xapi.Command.HttpClient.Post(GMM.DevAssets.queue[0].Params, GMM.DevAssets.queue[0].Body)
                message['Queue_ID'] = GMM.DevAssets.queue[0].Id
                message['Response'] = request_webex
                console.debug({ Message: `${GMM.DevAssets.queue[0].Type} Queue ID [${GMM.DevAssets.queue[0].Id}] processed and sent to [${GMM.DevAssets.queue[0].Device}]`, Payload: GMM.DevAssets.queue[0].Body.replace(GMM.DevAssets.regex, `\\"Auth\\":\\"***[HIDDEN]***\\"`), Response: `${request_webex.StatusCode}:${request_webex.status}` })
                GMM.DevAssets.queue.shift()
                message['QueueStatus'] = { RemainingRequests: GMM.DevAssets.queue.length == 0 ? 'Empty' : GMM.DevAssets.queue.length, IdPool: remainingIds(), CurrentDelay: `${GMM.Config.queueInternvalInMs} ms` }
                callBack(message)
              } catch (e) {
                message['Queue_ID'] = GMM.DevAssets.queue[0].Id
                message['Response'] = e
                console.debug({ Message: `${GMM.DevAssets.queue[0].Type} Queue ID [${GMM.DevAssets.queue[0].Id}] processed and sent to [${GMM.DevAssets.queue[0].Device}]`, Payload: GMM.DevAssets.queue[0].Body.replace(GMM.DevAssets.regex, `\\"Auth\\":\\"***[HIDDEN]***\\"`), Response: `${request_webex.StatusCode}:${request_webex.status}` })
                GMM.DevAssets.queue.shift()
                message['QueueStatus'] = { RemainingRequests: GMM.DevAssets.queue.length == 0 ? 'Empty' : GMM.DevAssets.queue.length, IdPool: remainingIds(), CurrentDelay: `${GMM.Config.queueInternvalInMs} ms` }
                callBack(message)
                console.error({ Error: e.message, StatusCode: e.data.StatusCode, Message: `${GMM.DevAssets.queue[0].Type} Queue ID [${GMM.DevAssets.queue[0].Id}] processed and erred on [${GMM.DevAssets.queue[0].Device}]`, Payload: GMM.DevAssets.queue[0].Body.replace(GMM.DevAssets.regex, `"Auth":"***[HIDDEN]***"`) })
              }
              break;
            default:
              break;
          }
        } else {
          callBack({ QueueStatus: { RemainingRequests: 'Empty', IdPool: [], CurrentDelay: `${GMM.Config.queueInternvalInMs} ms` } })
        }
        setTimeout(function () {
          GMM.Event.Queue.on(callBack)
        }, GMM.Config.queueInternvalInMs)
      }
    }
  }
}

GMM.read.global = async function (key) {
  const location = module.require.main.name.replace('./', '')
  var macro = ''
  try {
    macro = await xapi.Command.Macros.Macro.Get({ Name: GMM.DevAssets.mem.storage, Content: 'True' })
  } catch (e) { }
  return new Promise((resolve, reject) => {
    let raw = macro.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{')
    let data = JSON.parse(raw)
    if (data[key] != undefined) {
      resolve(data[key])
    } else {
      reject(new Error(`Global Read Error. Object: [${key}] was not found in [${GMM.DevAssets.mem.storage}] for Macro [${location}]`))
    }
  });
}

GMM.read.all = async function () {
  const location = module.require.main.name.replace('./', '')
  var macro = ''
  try {
    macro = await xapi.Command.Macros.Macro.Get({ Name: GMM.DevAssets.mem.storage, Content: 'True' })
  } catch (e) { }
  return new Promise((resolve, reject) => {
    let raw = macro.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{')
    let data = JSON.parse(raw)
    if (data != undefined) {
      resolve(data)
    } else {
      reject(new Error(`All Read Error. Nothing found in [${GMM.DevAssets.mem.storage}] for Macro [${location}]`))
    }
  });
}

GMM.write.global = async function (key, value) {
  const location = module.require.main.name.replace('./', '')
  var macro = ''
  try {
    macro = await xapi.Command.Macros.Macro.Get({ Name: GMM.DevAssets.mem.storage, Content: 'True' })
  } catch (e) { }
  return new Promise(resolve => {
    let raw = macro.Macro[0].Content.replace(/var.*memory.*=\s*{/g, '{');
    let data = JSON.parse(raw);
    data[key] = value;
    let newStore = JSON.stringify(data, null, 4);
    xapi.Command.Macros.Macro.Save({ Name: GMM.DevAssets.mem.storage }, `var memory = ${newStore}`).then(() => {
      console.debug(`Global Write Complete => ${location}: {"${key}" : "${value}"}`);
      resolve(value);
    });
  });
}
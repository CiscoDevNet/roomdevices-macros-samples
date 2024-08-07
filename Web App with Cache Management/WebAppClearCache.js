/********************************************************
Copyright (c) 2024 Cisco and/or its affiliates.
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

 * Author(s):               
 *               Jacob Miller
 *               Solutions Engineer
 *               Cisco Systems
*/

import xapi from 'xapi';

// Ensure WebGL is enabled
xapi.Config.WebEngine.Features.WebGL.set('On');

// CUSTOMIZE THESE VARIABLES!!!!!!!

// To disable user prompt and automatically clear data without prompting, set this to true.
const autoClear = false;

// Seconds for prompt to display before auto-clearing.

const waitTimer = 20;

// END VARIABLES


async function init() {
  // Monitor WebView status
  monitorWebView();
}

// Monitor WebView status for closure and prompt for login deletion
function monitorWebView() {
  xapi.Status.UserInterface.WebView.on((update) => {
    if (update.Status === 'NotVisible') {
      if (autoClear === true) {
        deleteCredentials();
      }
      else {
        // Clear cached logins upon closure of WebView
        xapi.Command.UserInterface.Message.Prompt.Display({
              Title: 'Clear Login?',
              Text: 'Would you like to delete your stored login?',
              FeedbackId: 'clearCache',
              Duration: waitTimer,
              "Option.1": 'Yes',
              "Option.2": 'No',
          })
  
        // Delete credentials if user answers 'Yes'
        xapi.Event.UserInterface.Message.Prompt.Response.on((event) => {
          if (event.OptionId === '1') {
            deleteCredentials();
          }
        })
  
        // Delete credentials if prompt times out
        xapi.Event.UserInterface.Message.Prompt.Cleared.on(value => {
          if (value.id === '1') {
            deleteCredentials();
          }
        })
      }

    }
  });
}

// Clear cached credentials
function deleteCredentials() {
  xapi.Command.WebEngine.DeleteStorage({ Type: 'WebApps' });
  console.info({Info: "Logging User Out" });
}


init();

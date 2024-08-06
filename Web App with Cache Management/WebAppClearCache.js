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

let product = '';
let webviewId = null;

// CUSTOMIZE THESE VARIABLES!!!!!!!

const webAppURL = 'https://app.mural.co';
const webAppLogo = 'https://cdn.prod.website-files.com/62e11362da2667ac3d0e6ed5/659d7f9e582a15e81030a3cf_Mural_Symbol_Multicolor_RGB.png';
const waitTimer = 20;

// To disable user prompt and automatically clear data, set this to true.
const autoClear = false;

// Name of the button below:
const appName = 'Mural';

// END VARIABLES


let panelName = appName.replaceAll(" ","").toLowerCase() + 'App';

async function init() {
  console.log({ Message: "Initializing Macro..." });
  product = await xapi.Status.SystemUnit.ProductPlatform.get();
  // Build UI Elements
  await buildUI();

  console.log({ Message: "Macro fully initialized and ready!" });

  // Monitor WebView status
  monitorWebView();
}

// UI Builder Function
async function buildUI() {
  console.info({ Info: "Constructing UserInterface..." });

  const panel_xml = `<Extensions>
                      <Panel>
                        <Order>1</Order>
                        <Origin>local</Origin>
                        <Location>ControlPanel</Location>
                        <Icon>Info</Icon>
                        <Name>${appName}</Name>
                        <ActivityType>Custom</ActivityType>
                      </Panel>
                    </Extensions>
                    `;

  // Check for Interactive System before pushing Web app
  if (product.includes('Desk') || product.includes('Board')) {
    console.log("Enabling Button");

    await xapi.Command.UserInterface.Extensions.Panel.Save({ PanelId: panelName }, panel_xml);
    if (webAppLogo != '' || webAppLogo != undefined){
        let getIconAndId = (await xapi.Command.UserInterface.Extensions.Icon.Download({ Url: webAppLogo })).IconId;
        let uploadIcon = await xapi.Command.UserInterface.Extensions.Panel.Update({ IconId: getIconAndId, Icon: 'Custom', PanelId: panelName });
    }
  }
  console.info({ Info: "UserInterface Constructed!" });
}

// Listener for Web Apps
xapi.Event.UserInterface.Extensions.Panel.Clicked.on(event => {
  switch (event.PanelId) {
    case panelName:
      // Log Press
      console.log(appName + " web app started via panel button press");
      xapi.Command.UserInterface.WebView.Display({ Mode: 'FullScreen', Target: 'OSD', Title: appName, Url: webAppURL })
        .then(response => {
          webviewId = response.id; // Store the webview ID
        });
      break;
  }
});

// Monitor WebView status for closure and prompt for login deletion
function monitorWebView() {
  xapi.Status.UserInterface.WebView.on((update) => {
    if (update.id === webviewId && update.Status === 'NotVisible') {
      webviewId = null;
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
    if (update.URL === webAppURL) {
      webviewId = update.id;
    }
  });
}

// Clear cached credentials
function deleteCredentials() {
  xapi.Command.WebEngine.DeleteStorage({ Type: 'WebApps' });
  console.info({Info: "Logging User Out" });
}


init();

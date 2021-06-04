# Join Zoom and Zoom Tools

Version: 4-1-0 

## Inspiration
* The continued need to improve up my previous Join Zoom iterations.
* Provide more features for my user community
* Re-think my strategy for others to integrate this into their own user Ecosystem 😃

## Goal
* Ditch version 3
  * _Version 3? We haven't seen a version 3?!?!?_ Yeah the one I never posted... It did OK, but there was obvious flaws and you all deserve better 😉
* Create a UI for Zoom DTMF sequence
* Allow the scripts to be more customizable
* Make use of Newer API present in today's landscape!


## What You'll Need
* Cisco Room device on ce9.15.X or greater, or Stable Channel of RoomOS
* Admin Access to your Room Device
* Zoom Account and CRC Licensing for your endpoint
* Some Knowledge on the Macro Editor
* Some Knowledge on Editing Scripts

## The roles and function for each script

Join Zoom version 4-1-0 is split into 5 scripts
* JoinZoom_Main_4-1-0.js
  * The active script on the endpoint. Contains most of the code needed for successful operation 
* JoinZoom_Config_4-1-0.js
  * Version 4-X-X was made to be more customizable
  * This configuration menu has several options for you to quickly edit key areas of the Macro, without needed to dig through all the code
* JoinZoom_JoinText_4-1-0.js
  * Most Prompt-Based Text content is here, so you can edit to your language of choice or enter information that is more meaningful to your users.
* JoinZoom_UI_4-1-0.xml
  * The UI for all of join Zoom version 4-0-0
  * This includes all pieces your users need to interact with
  * It includes 6 panels with various use cases, so don't be alarmed if you see a bunch in your User Interface Extensions Editor
* Memory_Functions.js
  * Set of function for storing and retrieving information.
  * It's role in Join Zoom is for the new Personal Mode
* Memory_Storage.js
  * Storage repository for Memory Functions

[Learn more about Memory Functions](https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/tree/master/Macro%20Memory%20Storage) and how to include it in your scripts!

The scripts have been split for readability and to leverage a configuration scheme inside the endpoint.

## Getting Started

**NOTE**: Do not make changes to the names of any file for this tool. Changes to the names will break functionality as data is being passed between them when active.

* Download [JoinZoom_4-0-0.zip](https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/blob/master/Join%20Zoom/Join%20Zoom%20and%20Zoom%20Tools/JoinZoom_4-1-0.zip)
* Unzip the contents
  * JoinZoom_4-0-0.zip contains the following files
    * JoinZoom_Main_4-1-0.js
    * JoinZoom_Config_4-1-0.js
    * JoinZoom_JoinText_4-1-0.js
    * JoinZoom_UI_4-1-0.xml
    * Memory_Functions.js
* Log into your Cisco Room Device as and admin
* Navigate to the UI Extensions Editor
* Drag and drop the ```JoinZoom_UI_4-1-0.xml``` into this editor
* Export the configuration to the new UI elements to the endpoint.
* Navigate to the Macro Editor
* Import and Save each of the following Macros into the Room System
   * JoinZoom_Main_4-1-0.js
   * JoinZoom_Config_4-1-0.js
   * JoinZoom_JoinText_4-1-0.js
   * Memory_Functions.js
* Once saved, only activate ```JoinZoom_Main_4-1-0.js```
   * no issue will occur if you activate all, but Cisco Room systems have a limit to the # of active scripts running. Only ```JoinZoom_Main_4-1-0.js``` is needed
* Refresh your browser
   * Important, as Memory_Functions will make a change once ```JoinZoom_Main_4-1-0.js``` activates.

Join Zoom version 4-1-0 should now be operational, set to a default configuration and ready for use 😄

## Configuration Options

**NOTE**: Values are case sensitive

Join Zoom version 4-1-0 has a Configuration Macro called ```JoinZoom_Config_4-1-0.js```

Between Lines 32-66is a config const for you to make changes too

```javascript
const config = {
    version: '4-1-0', // Macro Version Number
    sipPattern: 'zoomcrc.com', // The Zoom CRC SIP addressed used in your Org
    additionalFlavorText: '', //Flavor text that shows up under the Enter Meeting ID prompt. Max Char = 70
    securityMode: "Off", //<"On", "Off"> //Deletes last call from recents if it includes "zoomcrc.com". Does not search and clear pre-existing entries.
    suppressMenu: "Off", //InDev //<"On", "Off"> //Suppress DTMF menus from popping up for commands. Does not suppress all menus (like Participant List, etc...)
    dualScreen: 'Auto', //InDev //<“On”, “Off”, “Auto”> //Configure if system is Dual Screen to leverage both screens for Video, Auto will attempt to determine based on HDMI output connectivity
    regex: { // Only change Regex to Match our Orgs Zoom Account rules around Meeting IDs Host Keys and Passcodes
        zoom_SIP: {
            any: /^([0-9_\-]+).([0-9_\.-]+)..([0-9_\.-]+)@zoomcrc.com$/,
            strict: {
                regular: /^([0-9_\-]+)@zoomcrc.com$/,
                passcode: /^([0-9_\-]+)\.([0-9_\.-]+)@zoomcrc.com$/,
                hostKey: /^([0-9_\-]+)\.([0-9_\.-]+)\.\.([0-9_\.-]+)@zoomcrc.com$/,
            }
        }, //Identifies valid Zoom SIP strings
        zoom_restrictions: {
            meetingid: /^[0-9]{5,40}$/, //Allows any numeric value from 5-40
            passcode: /.*/, // No restrictions
            hostkey: /^$|^[0-9]{6}$/, //Allows Empty string or 6 digits
        }
    },
    ui: {
        settings: { //Governs how the Join Zoom button looks like
            style: "new", // <"classic", "new">
            personalMode: false, //<true, false>             //Only available with "new" style. Creates an area to save personal Zoom Room credentials for Quick Entry
            joinWebex: true, //<true, false>                 //Show or hide the Join Webex Button
            dtmfTools: true, //<true, false>                  //Show or Hide the Zoom Tools button in Zoom Calls
            dtmfFeedback: { //Noise played when DTMF is used in Zoom Tools
                mode: "Tone", //<"On", "Off", "Tone", "Soften"> 
                threshold: 25 //The target audio threshold for Soften Mode Only
            },
        }
    }
}
```

### version
* Description
  * Do not change this as it's important for the scripts operation. It is used for development.
  * Only change if you have experience and are working on a version of your own outside this one.
  * Other version references will need to be adjusted in the XML and other scripts to be successful.
* Accepted Values
  * String
* Default Value
  * 4-1-0

### sipPattern
* Description
  * Zoom uses ```zoomcrc.com``` but has other server addresses that are better for your region. 
  * Only change if your org dials into something other than ```zoomcrc.com```
* Accepted Values
  * String
* Default Value
  * zoomcrc.com

### additionalFlavorText
* Description
  * Flavor text that shows up under the Enter Meeting ID prompt. Max Char = 70
* Accepted Values
  * String
* Default Value
  * N/A

### securityMode
* Description
  * Deletes last call from recents if it includes "zoomcrc.com". Does not search and clear pre-existing entries.
* Accepted Values
  * On, Off
* Default Value
  * Off

### suppressMenu
**NOTE**: In Development. Expected release 4-1-1

* Description
  * Suppress DTMF menus from popping up for commands. Does not suppress all menus (like Participant List, etc...)
* Accepted Values
  * On, Off
* Default Value
  * On

### dualScreen
**NOTE**: In Development. Expected release 4-1-1

* Description
  * Configure if system is Dual Screen to leverage both screens for Video, Auto will attempt to determine based on HDMI output connectivity
* Accepted Values
  * On, Off, Auto
* Default Value
  * Auto

### regex
Regex tests user information to see if the information provided by the user is in a valid Zoom Format

Under ```zoom_SIP.any``` and ```zoom_SIP.strict``` are responsible for validating a Zoom SIP string. Used to check if OBTP events need Zoom Tools or if users dial from the native call menu

Under ```zoom_SIP.zoom_restrictions``` is responsible for checking user input when using the Join Zoom button. These base restriction align with Zoom default org settings as of 06/04/2021. If your org has set specific MeetingID, Passcode or Hostkey rules, be sure to edit these regex value to align with your organization's goals and limit user confusion.

### ui.settings

#### style
* Description
  * Classic provides the original Join Zoom experience from Join Zoom version 2
  * New is a new UI which is more favored in tested.
    * I left both in, in case you favor 1 over the other
    * New is my Preferred version now
* Accepted Values
  * classic, new
* Default Value
  * new

#### personalMode
**NOTE**: Only available with "new" style. Not available in classic.

* Description
  * Creates an area to save personal Zoom Room credentials for Quick Entry
* Accepted Values
  * true, false
* Default Value
  * false

#### joinWebex
* Description
  * Show or hide the Join Webex Button
* Accepted Values
  * true, false
* Default Value
  * true

#### dtmfTools
* Description
  * Show or Hide the Zoom Tools button in Zoom Calls
* Accepted Values
  * true, false
* Default Value
  * true

#### dtmfFeedback
* Description
  * Noise played when DTMF is used in Zoom Tools
* Accepted Values for MODE
  * On, Off, Tone, Soften
    * On - Normal DTMF Tones are Played
    * Off - No DTMF Tones are played
    * Tone - Single Audio chime is played, not DTMF Tones
    * Soften - Lowers DTMF Tones to a target threshold for listening
* Accepted Values for Threshold
  * Number 0-100
* Default Values
  * MODE: On
  * Threshold: 25

## Add/Remove Zoom Tools

All DTMF Optoins are referenced from the widget ID of each button present in the Host Options Panel and Participant Options Panel

Each Widget ID follow this naming pattern
```targetPanel~version#~nickName~dtmfSequence```

Each element of the widget ID is split out from the Tilde **(~)**

So if you want to add any new DTMF tones, only change the nickName and the dtmfSequence in the Widget ID. targetPanel and version# are always reference in code to prevent cross-talk to other flavors of the Zoom Tools button

Only Button elements can be used, largely due to the limits of DTMF.

Feel free to re-arrange and customize your Zoom Tools panels

Here is an example of a DTMF Button to start/stop a recording

```zoomTools~4-1-0~ToggleRecord~173```

When pressed, ToggleRecord will print to the console of the Macro editor and it will enter in the sequence 173

## Deployment

There are many flavors of deployment, but I recommend using Ce-Deploy by Christopher Norman, as it's a great tool for loading this into a whole environment quickly and easily.

* [CE-Deploy](https://github.com/voipnorm/CE-Deploy)

## Author(s)

* **Robert McGonigle Jr**

## Acknowledgments

* The Cisco Room Devices Team
  * Special thanks to Dustin Baker for creating an introductory video of the scripts, testing and feedback
  * Special thanks to Tore Bjolseth for testing and feedback
  * Special thanks to Kevin Barrow for testing and feedback
* My End Users
* The Cisco Community
 * Aaron Wilson for testing and feedback
* Antoine Eduoard - *Mentor*
* Dawn Passerini - *Mentor*

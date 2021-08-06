# Project USB's USB MODE
| | Project Lead and System Design | Macro Script Author |
|--------|--------|-------|
| **Name** | Enrico Conedera   | Robert McGonigle Jr    |
| **Company** | Cisco  | Harvard University Information Technology  |
| **Title** | Senior Technical Marketing Engineer | Video Services Engineer |
| **Contact**| econeder@cisco.com |- - - |

## Release
| | Script Version | Initial Release | Last Update |
|--------|--------|-------|-------|
| **Release Information** | 2-1-0   | March 24th, 2021 | August 8th, 2021|

## Inspiration
* To enable a USB Passthrough solution for Cisco Room Devices that do not support this feature functionality natively 

## Goal
* Enable a USB Passthrough solution for the Webex Room Kit, Room Kit Plus, Room Kit Pro and similar devices
    * "USB Passthrough enables the entire video conferencing system to be used with any PC application for conferencing." 
* Test and document several devices
* Make sure the user experience is simple

## Join the Community!
Connect with over _**1000**_ Integrators, Partners, Cisco Employees and Customers around the world who are
* Using this same Script!
* Trying out other USB Capture devices
* Editing this script for their own use cases
* Sharing stories, experiences, alternative design considerations and more!

Join the **PROJECT: USB Mode** chat through Webex with this link: https://eurl.io/#L6Rcn39Rn

## What You'll Need
* A Compatible Room Series Device
  * [Compatible Room Device List](#compatible-room-devices)
* A compatible USB Capture Device
  * [Tested USB Capture Device List](#tested-usb-capture-devices)
* Administrator Access to both the Room Series device and the USB Capture device
* Experience with
  * the Cisco Room Device Macro Editor
  * the Cisco Room Device UI Extensions Editor
  * Audio visual design and installation
* A copy of the USB mode Macro and the AV Design Guides

**Please READ these guides before continuing**
* [Macros and Guides]()
 
## How does this script function?
* USB Mode is designed to configure the Room device to work alongside a USB Capture device
    * When Enable USB Mode is clicked on the Room Device Touch Panel it will
        * Read your devices current configuration for audio, video and UI elements
        * Save this base configuration into a separate macro
            * This save process is critical so we can maintain your rooms configuration during restarts and so on
        * Then reconfigure your Room Device to work hand in hand with a Capture Device
            * This includes activating Do No Disturb, Hiding un-needed UI elements, routing your audio and video properly  
    * When Disable USB Mode is clicked on the Room Device Touch Panel it will
        * Read the configuration saved on the Memory Storage Macro
        * Reconfigure your device back to this base configuration
        * Recover your original Audio and Video Routing, Deactivate Do not disturb and restore your UI Elements
    * When USB Mode is first loaded onto a system it will
        * Scan your system for a storage script
            * If that script is missing, it will generate on for you
            * If it is present, it will do nothing and begin it tasks for USB Mode

## Standard Deployment
* I recommend you check out the [Cisco RoomOS Website Examples](https://roomos.cisco.com/macros)
    * The site comes with an installer you can use to load USB Mode into your Endpoint
    * This will not remove USB Mode Version 1. Continue reading to learn how to remove USB Mode Version 1

* For Manual Deployment
    * Download the following files from this repo
        * **prjUSB_Main.js**
        * **prjUSB_EnableUSBMode.xml**
        * **projUSB_DisableUSBMode.xml**
    * Log into your Room Device
        * If you have USB Mode Version 1 Enabled
            * Disable USB Mode Version 1
            * Delete All Macros Associated to USB Mode Version 1 in the Macro Editor
            * Delete all UI Extensions Associated to USB Mode Version 1 in the UI Extensions Editor
        * Navigate to the UI Extensions Editor
            * Merge from file both
                * **prjUSB_EnableUSBMode.xml**
                * **projUSB_DisableUSBMode.xml**
            * Position the buttons where they need to be in relation to your other Custom UI Elements
            * Upload the new UI to the Room Device
        * Navigate to the Macro Editor
            * Upload **prjUSB_Main.js**
            * Save then Enable
        * USB Mode Version 2 should now be up and running and ready for use

* [Directions for bulk Deployment using Ce-Deploy](#bulk-deployment)
    * **NOTE**: Before Deploying in bulk, you may want to review the configurable options below.

## Configurable Options
* Configurable options for USB Mode can be found in the **prjUSB_Main** script starting on **Line 39**
* Items in this configuration may help you customize this tool for your space without needing to edit the whole script

#### Feature Configurations
|Configuration Name | ID | Accepted Values | Default Value | Type | Description |
|--------|--------|-------|-------|-------|-------|
| **Hide Custom Panels Mode** | hideCustomPanels_Mode | true/false | false | boolean | When set to **true**, allows you to hide custom UI Extensions Panels listed in the **hideCustomPanels_PanelIds** array when USB Mode is Enabled |
| **Hide Custom Panel IDs** | hideCustomPanels_PanelIds | Panel IDs | [] | string array | place in an array of Panel IDs to hide while USB Mode is Enabled; Ex. ["panel_1","panel_2", "panel_etc"] |
| **Scheduled Reset Mode** | scheduledReset_Mode | true/false | false | boolean | When set to **true**, tells USB Mode to exit a the specified Hour and Minute. This is read in a 24 hour format|
| **Reset Hour** | scheduledReset_Hour | 0-23 | 0 | integer | When **Scheduled Reset Mode** is set to **true**, USB mode will disable at this specified hour |
| **Reset Minute** | scheduledReset_Minute | 0-59 | 0 | integer | When **Scheduled Reset Mode** is set to **true**, USB mode will disable at this specified minute |
| **Pin Protection Mode** | pinProtection_Mode | true/false | false | boolean | When set to **true**, USB Mode will be placed behind a 4-8 Digit Pin. Successful entry of this pin will Enable USB Mode |
| **Pin Number** | pinProtection_Pin | 4-8 digit number | 0000 | integer | The 4-8 digit pin associated **Pin Protection Mode**|
| **Screen Share Mode** | screenShare_Mode | "auto"/"standard" | "auto" | string | When set to **"auto"**, when USB Mode is enabled, this make sure to continue sharing the active presentation. If no presentation is found, USB Mode will start sharing the default source input on the Room Device. When set to **"standard"**, USB Mode will start sharing the default source input on the Room Device |

#### Text Configurations
* Test configurations start on **Line 49**. these do not alter the function of USB Mode but allows you to change the text from the Prompts in USB Mode to your local language
* Default USB Mode Text is in American English
```javascript
const pinProtection_FlavorText_Title = "Enter Pin to Unlock";
const pinProtection_FlavorText_Text = "USB mode has been pin protected by a system administrator.<p>Please enter the 4-8 digit numeric pin to unlock";
const pinProtection_FlavorText_Placeholder = "4-8 Digit Pin";
const pinProtection_FlavorText_SubmitButton = "Enter";
const pinProtection_UnlockText_Title = "USB Mode Unlocked";
const pinProtection_UnlockText_Text = "Enjoy your meeting";
const pinProtection_Fail_Title = "Invalid Pin, Try Again";
const missingSourceText_Title = "No HDMI Input Detected"
const missingSourceText_Text = "Make sure your HDMI Presentation Source and USB Cable are connected to your device before selecting \"Enable USB Mode\""
```
## Bulk Deployment
There are many flavors of deployment, but I recommend using Ce-Deploy by Christopher Norman, as it's a great tool for loading this into a whole environment quickly and easily.
* [CE-Deploy Builds for MAC and PC](https://github.com/voipnorm/CE-Deploy/releases/)

**NOTE**: this is not a CE-Deploy tutorial. If you need assistance with CE-Deploy you can join the Partner-Customer CE-Deploy Feedback space on Webex through this link: https://eurl.io/#SJWfk6qUV

Removing USB Mode Version 1 Scripts
* Open the CE-Deploy Application
    * Launch Macro Factory
        * Check off all USB Mode Version 1 Scripts on your Room Devices
        * Remove them using the Remove Tool at the top of the Macro Factory

Removing USB Mode 1 Panels
* Open the CE-Deploy Application
    * Go to the xApi Section
    * Enter in the command and Panel ID You wish to remove in bulk
        * [xCommand UserInterface Extensions Panel Remove PanelId: PanelID](https://roomos.cisco.com/xapi/Command.UserInterface.Extensions.Panel.Remove/?search=Panel%20Remove)
        * Run this for Each Panel ID

Adding New USB Mode Version 2 Panels
* Open the CE-Deploy Application
    * Go to the UI Controls Section
        * Enter **prjUSB_widget_disabled-USB** as the Panel ID
        * Load in **prjUSB_EnableUSBMode.xml** as the file
            * Start this deployment
        * When Complete
        *  Enter **prjUSB_widget_enabled-USB** as the Panel ID
        * Load in **projUSB_DisableUSBMode.xml** as the file

Adding New USB Mode Version 2 Scripts
* Open the CE-Deploy Application
    * Go to the Macros Section
        * Name your script **prjUSB_Main**
        * Select the script **prjUSB_Main.js**

USB Mode Version 2 should be all set and running.

## Compatible Room Devices
|Product | Minimum OS Recommended |
|--------|--------|
|Sx80, Mx700, Mx800|CE 9.15.X or higher|
|Room Kit, Room Kit Plus|RoomOS 10.5.X or higher|
|Room Kit Pro|RoomOS 10.5.X or higher|
|Room 55, Room 55 Dual|RoomOS 10.5.X or higher|
|Room 70, Room 70 Dual|RoomOS 10.5.X or higher|

## Tested USB Capture Devices
|Brand | Model | Notes|
|--------|--------|--------|
|Inogeni|4KxUSB3| For room Kit and Plus Models |
|Inogeni|4K2USB3| For Room Kit Pro Models |
|Vaddio|Vaddio AV Bridge Mini| |
|Magwell|Magwell USB Capture HDMI Plus| **Requires Attenuation Cable**. Review Design Guides for more detail|
|Extron|Extron MediaPort 200||

## Acknowledgments
* Special Thanks To
    * The Cisco Devices Team
    * The Project USB Community
    * The Project USB Beta Testers
    * Antoine Eduoard - *Mentor*
    * Dawn Passerini - *Mentor*

<div style="color:red">TODO: ABOUT LICENSING</div>


# Contributor information

Great that you want to contribute RoomOS extensions! Please read the following guidelines.

* Create a folder on root level with the name of your extension (spaces are ok)
* Add a file called README.md (spelled like that) in that folder with info. It should typically include:
  * Name of project and author
  * How to setup and run the extensions
  * Screenshots
  * Which RoomOS version and device types are supported
  * Any special requirements
  * Please make sure the file is spelled exactly README.md (with those casings)
* If you add images, put them in your extension folder and use local addressing (eg ./screenshot01.png)
* Add the extension name and short description to the table of content in the README.md at the root level

## Integrate with roomos.cisco.com

roomos.cisco.com integrates with this repository for a nice user experience when browsing installations. In particular, users can install the extension to their device with one click if you add a manifest file for you extension.

Common mistakes:

* Explain the purpose and use case of the extension first, not the technical details
* Make sure you name the readme file README.md with those cases
* Don't add file listing in the readme file, the user can find that easily with the tools anyway
* Remember to add the extension to the table of contents in the main repo readme file
* Don't put more than one user interface panel in an xml file, the API does not support that
* Make sure you use unique widget ids - namespace your extension

### Showing the extension in the catalog

To show your extension, roomos.cisco.com reads the main README.md file in the repo and looks in the table of content. Add your extension there and make sure the title is identical to the folder name of your folder.

### Manifest file

This files can containt three things:

- The macro files (js)
- The ui extension files (xml)
- User settings

The file should be called manifest.json and placed in your extension folder. Copy the manifest-template.json in the root folder and use it as a starting point. If any of your js files are libraries, make sure to set their type to `library` rather than `url`.

Example:

```
{
  "version": "1",
  "profile": {
    "macro": {
      "items": [
        {
          "payload": "./pin-code.js",
          "type": "url",
          "id": "pin-code"
        }
      ]
    },
    "userParams": [
      {
        "id": "PIN_CODE",
        "name": "Your pin code",
        "info": "Numbers are recommended, but you can choose textual password instead",
        "type": "string",
        "default": "1234",
        "domain": "pin-code",
        "required": true
      }
    ]
  }
}
```

### User settings

You can define user settings in the manifest file, this will allow users to choose these values before installing. roomos.cisco.com will create a user-friendly web form where users can choose the values, then these will actually be replaced in the macro files before installing.

It's important that the parameters you set in the macro file is similar to this:
```
const xapi = require('xapi');

const myCustomNumber = 1234;
let myCustomString;
var anotherVariable = null;
...
```

The parameter must be either const, let or var, and its up to you whether it is initialized or not, that part will be replaced by the installer script regardless.

The types of parameters currently supported are `string`, `number`, `bool` (tick box) and `option`. Option lets the user pick from a set of predefined options, and also requires a `values` object:

```
{
  "id": "searchengine",
  "name": "Search engine",
  "info": "Which search engine to use by default",
  "type": "option",
  "values": {
    "google.com": "Google",
    "bing.com": "Bing",
    "duckduckgo.com": "DuckDuckGo"
  },
  "domain": "minibrowser",
  "required": true
}
```

## Current limitations

A natural assumption is that if you install an extension, then uninstall it, the system will be in the same state as when you started. This might not always be the case, because:

* UI extensions (panels, action buttons and web apps) created dynamically by a macro causes problems, because the installer script doesn't have any way to know that they should be deleted.
* Permanent changes made by the macro with configs or commands will not be reverted when the macro is uninstalled.
* The installer uninstalled a library that is also used by another macro that is still on the system.


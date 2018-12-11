const xapi = require('xapi');


const MONITORING_URL = 'https://foto.no/cgi-bin/cisco/postanalytics.cgi';

var systemInfo = {
    systemName: ''
  , softwareVersion: ''
  , softwareReleaseDate: ''
  , videoMonitors: ''
};


function sendMonitoringUpdatePost(message){
  
     xapi.command('HttpClient Post', { 'Header': 'Content-Type: application/json' , 'Url':MONITORING_URL}
     , JSON.stringify(Object.assign({'Message': message}, systemInfo)));
}

/*
xapi.event.on('UserInterface Extensions Panel Clicked', (event) => {
    if(event.PanelId == 'roomfeedback'){
      sendMonitoringUpdatePost('There is an issue in room X');
    }

});
*/

xapi.event.on('UserInterface Extensions Panel Clicked', (event) => {
    if(event.PanelId == 'roomfeedback'){
        xapi.command("UserInterface Message Prompt Display", {
              Title: "Report issue"
            , Text: 'Please select what the problem area is'
            , FeedbackId: 'roomfeedback_step1'
            , 'Option.1':'Cleanliness'
            , 'Option.2':'Technical issues with Audio/Video'
            , 'Option.3': 'Other'
          }).catch((error) => { console.error(error); });
    }
});


xapi.event.on('UserInterface Message TextInput Response', (event) => {
    switch(event.FeedbackId){
        case 'roomfeedback_step2_cleanliness':
          xapi.command("UserInterface Message Alert Display", {
              Title: 'Feedback receipt'
              , Text: 'Thank you for you feedback! We have notified the cleaners! Have a great day!'
              , Duration: 3
          }).catch((error) => { console.error(error); });
          sendMonitoringUpdatePost(systemInfo.systemName + ' needs cleaning' + ': ' + event.Text);
          break;
        case 'roomfeedback_step2_other':
          xapi.command("UserInterface Message Alert Display", {
              Title: 'Feedback receipt'
              , Text: 'Thank you for you feedback! Have a great day!'
              , Duration: 3
          }).catch((error) => { console.error(error); });
          sendMonitoringUpdatePost('There is some issue in ' + systemInfo.systemName + ': ' + event.Text);
          break;
    }
});


xapi.event.on('UserInterface Message Prompt Response', (event) => {
    switch(event.FeedbackId){
        case 'roomfeedback_step1':
          switch(event.OptionId){
             case '1':
                xapi.command("UserInterface Message TextInput Display", {
                          Duration: 0
                        , FeedbackId: "roomfeedback_step2_cleanliness"
                        , InputType: "SingleLine"
                        , KeyboardState: "Open"
                        , Placeholder: "Details on cleanliness issue"
                        , SubmitText: "Submit"
                        , Text: "Please leave optional comment about the cleanliness issue or just hit Submit if its obvious that the room needs cleaning!"
                        , Title: "Cleanliness Details"
                  }).catch((error) => { console.error(error); });
                  break;
              case '2':
                  xapi.command("UserInterface Message Prompt Display", {
                        Title: "A/V Issue reporting"
                      , Text: 'Please select what the problem seems to be'
                      , FeedbackId: 'roomfeedback_step2'
                      , 'Option.1':'Call did not connect'
                      , 'Option.2':'Audi was bad'
                      , 'Option.3': 'Video was bad'
                    }).catch((error) => { console.error(error); });
                  break;
              case '3':
                xapi.command("UserInterface Message TextInput Display", {
                          Duration: 0
                        , FeedbackId: "roomfeedback_step2_other"
                        , InputType: "SingleLine"
                        , KeyboardState: "Open"
                        , Placeholder: "Write issue here"
                        , SubmitText: "Next"
                        , Text: "Please enter a short description of the issue"
                        , Title: "Contact info"
                  }).catch((error) => { console.error(error); });
                  break;
          }
          break;
        case 'roomfeedback_step2':
              xapi.command("UserInterface Message Alert Display", {
                  Title: 'Feedback receipt'
                  , Text: 'Thank you for you feedback! Have a great day!'
                  , Duration: 3
              }).catch((error) => { console.error(error); });
              sendMonitoringUpdatePost('There is an audio/video issue in ' + systemInfo.systemName);
              break;
    }
});


function init(){
  xapi.status.get('SystemUnit Software Version').then((value) => {
    systemInfo.softwareVersion = value;
  });
  xapi.config.get('SystemUnit Name').then((value) => {
    systemInfo.systemName = value;
  });  
  xapi.status.get('SystemUnit Software ReleaseDate').then((value) => {
    systemInfo.softwareReleaseDate = value;
  });
  xapi.status.get('Video Monitors').then((value) => {
   systemInfo.videoMonitors = value;
  });
  
  setTimeout( () => sendMonitoringUpdatePost('Monitoring macro was (re)started'), 2000);  
}


init();
import xapi from 'xapi';


const SERVICE_NOW_INSTANCE_URL = 'yourinstance.service-now.com'; // Specify a URL to a service like serviceNow etc.

const MONITORING_URL = 'https://' + SERVICE_NOW_INSTANCE_URL + '/api/now/v1/table/incident'; // Specify a URL to a service like serviceNow etc.


const CONTENT_TYPE = "Content-Type: application/json";
const ACCEPT_TYPE = "Accept:application/json";
const SERVICENOW_USERNAMEPWD_BASE64 = 'YWRtaW46Q2lzY28xMjM='; // format is "username:password" for basic Authorization. This needs to be base64-encoded. Use e.g. https://www.base64encode.org/ to do this
const SERVICENOW_AUTHTOKEN = "Authorization: Basic " + SERVICENOW_USERNAMEPWD_BASE64;

var systemInfo = {
    softwareVersion : ''
    , systemName : ''
    , softwareReleaseDate : ''
};


function sendMonitoringUpdatePost(message){
        console.log('Message sendMonitoringUpdatePost: ' + message);
        var messagecontent = {
        description: systemInfo.softwareVersion
      , short_description: systemInfo.systemName + ': ' + message
    };

     xapi.command('HttpClient Post', { 'Header': [CONTENT_TYPE, SERVICENOW_AUTHTOKEN] , 'Url':MONITORING_URL, 'AllowInsecureHTTPS': 'True'}, JSON.stringify(messagecontent));
}


function getServiceNowIncidentIdFromURL(url){

    return xapi.command('HttpClient Get', { 'Header': [CONTENT_TYPE, SERVICENOW_AUTHTOKEN] , 'Url':url, 'AllowInsecureHTTPS': 'True'});

}

function raiseTicket(message){
    console.log('Message raiseTicket: ' + message);
    var messagecontent = {      description: systemInfo.softwareVersion      , short_description: message    };

     xapi.command('HttpClient Post', { 'Header': [CONTENT_TYPE, SERVICENOW_AUTHTOKEN] , 'Url':MONITORING_URL, 'AllowInsecureHTTPS': 'True'}
     , JSON.stringify(messagecontent)).then(
    (result) => {
      const serviceNowIncidentLocation = result.Headers.find(x => x.Key === 'Location');
      var serviceNowIncidentURL = serviceNowIncidentLocation.Value;
     var  serviceNowIncidentTicket;
     getServiceNowIncidentIdFromURL(serviceNowIncidentURL).then(
    (result) => {
        var body = result.Body;
        console.log('Got this from getServiceNowIncidentIdFromURL: ' + JSON.stringify(result));
        serviceNowIncidentTicket =  JSON.parse(body).result.number;
          xapi.command("UserInterface Message Alert Display", {
              Title: 'ServiceNow receipt'
              , Text:  'Your ticket id is ' + serviceNowIncidentTicket + '. Thanks for you feedback! Have an awesome day!'
              , Duration: 10
          }).catch((error) => { console.error(error); })
    });

        console.log('Got this from raiseTicket: ' + JSON.stringify(result));
    });
}

xapi.event.on('UserInterface Extensions Panel Clicked', (event) => {
    if(event.PanelId == 'reportissue'){
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
          systemInfo.short_description = 'Cleaner issue';
          raiseTicket(systemInfo.systemName + ' needs cleaning' + ': ' + event.Text);
          break;
        case 'roomfeedback_step2_other':
          raiseTicket('There is some issue in ' + systemInfo.systemName + ': ' + event.Text);
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
                      , 'Option.2':'Audio was bad'
                      , 'Option.3': 'Video was bad'
                    }).catch((error) => { console.error(error); });
                  break;
              case '3':
                xapi.command("UserInterface Message TextInput Display", {
                          Duration: 0
                        , FeedbackId: "roomfeedback_step2_other"
                        , InputType: "SingleLine"
                        , KeyboardState: "Open"
                        , Placeholder: "Describe issue here"
                        , SubmitText: "Next"
                        , Text: "Please enter a short description of the issue"
                        , Title: "Issue info"
                  }).catch((error) => { console.error(error); });
                  break;
          }
          break;
        case 'roomfeedback_step2':
              systemInfo.short_description = 'AV issue';
              raiseTicket('There is an audio/video issue in ' + systemInfo.systemName);
              break;
        case 'reportissue':
            switch(event.OptionId){
                case '1':
                    raiseTicket(systemInfo.systemName + ' is having audio or video issues');
                    break;
                case '2':
                    raiseTicket(systemInfo.systemName + ' needs cleaning');
                    break;
                case '3':
                    raiseTicket(systemInfo.systemName + ' Just has someone complaining for no reason');
                    break;
            }
            break;

    }
});


function init(){
  xapi.status.get('SystemUnit Software Version').then((value) => {
    systemInfo.softwareVersion = value;
  });
  xapi.config.get('SystemUnit Name').then((value) => {
    if(value === ''){
        xapi.status.get('SystemUnit Hardware Module SerialNumber').then((value) => {
          systemInfo.systemName = value;
        });
    }
    else{
      systemInfo.systemName = value;
    }
  });
  xapi.status.get('SystemUnit Software ReleaseDate').then((value) => {
    systemInfo.softwareReleaseDate = value;
  });
  xapi.config.set('HttpClient Mode', 'On');

  setTimeout( () => sendMonitoringUpdatePost('ServiceNow macro was (re)started'), 2000);

}


init();

const xapi = require('xapi');
const MAX_NUMBER_OF_SOURCES_IN_COMPOSITING = 4;
const MAX_SOURCES_ON_UI = 6;
const MAINLAYOUTCHANGEPREVIEWTIMEOUT = 8000;
let presentationSources = [];
const defaultMainVideoSource= 1;
let mainSources = [defaultMainVideoSource];
var layoutfamily_main = 'Equal';
var layoutfamily_pipsize = 'Auto';
var layoutfamily_pipposition = 'LowerRight';
var layoutfamily_presentation = 'equal';
var mainlayoutpreviewtimeouthandler;

function previewSelfViewAfterLayoutChange(){
        clearTimeout(mainlayoutpreviewtimeouthandler);
        xapi.command("Video Selfview Set", {'Mode': 'on', 'FullscreenMode': 'On'}); // Turn ON FullscreenMode so you can see whats going on
        mainlayoutpreviewtimeouthandler = setTimeout(() => xapi.command("Video Selfview Set", {'Mode': 'on', 'FullscreenMode': 'Off'}), MAINLAYOUTCHANGEPREVIEWTIMEOUT); // Turn off FullscreenMode after a few seconds
}

function updateMainLayout(){
  xapi.command("Video Input SetMainVideoSource", {ConnectorId: mainSources, Layout: layoutfamily_main, PIPSize: layoutfamily_pipsize, PIPPosition: layoutfamily_pipposition});
  console.log('Main-sources: ' + JSON.stringify(mainSources) + ' Layout:' + layoutfamily_main + ' PipSize:' + layoutfamily_pipsize + ' PipPosition:' + layoutfamily_pipposition);
  previewSelfViewAfterLayoutChange();
  
}


function updatePresentationLayout(){
  xapi.command("Presentation Start", {ConnectorId: presentationSources, Layout: layoutfamily_presentation});
  console.log('Presentation-sources: ' + JSON.stringify(presentationSources) + ' Layout:' + layoutfamily_presentation);

}


function addToMainList(mainSource){
  if(mainSources.length < MAX_NUMBER_OF_SOURCES_IN_COMPOSITING){
    if(layoutfamily_main === 'PIP' && mainSources.length >=2){
      xapi.command('UserInterface Message Alert Display', {'Title': 'Notification', 'Text': 'You can only have two active sources with PIP layout', 'Duration': 2}).catch(e => console.error('Command error'));
      xapi.command("UserInterface Extensions Widget SetValue", {'WidgetId': 'main_source_' + mainSource, 'Value':'off'});
    }
    else{
      mainSources.push(mainSource);
      xapi.command("UserInterface Extensions Widget SetValue", {'WidgetId': 'main_source_' + mainSource, 'Value':'on'});
      updateMainLayout();
    }
  }
  else{
    xapi.command('UserInterface Message Alert Display', {'Title': 'Notification', 'Text': 'A maximum of 4 simultaneous source are available', 'Duration': 1}).catch(e => console.error('Command error'));
    xapi.command("UserInterface Extensions Widget SetValue", {'WidgetId': 'main_source_' + mainSource, 'Value':'off'});
  }
}

function removeFromMainList(mainSource){
  var index = mainSources.indexOf(mainSource);
  console.log('remove request for removal of ' + mainSource + '. Main-sources: ' + JSON.stringify(mainSources));
  if (index > -1) {
    mainSources.splice(index, 1);
    xapi.command("UserInterface Extensions Widget SetValue", {'WidgetId': 'main_source_' + mainSource, 'Value':'off'});
    console.log('Main-sources: ' + JSON.stringify(mainSources));
  }
  if(mainSources.length === 0){
      console.log('Main-source list cannot be 0. Setting default to be active');
      mainSources.push(defaultMainVideoSource.toString());
//      xapi.command('UserInterface Message Alert Display', {'Title': 'Notification', 'Text': 'Setting main to default source'}).catch(e => console.error('Command error'));
      xapi.command("UserInterface Extensions Widget SetValue", {'WidgetId': 'main_source_' + defaultMainVideoSource, 'Value':'on'});
      console.log('Main-sources: ' + JSON.stringify(mainSources));
  }
  updateMainLayout();

}

function removeAllFromMainList(){
  mainSources = [];
  for(var mainSource=1;mainSource<=MAX_SOURCES_ON_UI;mainSource++){
    xapi.command("UserInterface Extensions Widget SetValue", {'WidgetId': 'main_source_' + mainSource, 'Value':'off'});
  }
  mainSources.push(defaultMainVideoSource.toString());
  xapi.command("UserInterface Extensions Widget SetValue", {'WidgetId': 'main_source_' + defaultMainVideoSource, 'Value':'on'});
}

 
function addToPresentationList(presentationSource){
  if(presentationSources.length < MAX_NUMBER_OF_SOURCES_IN_COMPOSITING){
    presentationSources.push(presentationSource);
    xapi.command("UserInterface Extensions Widget SetValue", {'WidgetId': 'presentation_source_' + presentationSource, 'Value':'on'});
    xapi.command("Presentation Start", {ConnectorId: presentationSources});
  }
  else{
    xapi.command('UserInterface Message Alert Display', {'Title': 'Notification', 'Text': 'A maximum of 4 simultaneous source are available', 'Duration': 1}).catch(e => console.error('Command error'));
    xapi.command("UserInterface Extensions Widget SetValue", {'WidgetId': 'presentation_source_' + presentationSource, 'Value':'off'});
  }
}

function removeFromPresentationList(presentationSource){
  var index = presentationSources.indexOf(presentationSource);
  if (index > -1) {
    presentationSources.splice(index, 1);
    xapi.command("UserInterface Extensions Widget SetValue", {'WidgetId': 'presentation_source_' + presentationSource, 'Value':'off'});
  }
  if (presentationSources === undefined || presentationSources.length === 0) {
        xapi.command("Presentation Stop");
  }
  else{
    xapi.command("Presentation Start", {ConnectorId: presentationSources});
  }
}

function removeAllFromPresentationList(){
  presentationSources = [];
  for(var presentationSource=1;presentationSource<=MAX_SOURCES_ON_UI;presentationSource++){
    xapi.command("UserInterface Extensions Widget SetValue", {'WidgetId': 'presentation_source_' + presentationSource, 'Value':'off'});
  }
}


xapi.event.on('UserInterface Extensions Widget Action', (event) => {
  if (event.Type == 'released'){
        switch(event.WidgetId){
            case 'presentation_stop':
              xapi.command("Presentation Stop");
              removeAllFromPresentationList();
              break;
            case 'main_source_layout':
              switch(event.Value){
                case 'equal':
                  layoutfamily_main = 'Equal';
                  updateMainLayout();
                  break;
                case 'onelarge':
                  layoutfamily_main = 'Prominent';
                  updateMainLayout();
                  break;
                case 'pip':
                  if(mainSources.length === 2){
                    layoutfamily_main = 'PIP';
                    updateMainLayout();
                  }
                  else{
                    layoutfamily_main = 'Equal';
                    xapi.command('UserInterface Message Alert Display', {'Title': 'Notification', 'Text': 'PIP is only possible with exactly two sources', 'Duration': 2}).catch(e => console.error('Command error'));
                    xapi.command("UserInterface Extensions Widget SetValue", {'WidgetId': 'main_source_layout', 'Value':'equal'});
                  }
                  break;
              }
              break;
            case 'presentation_source_layout':
              switch(event.Value){
                case 'equal':
                  layoutfamily_presentation = 'Equal';
                  updatePresentationLayout();
                  break;
                case 'onelarge':
                  layoutfamily_presentation = 'Prominent';
                  updatePresentationLayout();
                  break;
              }
              break;
            case 'main_source_PIP_size':
              switch(event.Value){
                  case 'auto':
                    layoutfamily_pipsize = 'Auto';
                    break;
                  case 'large':
                    layoutfamily_pipsize = 'Large';
                    break;
              }
              updateMainLayout();
              break;
            case 'main_source_PIP_position':
              switch(event.Value){
                  case 'LowerLeft':
                    layoutfamily_pipposition = 'LowerLeft';
                    break;
                  case 'LowerRight':
                    layoutfamily_pipposition = 'LowerRight';
                    break;
                  case 'UpperLeft':
                    layoutfamily_pipposition = 'UpperLeft';
                    break;
                  case 'UpperRight':
                    layoutfamily_pipposition = 'UpperRight';
                    break;
              }
                updateMainLayout();
              break;
        }  
  }
  else if (event.Type == 'changed'){
    let match = /(presentation_source_|main_source_)(\d+)/.exec(event.WidgetId);
    if(match){
        switch(match[1]){
            case 'presentation_source_':
                if (event.Value == 'on'){
                  addToPresentationList(match[2]);
                }
                else{
                  removeFromPresentationList(match[2]);
                }
                console.log('Presentation-sources: ' + JSON.stringify(presentationSources));
                break;
            case 'main_source_':
                if (event.Value == 'on'){
                  addToMainList(match[2]);
                }
                else{
                  removeFromMainList(match[2]);
                }

                console.log('Main-sources: ' + JSON.stringify(mainSources));
                previewSelfViewAfterLayoutChange();

                break;

            default:
                break;
        }
    }
  }
});



function init(){
  removeAllFromMainList();
  removeAllFromPresentationList();
  xapi.command("UserInterface Extensions Widget SetValue", {'WidgetId': 'main_source_layout', 'Value':'equal'});
  xapi.command("UserInterface Extensions Widget SetValue", {'WidgetId': 'layoutfamily_pipsize', 'Value':'auto'});
  xapi.command("UserInterface Extensions Widget SetValue", {'WidgetId': 'layoutfamily_pipposition', 'Value':'LowerRight'});
  updateMainLayout();
}

xapi.event.on('UserInterface Extensions Widget LayoutUpdated', (event) => { // if new in-room control panel is uploaded reset everything to have logic and UI in sync
  init();
});


init();
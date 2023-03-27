//version 1.1 - updated with new syntax and optimized for RoomOS 11

import xapi from 'xapi';

function StartPresentation(sources){
    xapi.Command.Presentation.Start({PresentationSource: sources});
}

function StopPresentation(){
	xapi.Command.Presentation.Stop();
	xapi.Command.UserInterface.Extensions.Widget.UnsetValue({ WidgetId: 'presentation_source' });
	xapi.Command.UserInterface.Extensions.Widget.UnsetValue({ WidgetId: 'presentation_source2' });
}

xapi.Event.UserInterface.Extensions.Widget.Action.on(event => {
  if (event.WidgetId === 'presentation_source' && event.Type === 'released') {
  	xapi.Command.UserInterface.Extensions.Widget.UnsetValue({ WidgetId: 'presentation_source2' });
    switch (event.Value){
      case 'pacs_1':
        StartPresentation(2);
        break;
      case 'pacs_2':
        StartPresentation(3);
        break;
      case 'pc_1':
        StartPresentation(5);
        break;
      case 'pc_2':
        StartPresentation(6);
        break;
    }
  }
  if (event.WidgetId === 'presentation_source2' && event.Type === 'released') {
	xapi.Command.UserInterface.Extensions.Widget.UnsetValue({ WidgetId: 'presentation_source' });
    switch (event.Value){
      case '4_sources':
        StartPresentation([2,3,5,6]);
        break;
      case 'laptop':
        StartPresentation(4);
        break;
    }
  }
  else if (event.WidgetId === 'presentation_stop' && event.Type === 'clicked' ) {  
    StopPresentation();
    }
  
    //console.log(JSON.stringify(event)); 
  } 
);

xapi.Status.Conference.Presentation.Mode.on(presentationStatus =>{
  if (presentationStatus === 'Off' || presentationStatus === 'Receiving'){
	xapi.Command.UserInterface.Extensions.Widget.UnsetValue({ WidgetId: 'presentation_source' });
	xapi.Command.UserInterface.Extensions.Widget.UnsetValue({ WidgetId: 'presentation_source2' });
  }
});

xapi.Status.Standby.State.on(standbyState => {
  if (standbyState === "Off"){
    StopPresentation();
}});

StopPresentation();
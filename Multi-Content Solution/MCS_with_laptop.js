const xapi = require('xapi');

let connectedSources ={ '1': false, '2': false, '3': false, '4': false , '5': false , '6': false }

function StartPresentation(sources){
    xapi.command('Presentation Start', {PresentationSource: sources });
}

function StopPresentation(){
  xapi.command('Presentation Stop');
  xapi.command('UserInterface Extensions Widget UnSetValue', {WidgetId: 'presentation_source'});
  xapi.command('UserInterface Extensions Widget UnSetValue', {WidgetId: 'presentation_source2'});
}

xapi.event.on('UserInterface Extensions Widget Action', (event) => {
  if (event.WidgetId === 'presentation_source' && event.Type === 'released') {
  xapi.command('UserInterface Extensions Widget UnSetValue', {WidgetId: 'presentation_source2'});
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
  else if (event.WidgetId === 'presentation_source2' && event.Type === 'released') {
    xapi.command('UserInterface Extensions Widget UnSetValue', {WidgetId: 'presentation_source'});
    switch (event.Value){
      case '4_sources':
        StartPresentation( 
        [  connectedSources['2'] ? 2 : 'none'
          ,connectedSources['3'] ? 3 : 'none'
          ,connectedSources['5'] ? 5 : 'none'
          ,connectedSources['6'] ? 6 : 'none'
        ]);
        break;
      case 'laptop':
        StartPresentation(4);
        break;
    }
  }
  else if (event.WidgetId === 'presentation_stop' && event.Type === 'clicked' ) {  
    StopPresentation();
    }
  
    console.log(JSON.stringify(event)); 
  } 
);

function updateSourceList(id, formatStatus){
    connectedSources[id] = formatStatus === "Ok" ? true : false;
    console.log(JSON.stringify(connectedSources)); 
}

xapi.status.on('Conference Presentation Mode', (status) => {
  if (status === 'Off' || status === 'Receiving'){
    xapi.command('UserInterface Extensions Widget UnSetValue', {WidgetId: 'presentation_source'});
    xapi.command('UserInterface Extensions Widget UnSetValue', {WidgetId: 'presentation_source2'});
  }
});

async function init() {
  await xapi.status.get('Video Input Source').then((sourceStatuses) => {   
  sourceStatuses.forEach(element => updateSourceList(element.id, element.FormatStatus))
  });
}


xapi.status.on('Video Input Source', (status) => {
  if(status.FormatStatus){
    updateSourceList(status.id, status.FormatStatus);
  }
});

init();
const xapi = require('xapi');
const MAX_SCREENS = 3;
const MAX_SOURCES = 6;

var layoutfamily = 'equal';

let show_screens_sourcelist = [
    [] // screen 1
  , [] // screen 2
  , [] // screen 3
];


function getScreenId(output){
  switch(output){
   case 'left':
      return 1;
   case 'center':
      return 2;
   case 'right':
      return 3;
  default:
      return output;
  }
}


function getScreenName(outputId){
  switch(outputId){
   case 1:
      return 'left';
   case 2:
      return 'center';
   case 3:
      return 'right';
    }
}

function updateLayoutOnAllScreens(){
  for(var outputId=1;outputId<=MAX_SCREENS;outputId++){
    xapi.command("Video Matrix Assign", {Output: outputId, Mode: 'Add', Layout: layoutfamily});
  }
}

function addSourceToOutput(source, output){
  output = getScreenId(output);
  show_screens_sourcelist[output-1].push(source);
  xapi.command("Video Matrix Assign", {Output: output, SourceId: source, Mode: 'Add', Layout: layoutfamily});
  
  console.log('Outputs-sources: ' + JSON.stringify(show_screens_sourcelist));
}



function removeSourceFromOutput(source, output){
  output = getScreenId(output);
  var index = show_screens_sourcelist[output-1].indexOf(source);
  if (index > -1) {
      show_screens_sourcelist[output-1].splice(index, 1);
      xapi.command("Video Matrix UnAssign", {Output: output, SourceId: source});
  }
  console.log('Outputs-sources: ' + JSON.stringify(show_screens_sourcelist));
}

function updateUI(){
  for(var outputId=1;outputId<=MAX_SCREENS;outputId++){
    for(var sourceId=1;sourceId<=MAX_SOURCES;sourceId++){
      xapi.command("UserInterface Extensions Widget SetValue", {'WidgetId': 'local_' + getScreenName(outputId) + '_source_' + sourceId, 'Value': show_screens_sourcelist[outputId-1].indexOf(sourceId)>-1  ? 'On' : 'off'});
    }
  }

}


function resetAllLocalLayoutControls(){
  show_screens_sourcelist = [[],[],[]];
  updateUI();
  xapi.command("Video Matrix Reset");

  console.log('Outputs-sources: ' + JSON.stringify(show_screens_sourcelist));

}

xapi.event.on('UserInterface Extensions Widget Action', (event) => {
  if (event.Type == 'released'){
        switch(event.WidgetId){
            case 'b_screen1_source1':
                if (!show_screen1_source1){
                  xapi.command("Video Matrix Assign", {Output: 1, SourceId: 1, Mode: 'Add'});
                  show_screen1_source1 = true;
                  xapi.command("UserInterface Extensions Widget SetValue", {'WidgetId': event.WidgetId, 'Value':'on'});
                }
                else{
                  show_screen1_source1 = false;
                  screen1_needs_updating = true;
                  xapi.command("UserInterface Extensions Widget UnSetValue", {'WidgetId': event.WidgetId});
                }
                break;
                
            case 'local_source_layout':
              switch(event.Value){
                case 'equal':
                  layoutfamily = 'equal';
                  updateLayoutOnAllScreens();
                  break;
                case 'prominent':
                  layoutfamily = 'prominent';
                  updateLayoutOnAllScreens();
                  break;
              }
              break;
            case 'local_source_preset':
              switch(event.Value){
                case 'alloff':
                  resetAllLocalLayoutControls();
                  break;
                case 'twoplustwo':
                  resetAllLocalLayoutControls();
                  addSourceToOutput(1,1);
                  addSourceToOutput(2,1);
                  addSourceToOutput(3,2);
                  addSourceToOutput(4,2);
                  addSourceToOutput(5,3);
                  addSourceToOutput(6,3);
                  updateUI();
                  break;
                case 'threeplusthree':
                  resetAllLocalLayoutControls();
                  addSourceToOutput(1,1);
                  addSourceToOutput(2,1);
                  addSourceToOutput(3,1);
                  
                  addSourceToOutput(4,2);
                  addSourceToOutput(5,2);
                  addSourceToOutput(6,2);
                  
                  addSourceToOutput(1,3);
                  addSourceToOutput(3,3);
                  addSourceToOutput(5,3);
                  updateUI();
                  break;
              }
        }  
  }
  else if (event.Type == 'changed'){
    var regex = /local_(left|center|right)_source_(\d)/;
    var found = event.WidgetId.match(regex); 
    if(found){
      var output = found[1];
      var source = found[2];
      var outputId = getScreenId(output);
        if (event.Value == 'on'){
          addSourceToOutput(source, output);
        }
        else{
          removeSourceFromOutput(source, output);
        }
    }

  }


});


resetAllLocalLayoutControls();
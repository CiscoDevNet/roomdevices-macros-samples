import xapi from 'xapi';


// Don't want error diagnostics for this:
try {
  xapi.Config.Peripherals.Profile.TouchPanels.set(0);
}
catch(e) {
  console.warn('Not able to set touch panel ')
}

function onPanelClicked(event) {
  if (event.PanelId === 'webexOnFlip') {
    xapi.Command.Video.CEC.Output.SendInactiveSourceRequest();
    console.log('flip');
  }
}

xapi.Event.UserInterface.Extensions.Panel.Clicked.on(onPanelClicked);

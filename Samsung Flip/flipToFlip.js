import xapi from 'xapi';

function onPanelClicked(event) {
  if (event.PanelId === 'webexOnFlip') {
    xapi.Command.Video.CEC.Output.SendInactiveSourceRequest();
    console.log('flip');
  }
}

xapi.Event.UserInterface.Extensions.Panel.Clicked.on(onPanelClicked);

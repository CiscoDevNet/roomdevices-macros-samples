import xapi from 'xapi';

xapi.Event.UserInterface.Extensions.Panel.Clicked.on((e) => {
  if (e.PanelId === 'halfwake') {
    xapi.Command.Standby.Halfwake();
  }
});

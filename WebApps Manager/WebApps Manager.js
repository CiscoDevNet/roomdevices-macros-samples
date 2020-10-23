/*
 * This macro allows simple management of ad-hoc local web apps
 * on a device by providing a user interface to add new apps and
 * remove existing ones.
 */

import xapi from 'xapi';

const ManagerPanelId = 'webapp-manager';
const AddButtonId = 'webapp-add-button';
const webappPanelPrefix = 'webapp-app-';
const deleteButtonPrefix = 'webapp-delete-';
const awaitingFeedback = {};

// Prompt for user input for a given "field"
async function prompt(field) {
  const FeedbackId = `webapp-input-${field}`;

  await xapi.Command.UserInterface.Message.TextInput.Display({
    Text: 'Add web app',
    FeedbackId,
    Placeholder: `Enter ${field}`,
  });

  return new Promise((resolve, reject) => {
    awaitingFeedback[FeedbackId] = { resolve, reject };
  });
}

// Listen to all responses and resolve awaiting requests
xapi.Event.UserInterface.Message.TextInput.Clear.on((response) => {
  const awaiting = awaitingFeedback[response.FeedbackId];
  if (!awaiting) {
    return;
  }
  delete awaitingFeedback[response.FeedbackId];
  awaiting.reject();
});

xapi.Event.UserInterface.Message.TextInput.Response.on((response) => {
  const awaiting = awaitingFeedback[response.FeedbackId];
  if (!awaiting) {
    return;
  }
  delete awaitingFeedback[response.FeedbackId];
  awaiting.resolve(response.Text);
});

// Add a web app to the device
async function addWebApp() {
  let name;
  let url;
  
  try {
    name = await prompt('name');
    url = await prompt('URL');
  } catch (error) {
    return;
  }
  
  const xml = `<Extensions>
    <Version>1.7</Version>
    <Panel>
      <Type>Global</Type>
      <Icon>Lightbulb</Icon>
      <Name>${name}</Name>
      <ActivityType>WebApp</ActivityType>
      <ActivityData>${url}</ActivityData>
    </Panel>
  </Extensions>
  `;

  await xapi.Command.UserInterface.Extensions.Panel.Save({
    PanelId: `${webappPanelPrefix}${name}`,
  }, xml);
}

// Remove a webapp from the device
async function removeWebApp(PanelId) {
  await xapi.Command.UserInterface.Extensions.Panel.Remove({
    PanelId,
  });
}

// Add the management panel
async function addManagerPanel() {
  const extensions = await xapi.Command.UserInterface.Extensions.List();
  const webApps = !extensions?.Extensions?.Panel ? [] : extensions.Extensions.Panel.filter((panel) => {
    return panel.ActivityType === 'WebApp';
  });

  const webAppsXml = webApps.map((app) => {
    const panelId = app.PanelId;
    const url = app.ActivityData;
    return `
      <Row>
        <Name>${url}</Name>
        <Widget>
          <WidgetId>${deleteButtonPrefix}${panelId}</WidgetId>
          <Type>Button</Type>
          <Options>size=1;icon=end</Options>
        </Widget>
      </Row>
    `;
  }).join('\n');

  const xml = `<Extensions>
  <Version>1.7</Version>
  <Panel>
    <Order>1000</Order>
    <Type>Global</Type>
    <Icon>Language</Icon>
    <Color>#07C1E4</Color> 
    <Name>Web apps</Name>
    <ActivityType>Custom</ActivityType>
    <Page>
      <Name>Manage web apps</Name>
      <Row>
        <Name>Add web app</Name>
        <Widget>
          <WidgetId>${AddButtonId}</WidgetId>
          <Type>Button</Type>
          <Options>size=1;icon=plus</Options>
        </Widget>
      </Row>
      ${webAppsXml}
    </Page>
  </Panel>
</Extensions> 
  `

  await xapi.Command.UserInterface.Extensions.Panel.Save({
    PanelId: ManagerPanelId,
  }, xml);
}

// Startup!
async function main() {
  addManagerPanel();

  xapi.Event.UserInterface.Extensions.Widget.Action.on(async ({ Type, WidgetId}) => {
    if (Type === 'clicked') {
      if (WidgetId === AddButtonId) {
        await addWebApp();
        return;
      }

      if (WidgetId.startsWith(deleteButtonPrefix)) {
        await removeWebApp(WidgetId.replace(deleteButtonPrefix, ''));
        return;
      }
    }
  });

  // Update manager on layout change
  xapi.Event.UserInterface.Extensions.Widget.LayoutUpdated.on(addManagerPanel);
}

main();

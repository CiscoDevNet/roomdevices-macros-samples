import xapi from 'xapi';

// Add/remove from list to update webapps
const webApps = [
  { name: 'Cisco', url: 'cisco.com' },
  { name: 'NRK', url: 'nrk.no' },
  { name: 'Google News', url: 'news.google.com' }
  // { name: 'Yr', url: 'yr.no' },
];

const closePanelId  = 'webapp_close_panel';
const closeId  = 'webapp_close';
const webappPrefix = 'webapp_launcher_';

const sleep = (timeout) => new Promise((resolve) => setTimeout(resolve, timeout));

let isInCall = false;
let isInWebRTCCall = false;

async function addWebAppPanel(order, name) {
  console.debug(`Adding WebApp ${name}`);
  const panelId = `${webappPrefix}${name}`;
  const xml = `<?xml version="1.0"?>
<Extensions>
  <Version>1.7</Version>
  <Panel>
    <Order>${order}</Order>
    <PanelId>${panelId}</PanelId>
    <Origin>local</Origin>
    <Type>Statusbar</Type>
    <Icon>Language</Icon>
    <Color>#07C1E4</Color>
    <Name>${name}</Name>
    <ActivityType>Custom</ActivityType>
  </Panel>
</Extensions>`;

  await xapi.Command.UserInterface.Extensions.Panel.Save({
    PanelId: panelId,
  }, xml);
}

async function addWebApps() {
  let order = 2;
  for (const { name, url } of webApps) {
    await addWebAppPanel(order++, name);
  }
}

async function removeWebApps() {
  const apps = await xapi.Command.UserInterface.Extensions.List();

  if (!apps.Extensions || webApps==="undefined" || !webApps.length) {
    return;
  }

  const removeCmds = apps.Extensions.Panel
    .map((panel) => panel.PanelId)
    .filter((panelId) => {
      return panelId.startsWith(webappPrefix);
    })
    .map((panelId) => removePanel(panelId));

  await Promise.all(removeCmds);
}

async function addClosePanel() {
  const config = await xapi.Command.UserInterface.Extensions.List();
  if (config.Extensions && webApps.length) {
    const closePanel = config.Extensions.Panel.find((panel) => panel.PanelId === closePanelId);
    if (closePanel) {
      console.debug('Close panel already added');
      return;
    }
  }

  console.debug('Adding close panel');
  const xml = `<?xml version="1.0"?>
<Extensions>
  <Version>1.7</Version>
  <Panel>
    <Order>0</Order>
    <PanelId>${closePanelId}</PanelId>
    <Origin>local</Origin>
    <Type>Statusbar</Type>
    <Icon>Language</Icon>
    <Color>#FF503C</Color>
    <Name>Close Web App </Name>
    <ActivityType>Custom</ActivityType>
    <Page>
      <Name>Close Web App</Name>
      <Row>
        <Name>Row</Name>
        <Widget>
          <WidgetId>${closeId}</WidgetId>
          <Name>Close</Name>
          <Type>Button</Type>
          <Options>size=2</Options>
        </Widget>
      </Row>
      <Options>hideRowNames=1</Options>
    </Page>
  </Panel>
</Extensions>`;

  await xapi.Command.UserInterface.Extensions.Panel.Save({
    PanelId: closePanelId,
  }, xml);
}

xapi.Event.UserInterface.Extensions.Panel.Clicked.PanelId.on(async (panelId) => {
  if (!panelId.startsWith(webappPrefix) || webApps==="undefined" || !webApps.length) {
    return;
  }

  const appName = panelId.replace(webappPrefix, '');
  const result = webApps.find(({ name }) => appName === name);
  if (!result) {
    console.error(`Unexpected panel matching ${webappPrefix}: ${panelId}`);
    return;
  }

  await openWebApp(result.url);
});

xapi.Event.UserInterface.Extensions.Widget.Action.on(async (action) => {
  if (action.WidgetId === closeId && action.Type === 'clicked') {
    closeWebApp();
    return;
  }
});

async function openWebApp(url) {
  console.log('Launching Web App:', url);
  await xapi.Command.UserInterface.WebView.Display({
    Url: url,
  });
}

async function openClosePanel() {
  await addClosePanel();
  console.debug('Opening the close panel');
  await sleep(500);
  await xapi.Command.UserInterface.Extensions.Panel.Open({ PanelId: closePanelId });
}

async function closeWebApp() {
  console.debug('Closing Web App');
  await xapi.Command.UserInterface.WebView.Clear();
  removePanel(closePanelId);
}

async function removePanel(PanelId) {
  console.debug('Removing panel', PanelId);
  await xapi.Command.UserInterface.Extensions.Panel.Close();
  await xapi.Command.UserInterface.Extensions.Panel.Remove({
    PanelId,
  });
}

xapi.Status.UserInterface.WebView.on(async (webView) => {
  if (!webView.Status || isInCall || isInWebRTCCall) {
    return;
  }
  if (webView.Status === 'Visible') {
    await openClosePanel();
  } else {
    await removePanel(closePanelId);
  }
});

xapi.Status.SystemUnit.State.NumberOfActiveCalls.on(async (callCount) => {
  isInCall = callCount > 0;
});

xapi.Status.WebRTC.on(async (WebRTC) => {
  if (WebRTC.Active === "True"){
    isInWebRTCCall = true;
    await removePanel(closePanelId);
    await removeWebApps();
  }
  else{
    isInWebRTCCall = false;
    await addWebApps();
  }
});

async function main() {
  if (!isInCall && !isInWebRTCCall){
    await xapi.Command.UserInterface.WebView.Clear();
    await removePanel(closePanelId);
    await removeWebApps();
    await addWebApps();
  }
}

main();

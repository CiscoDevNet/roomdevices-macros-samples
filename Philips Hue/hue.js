const ui = require('./ui');
const {
  Config, Panel, Page, Row, Button, ToggleButton, Slider, GroupButton
} = require('./ui-builder');
const Hue = require('./hue-lib');
const xapi = require('xapi');

const hue = new Hue();

function createSettings() {
  return (
    Page({ name: 'Settings' }, [
      Row({ text: 'Hue Bridge' }, [
        Button({ widgetId: 'hue-bridge-find', text: 'Find' }),
      ]),
      Row({ text: 'User' }, [
        Button({ widgetId: 'hue-user-create', text: 'Create' })
      ]),
      Row({ text: 'Create User Interface' }, [
        Button({ widgetId: 'hue-ui-lights', text: 'For lights...' }),
        Button({ widgetId: 'hue-ui-groups', text: 'For rooms...' }),
      ])
    ])
  );
}

function createLightRow(id, name, hasSlider, hasColors) {
  const colors = { white: 'White', blue: 'Blue', red: 'Red', yellow: 'Yellow' };
  return (
    Row({ text: name }, [
      ToggleButton({ widgetId: 'huectrl-' + id + '-on' }),
      hasSlider && Slider({ widgetId: 'huectrl-' + id + '-bri' }),
      hasColors && GroupButton({ widgetId: 'huectrl-' + id + '-col', buttons: colors }),
    ])
  );
}

async function createPanel(lights) {
  const settings = createSettings();

  // Create a panel for controlling lights in the room
  const panel = Config({}, [
    Panel({ name: 'Lights', icon: 'Lightbulb', color: 'orange' }, [
      lights, settings
    ])
  ]);

  await ui.panelSave('hue-lights', panel);
  ui.alert('Lights page created!');
}


async function buildUi(lights) {
  const rows = [];
  Object.keys(lights).forEach((id) => {
    const light = lights[id];
    console.log('Light', id, light.name, light.type, light.productname);
    rows.push(createLightRow(id, light.name, true, false));
  });

  const lightPage = Page({ name: 'Lights' }, rows);
  createPanel(lightPage);
}

async function createPairing() {
  try {
    const token = await hue.createToken();
    console.log('token', token);
    await hue.saveConfig();
  }
  catch(e) {
    console.warn(e);
    ui.alert('Not able to pair. Did you remember to tap the button on the Bridge?');
  }
}

async function searchBridge() {
  try {
    const ip = await hue.discoverBridge();
    console.log('bridge', ip);
    const prompt = { Title: 'Found Bridge!', Text: 'Tap the button on your Hue bridge to allow pairing, then tap Ok', FeedbackId: 'hue-pair' };
    setTimeout(() => ui.prompt(prompt, ['Ok'], createPairing), 500); // timeout => roomos bug
  }
  catch(e) {
    console.warn(e);
  }
}

function startWizard() {
  const prompt = { Title: 'Starting Hue Wizard', Text: 'Tap Ok to discover the Hue bridge', FeedbackId: 'hue-find-bridge' };
  ui.prompt(prompt, ['Ok'], searchBridge);
}

function onWidgetAction(e) {
  const { WidgetId, Value, Type } = e;
  if (WidgetId.startsWith('huectrl')) {
    const [_, id, prop] = WidgetId.split('-');
    if (prop === 'on') {
      hue.setLightPower(id, Value === 'on');
    }
    else if (prop === 'bri') {
      hue.setLightState(id, { bri: parseInt(Value) });
    }
  }
}

async function init() {
  await xapi.Config.HttpClient.Mode.set('On');
  await xapi.Config.HttpClient.AllowInsecureHTTPS.set('True');
  await hue.loadConfig();
  const state = await hue.getLightState();
  buildUi(state);
  xapi.Event.UserInterface.Extensions.Widget.Action.on(onWidgetAction);
}

init();
// hue.save({ ip: '10.0.0.3', token: 'lMuzj97bktiU-ED8qh-r8IVPNTfp5X2VblRdOWP9' });

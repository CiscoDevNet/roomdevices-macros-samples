const ui = require('./ui');
const {
  Config, Panel, Page, Row, Text, Button, ToggleButton, Slider, GroupButton
} = require('./ui-builder');
const Hue = require('./hue-lib');
const xapi = require('xapi');

const hue = new Hue();

const colors = {
  red: {
    hue: 65384,
    sat: 254,
  },
  blue: {
    hue: 45304,
    sat: 254,
  },
  yellow: {
    hue: 9196,
    sat: 254,
  },
  white: {
   hue: 41346,
    sat: 86,
  }
};

async function createUi(lights) {
  await ui.panelRemove('hue-lights');

  const settings = createSettings();
  const lightsPage = lights ? createLightsPage(lights) : null;
  const panel = Config({}, [
    Panel({ name: 'Lights', icon: 'Lightbulb', color: 'orange' }, [
      lightsPage, settings
    ])
  ]);

  setTimeout(async () => {
    await ui.panelSave('hue-lights', panel);
    // ui.alert('Lights page created!');
  }, 1000);
}

function createSettings() {
  const status = 'Paired to bridge';
  return (
    Page({ name: 'Settings' }, [
      Row({ text: 'Status' }, [
        Text({ widgetId: 'hue-bridge-status', size: 3, text: status, align: 'center', fontSize: 'normal' })
      ]),
      Row({ text: 'Hue Bridge' }, [
        Button({ widgetId: 'hue-bridge-find', size: 3, text: 'Pair' }),
      ]),
      Row({ text: 'Create User Interface' }, [
        Button({ widgetId: 'hue-wizard-lights', size: 3, text: 'For individual lights' }),
      ]),
      // Row({ text: 'Create User Interface', }, [
      //   Button({ widgetId: 'hue-wizard-lights', size: 3, text: 'For rooms / groups' }),
      // ])
    ])
  );
}

function createLightsPage(lights) {
  const rows = [];

  lights.forEach((light) => {
    const { id, name, gui } = light;
    const hasColor = gui === 'color';
    const hasBrightness = gui === 'color' || gui === 'brightness';
    rows.push(createLightRow(id, name, hasBrightness, hasColor));
  });
  const lightPage = Page({ name: 'Lights' }, rows);
  return lightPage;
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

function showPromptDelayed(prompt, buttons, callback) {
  // timeout => roomos bug
  setTimeout(() => ui.prompt(prompt, buttons, callback), 1000);
}

function startWizard() {
  const prompt = { Title: 'Starting Hue Wizard', Text: 'Tap Ok to discover the Hue bridge', FeedbackId: 'hue-find-bridge' };
  ui.prompt(prompt, ['Ok'], searchBridge);
}

async function searchBridge() {
  console.log('search bridge');
  try {
    const ip = await hue.discoverBridge();
    console.log('bridge', ip);
    const prompt = { Title: 'Found Bridge!', Text: 'Tap the button on your Hue bridge to allow pairing, then tap Ok', FeedbackId: 'hue-pair' };
    ui.prompt(prompt, ['Ok'], createPairing);
  }
  catch(e) {
    console.warn(e);
  }
}

async function createPairing() {
  try {
    const token = await hue.createToken();
    console.log('token', token);
    await hue.saveConfig();
    try {
      const lights = await hue.getLightState();
      // promptNextLight(lights);
      createUi(null);
    }
    catch(e) {
      console.error(e);
      ui.alert('Not able to retrieve info from Hue bridge');
    }
  }
  catch(e) {
    console.warn(e);
    ui.alert('Not able to pair. Did you remember to tap the button on the Bridge?');
  }
}

// we traverse each device in the hue state list, and add a prop saying which gui user wants for it (or none)
function promptNextLight(state) {
  // next device where no gui has not been defined yet
  const nextId = Object.keys(state).find(key => !(state[key].gui));
  const light = state[nextId];

  if (!nextId) {
    const lights = Object.keys(state).map((id) => {
      const { name, gui } = state[id];
      if (gui !== 'none') {
        return { id, name, gui };
      }
    }).filter(i => i); // remove empty

    createUi(lights);
    return;
  };

  const prompt = {
    Title: `Found: ${light.name} (#${nextId})`,
    Text: `Which controls would you like for this ${light.type}?`,
    FeedbackId: 'hue-prompt-controls',
  };

  const options = ['None (skip)', 'Power only', 'Power and brightness', 'Power, brightness and color'];
  const optionKeys = { 0: 'none', 1: 'power', 2: 'brightness', 3: 'color' };

  showPromptDelayed(prompt, options, (chosen) => {
    state[nextId].gui = optionKeys[chosen];
    console.log('update light', nextId);
    // console.log('state updated', state);
    promptNextLight(state);
  });
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
    else if (prop === 'col') {
      const color = colors[Value];
      console.log('set', Value, color);
      if (color) {
        hue.setLightState(id, color);
      }
    }
  }
}

async function pollState() {
  const lights = await hue.getLightState();
  Object.keys(lights).forEach((id) => {
    const light = lights[id];
    ui('huectrl-' + id + '-bri').setValue(String(light.state.bri));
  });
}

async function panelClicked() {
  console.log('panel');
  if (!hue.isConfigured()) {
    startWizard();
  }
  else {
    console.log('already paired');
  }
}

async function init() {
  await xapi.Config.HttpClient.Mode.set('On');
  await xapi.Config.HttpClient.AllowInsecureHTTPS.set('True');
  await hue.loadConfig();
  xapi.Event.UserInterface.Extensions.Widget.Action.on(onWidgetAction);
  ui('hue-lights').onPanelClicked(panelClicked);
  ui('hue-bridge-find').onButtonClicked(searchBridge);
  ui('hue-wizard-lights').onButtonClicked(async () => {
    const state = await hue.getLightState();
    promptNextLight(state);
  });
}

init();

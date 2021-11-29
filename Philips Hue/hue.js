const ui = require('./ui');
const {
  Config, Panel, Page, Row, Text, Button, ToggleButton, Slider, IconButton
} = require('./ui-builder');
const Hue = require('./hue-lib');
const xapi = require('xapi');

const hue = new Hue();

// How often to poll hue bridge and update ui widgets. for demo set low
// otherwise it shouldnt be necessary to poll more often than once a minute or so
const pollInterval = 3;
let lastState;

async function createUi(lights) {
  await ui.panelRemove('hue-lights');
  await ui.panelRemove('hue-colors');

  const settings = createSettings();
  const lightsPage = lights ? createLightsPage(lights) : null;
  const panel = Config({ version: '1.5' }, [
    Panel({ name: 'Hue Lights', icon: 'Lightbulb', color: 'orange' }, [
      lightsPage, settings
    ])
  ]);

  setTimeout(async () => {
    await ui.panelSave('hue-lights', panel);
    if (lights) {
      ui.alert('A user interface for your lights was created!');
      // needed to fix a bug due to widgets not being updated properly after creation
      setTimeout(async () => {
        await xapi.Command.UserInterface.Extensions.Panel.Update({
          PanelId: 'hue-lights', Name: 'Lights' });
        await ui.panelOpen('hue-lights');
        updateState();
      }, 1000);
    }
  }, 1000);
}

function createSettings() {
  const status = 'Paired to bridge';
  return (
    Page({ pageId: 'hue-settings', name: 'Settings' }, [
      Row({ text: 'Create User Interface' }, [
        Button({ widgetId: 'hue-wizard-lights', size: 3, text: 'For individual lights' }),
        Button({ widgetId: 'hue-wizard-groups', size: 3, text: 'For groups / rooms' }),
      ]),
      Row({ text: 'Status' }, [
        Text({ widgetId: 'hue-bridge-status', size: 3, text: status, align: 'center', fontSize: 'normal' })
      ]),
      Row({ text: 'Hue Bridge' }, [
        Button({ widgetId: 'hue-bridge-find', size: 3, text: 'Pair again' }),
      ]),
    ])
  );
}

function createLightsPage(lights) {
  const rows = [];

  // console.log('create lights', lights);
  lights.forEach((light) => {
    const { name, gui, isGroup } = light;
    const id = isGroup ? 'g' + light.id : light.id;
    const hasColor = gui === 'color';
    const hasBrightness = gui === 'color' || gui === 'brightness';

    rows.push(createLightRow(id, name, hasBrightness, hasColor));
  });
  const lightPage = Page({ pageId: 'hue-controls', name: 'Lights' }, rows);
  return lightPage;
}

function createLightRow(id, name, hasSlider, hasColors) {
  return (
    Row({ text: name }, [
      ToggleButton({ widgetId: 'huectrl-' + id + '-on' }),
      hasSlider && Slider({ widgetId: 'huectrl-' + id + '-bri', size: hasColors ? 2 : 3 }),
      hasColors && Button({ widgetId: 'huectrl-' + id + '-col', text: 'Color', size: 1 }),
    ])
  );
}

function showPromptDelayed(prompt, buttons, callback) {
  // timeout => roomos bug
  setTimeout(() => ui.prompt(prompt, buttons, callback), 1000);
}

function startWizard() {
  const prompt = { Title: 'Starting Hue Wizard', Text: 'Tap Ok to discover the Hue bridge', FeedbackId: 'hue-find-bridge' };
  showPromptDelayed(prompt, ['Ok'], searchBridge);
}

async function searchBridge() {
  try {
    const ip = await hue.discoverBridge();
    console.log('bridge', ip);
    const prompt = { Title: 'Found Bridge!', Text: 'Tap the button on your Hue bridge to allow pairing, then tap Ok', FeedbackId: 'hue-pair' };
    showPromptDelayed(prompt, ['Ok'], createPairing);
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
      await hue.getLightState();
      createUi(null);
      ui.alert('You are paired. You can now create your own lights UI.');
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

// we traverse each item in the hue state list, and add a prop saying which gui user wants for it (or none)
function promptNextItem(state, isGroup) {
  // next device where no gui has not been defined yet
  const nextId = Object.keys(state).find(key => !(state[key].gui));
  const item = state[nextId];

  if (!nextId) {
    const items = Object.keys(state).map((id) => {
      const { name, gui } = state[id];
      if (gui !== 'none') {
        return { id, name, gui, isGroup };
      }
    }).filter(i => i); // remove empty

    if (items.length) {
      createUi(items);
    }
    else {
      ui.alert('No items were selected.');
    }
    return;
  };

  const prompt = {
    Title: `Found: ${item.name} (#${nextId})`,
    Text: `Which controls would you like for this ${item.type}?`,
    FeedbackId: 'hue-prompt-controls',
  };

  const type = hue.getType(item);
  const options = ['None (skip)', 'Power only'];
  if (type === 'color' || type === 'brightness' || type === 'color-temperature') {
    options.push('Brightness');
  }
  if (type === 'color') {
    options.push('Brightness and color');
  }
  const optionKeys = { 0: 'none', 1: 'power', 2: 'brightness', 3: 'color' };

  showPromptDelayed(prompt, options, (chosen) => {
    state[nextId].gui = optionKeys[chosen];
    promptNextItem(state, isGroup);
  });
}

async function createColorPanel(id) {
  const panelId = 'hue-colors';
  const legend = 'Red | Yellow | Lime | Green | Blue | Purple | Magenta | Pink |';

  const panel = Config({ version: '1.5' }, [
    Panel({ panelId, type: 'Never', name: 'Hue Colors', icon: 'Lightbulb', color: 'orange' },
      Page({ name: 'Hue Colors' }, [
        Row({ text: 'Colors'}, Text({ widgetId: 'huecolor', size: 4, fontSize: 'small', text: legend })),
        Row({ }, Slider({ widgetId: 'huectrl-' + id + '-hue', size: 4 })),
        Row({ text: 'Saturation' }, Slider({ widgetId: 'huectrl-' + id + '-sat', size: 4 })),
        Row({}, Button({ widgetId: 'hue-colors-back', text: 'Back' })),
      ]),
    ),
  ]);

  await ui.panelSave(panelId, panel);
  const state = await hue.getLightState();
  if (state && state[id]) {
    ui('huectrl-' + id + '-sat').setValue(state[id].state.sat);
    ui('huectrl-' + id + '-hue').setValue(state[id].state.hue * 255 / 65535);
  }

  return ui.panelOpen(panelId);
}

async function onWidgetAction(e) {
  const { WidgetId, Value, Type } = e;
  if (WidgetId.startsWith('huectrl')) {
    try {
      const [_, id, prop] = WidgetId.split('-');
      if (prop === 'on') {
        await hue.setLightPower(id, Value === 'on')
        setTimeout(updateState, 500);
      }
      else if (prop === 'toggle' && Type === 'clicked') {
        const previous = lastState[id] && lastState[id].state.on;
        await hue.setLightPower(id, !previous);
        setTimeout(updateState, 500);
      }
      // sliders:
      else if (Type === 'released') {
        if (prop === 'bri') {
          await hue.setLightState(id, { on: true, bri: parseInt(Value) })
        }
        else if (prop === 'hue') {
          const h = Value * 65535 / 255;
          await hue.setLightState(id, { on: true, hue: h })
        }
        else if (prop === 'sat') {
          await hue.setLightState(id, { on: true, sat: parseInt(Value) })
        }
        else if (prop === 'col') {
          await createColorPanel(id)
        }
        setTimeout(updateState, 500);
      }
    }
    catch(e) {
      console.warn('unable to process ui event', e);
    }
  }
}

async function updateState() {
  if (!hue.isConfigured()) return;

  const lights = await hue.getLightState();
  const groups = await hue.getGroupState();
  lastState = lights;
  const widgets = await xapi.Status.UserInterface.Extensions.Widget.get();
  const controls = widgets.filter(w => w.WidgetId.startsWith('huectrl-'));

  controls.forEach(({ WidgetId }) => {
    const [_, id, type] = WidgetId.match(/huectrl-g?(\d+)-(.*)/);
    const isGroup = WidgetId.startsWith('huectrl-g');
    const state = !isGroup
      ? lights[id] && lights[id].state
      : groups[id] && groups[id].action;

    const on = state.on; // && state.reachable; reachable not for groups
    const bri = on && state.bri || 0;
    const sat = on && state.sat || 0;

    if (type === 'on') {
      ui(WidgetId).setValue(on ? 'on' : 'off');
    }
    else if (type === 'bri') {
      ui(WidgetId).setValue(bri);
    }
    else if (type === 'sat') {
      ui(WidgetId).setValue(sat);
    }
  });
}

async function panelClicked() {
  if (!hue.isConfigured()) {
    startWizard();
  }
  else {
    updateState();
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
    promptNextItem(state, false);
  });
  ui('hue-wizard-groups').onButtonClicked(async () => {
    const state = await hue.getGroupState();
    promptNextItem(state, true);
  });
  ui('hue-colors-back').onButtonClicked(() => ui.panelOpen('hue-lights'));
  // setInterval(updateState, pollInterval * 1000);
}

init();

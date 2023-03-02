import xapi from 'xapi';

const saturationLimit = 14;
const exposureLimit = 3;

// When a config changes
async function onConfig(configPath, onChange) {
  try {
    await xapi.config.on(configPath, onChange);
    await xapi.config.get(configPath).then(onChange);
  }
  catch(e) {
    console.warn('Not able to use config', configPath, e);
  }
}

// When a ui event occurs
function onUi(widgetId, onEvent) {
  xapi.Event.UserInterface.Extensions.Widget.Action.on((e) => {
    if (e.WidgetId === widgetId) {
      onEvent(e);
    }
  })
}

function setWidget(widgetId, value) {
  xapi.Command.UserInterface.Extensions.Widget.SetValue({ Value: String(value), WidgetId: widgetId })
}

// -20...20
async function setSaturation(level) {
  try {
    // console.log('set saturation', level);
    await xapi.Config.Cameras.Camera.ColorSaturation.Level.set(level);
  }
  catch(e) {
    xapi.Command.UserInterface.Message.Alert.Display({ Text: 'Sorry, not currently able to adjust the saturation on this device.', Duration: 3 });
    console.warn('not able to set saturation');
  }
}

// -3..3
function setExposure(level) {
  try {
    // console.log('set exposure', level);
    xapi.Config.Cameras.Camera.ExposureCompensation.Level.set(level);
  }
  catch(e) {
    console.warn('not able to set saturation');
  }
}

function showSelfview(on, fullscreen) {
  xapi.Command.Video.Selfview.Set({ Mode: on ? 'On' : 'Off', FullscreenMode: fullscreen ? 'On': 'Off' });
}

function init() {

  onUi('instacam-saturation', e => {
    const level = parseInt(saturationLimit * (Number(e.Value)) / 255);
    setSaturation(level);
  });

  onUi('instacam-bw', e => {
    setSaturation(e.Value === 'on' ? -20 : 0);
  });

  onConfig('Cameras Camera ColorSaturation Level', value => {
    const valid = Math.max(0, Math.min(saturationLimit, value));
    const level = valid * 255 / saturationLimit;
    // console.log('set sat widget', level);
    setWidget('instacam-saturation', level);
    setWidget('instacam-saturation-value', value);
    setWidget('instacam-bw', value < 0 ? 'On' : 'Off');
  });

  onUi('instacam-exposure', async (e) => {
    const value = Number(await xapi.Config.Cameras.Camera.ExposureCompensation.Level.get());
    if (e.Type !== 'clicked') return;
    const up = e.Value === 'increment';
    const next = up ? value + 1 : value - 1;
    const bounded = Math.max(-exposureLimit, Math.min(exposureLimit, next));
    setExposure(bounded);
  });

  onConfig('Cameras Camera ExposureCompensation Level', value => {
    setWidget('instacam-exposure', value);
  });

  onUi('instacam-exposure-reset', () => setExposure(0));

  onUi('instacam-selfview', ({ Value }) => {
    if (Value === 'large') {
      showSelfview(true, true);
      // fullscreen self view closes panel, reopen
      xapi.Command.UserInterface.Extensions.Panel.Open({ PanelId: 'instacam' });
    }
    else if (Value === 'small') {
      showSelfview(true, false);
    }
    else if (Value === 'off') {
      showSelfview(false);
    }
  });
}

init();
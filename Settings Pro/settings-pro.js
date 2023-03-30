import xapi from 'xapi';
import ui from './ui';

// ------------------- HELPER FUNCTIONS -----------------------------------------

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
  xapi.Command.UserInterface.Extensions.Widget.SetValue({ Value: value, WidgetId: widgetId })
}

// ------------------- ACTUAL SETTINGS -----------------------------------------


// Misc section

const widgetUltrasound = 'settingspro-ultrasound-pairing';
const configUltrasound = 'Audio Ultrasound MaxVolume';
onUi(widgetUltrasound, ({ Value }) => xapi.config.set(configUltrasound, Value === 'on' ? 70 : 0));
onConfig(configUltrasound, val => setWidget(widgetUltrasound, Number(val) > 0 ? 'On' : 'Off'));


const widgetHideWork = 'settingspro-hide-work';
const configHideWork = 'UserInterface Features HideAll';
onUi(widgetHideWork,  ({ Value}) => xapi.config.set(configHideWork, Value === 'on' ? 'True' : 'False'));
onConfig(configHideWork, val => setWidget(widgetHideWork, val === 'True' ? 'on' : 'off'));
// Need to show buttons in call, otherwise you miss call controls:
xapi.Status.SystemUnit.State.NumberOfActiveCalls.on((value) => {
  if (Number(value) > 0) {
    xapi.config.set(configHideWork, 'False');
  }
});

const widgetHalfwake = 'settingspro-disable-halfwake';
const configHalfwake = 'Standby Halfwake Mode';
onUi(widgetHalfwake, ({ Value }) => xapi.config.set(configHalfwake, Value === 'on' ? 'Manual' : 'Auto'));
onConfig(configHalfwake, val => setWidget(widgetHalfwake, val === 'Auto' ? 'off' : 'on'));

function cameraDiagnostics(start) {
  const cmd = 'Cameras SpeakerTrack Diagnostics ' + (start ? 'Start' : 'Stop');
  xapi.command(cmd);
  const selfview = { Mode: start ? 'On' : 'Off', FullscreenMode: 'On' };
  xapi.command('Video Selfview Set', selfview);
}
ui('settingspro-speakertrack-start').onButtonClicked(() => cameraDiagnostics(true));
ui('settingspro-speakertrack-stop').onButtonClicked(() => cameraDiagnostics(false));

// Audio section

const configAudioLevel = 'Audio Input USBC 1 Level';
const widgetAudioLevelSlider = 'settingspro-audio-level-slider';
const widgetAudioLevelTxt = 'settingspro-audio-level-txt';
onUi(widgetAudioLevelSlider, ({ Value }) => {
  const db = parseInt(-24 + 24 * Number(Value) / 255);
  xapi.config.set(configAudioLevel, Number(db));
});
onConfig(configAudioLevel, db => {
  const v = (Number(db) + 24) * 255 / 24;
  setWidget(widgetAudioLevelSlider, parseInt(v));
  setWidget(widgetAudioLevelTxt, db + ' db');
});

const configAudioMute = 'Audio Input HDMI 1 VideoAssociation MuteOnInactiveVideo';
const widgetAudioMute = 'settingspro-audio-share-toggle';
onUi(widgetAudioMute, ({ Value }) => {
  xapi.config.set(configAudioMute, Value === 'on' ? 'Off' : 'On')
    .catch(e => console.warn('not able to set Audio mute', e));
});
onConfig(configAudioMute, val => setWidget(widgetAudioMute, val === 'On' ? 'off' : 'on'));


// Web section

let previousUrl = '';
const widgetWebOpen = 'settingspro-web-open';
ui(widgetWebOpen).onButtonClicked(() => {
  ui.textInput({
    Title: 'Open web page',
    Text: 'Or a word (without .) to Google',
    FeedbackId: 'open-url',
    Placeholder: 'youtube.com',
    InputText: previousUrl
    }, (input) => {
    const isUrl = input.includes('.');
    let url = isUrl ? input : 'https://google.com/search?q=' + input;
    xapi.Command.UserInterface.WebView.Display({ Url: url });
    if (isUrl) {
      previousUrl = url;
    }
  });
});

// Remember web data
const widgetKeepCookies = 'settingspro-keep-cookies';
const configKeepCookies = 'RoomCleanup AutoRun ContentType WebData';
onUi(widgetKeepCookies, ({ Value }) => xapi.config.set(configKeepCookies, Value === 'on' ? 'Off' : 'Daily'));
onConfig(configKeepCookies, val => setWidget(widgetKeepCookies, val === 'Daily' ? 'off' : 'on'));

// Delete web data
const widgetDeleteWebData = 'settingspro-delete-webdata';
const commandDeleteWebData = 'WebEngine DeleteStorage';
ui(widgetDeleteWebData).onButtonClicked(() => {
  xapi.command(commandDeleteWebData);
  ui.alert('Web data deleted');
});

// Remote debugging
const widgetRemoteDebugging = 'settingspro-remote-debugging';
const configRemoteDebugging = 'WebEngine RemoteDebugging';
onUi(widgetRemoteDebugging, ({ Value }) => xapi.config.set(configRemoteDebugging, Value === 'on' ? 'On' : 'Off'));
onConfig(configRemoteDebugging, val => setWidget(widgetRemoteDebugging, val === 'On' ? 'on' : 'off'));


// Immersive share

const widgetSelfview = 'settingspro-selfview';

function setImmersiveParam(values, clearPreset) {
  xapi.command('Cameras Background ForegroundParameters Set', values);
  console.log(values);
  if (clearPreset) {
    ui('settingspro-immersive-preset').unsetValue();
  }
}

const immersivePos = {
  center: { X: 4470, Y: 6274, Scale: 75, Opacity: 100 },
  bottomLeft: { X: 1137, Y: 7411, Scale: 52, Opacity: 100 },
  bottomRight: { X: 7254, Y: 7411, Scale: 52, Opacity: 100 },
};

ui(widgetSelfview).onButtonClicked(() => xapi.Command.Video.Selfview.Set({ FullscreenMode: 'On', Mode: 'On' }));
ui('settingspro-immersive-scale').onSliderChanged(val => {
  setImmersiveParam({ Scale: parseInt(val) }, true);
}, 1, 100);
ui('settingspro-immersive-x').onSliderChanged(val => {
  setImmersiveParam({ X: parseInt(val) }, true);
}, 0, 10000);
ui('settingspro-immersive-y').onSliderChanged(val => {
  setImmersiveParam({ Y: parseInt(val) }, true);
}, 0, 10000);
ui('settingspro-immersive-preset').onGroupButtonPressed(val => {
  const values = immersivePos[val];
  if (values) {
    setImmersiveParam(values);
    setWidget('settingspro-immersive-scale', parseInt(values.Scale * 255 / 100));
    setWidget('settingspro-immersive-x', parseInt(values.X * 255 / 10000));
    setWidget('settingspro-immersive-y', parseInt(values.Y * 255 / 10000));
  }
})

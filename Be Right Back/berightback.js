import xapi from 'xapi';

// Change this to whatever you prefer when you are actually in the call
// See https://roomos.cisco.com/xapi/Command.Cameras.Background.Set
const DefaultInCallMode = 'Blur';

// Which virtual bg spot to use
const spot = 'User3';

const base = 'https://raw.githubusercontent.com/CiscoDevNet/roomdevices-macros-samples/master/Be Right Back/';

const urls = {
  toilet: base + 'toilet.jpeg',
  badhair: base + 'badhair.jpeg',
  kids: base + 'kids.jpeg',
  coffee: base + 'coffee.jpeg',
  cooking: base + 'cooking.jpeg',
  eating: base + 'eating.jpeg',
};

function alert(msg, duration = 3) {
  xapi.Command.UserInterface.Message.Alert.Display({
    Text: msg,
    Duration: duration,
  });
}

async function setVirtualBg(url, spot) {
  console.log('update', url);
  alert('Updating background...');
  try {
    // if spot is already active, need to swap (roomos bug):
    await xapi.Command.Cameras.Background.Set({ Mode: 'Blur' });

    xapi.Command.Video.Selfview.Set({ Mode: 'On' });
    await xapi.Command.Cameras.Background.Fetch({ Url: url, Image: spot });
    await xapi.Command.Cameras.Background.Set({ Image: spot, Mode: 'Image' });
    setTimeout(() => xapi.Command.Video.Selfview.Set({ Mode: 'Off' }), 6000);
  }
  catch(e) {
    console.log(e);
    alert('Sorry something went wrong');
  }
}

function askTurnOffNotice() {
  xapi.Command.UserInterface.Message.Prompt.Display({
    Text: 'Person detected. Turn off away status?',
    FeedbackId: 'berightback_disable',
    "Option.1": "Yes",
    "Option.2": "No",
  });
}

async function proximityChanged(value) {
  const present = value === 'True';
  const incall = await xapi.Status.SystemUnit.State.NumberOfActiveCalls.get();
  const background = await xapi.Status.Cameras.Background.get();
  // console.log(present, incall, background);
  if (present && incall && background.Mode === 'Image' && background.Image === spot) {
    askTurnOffNotice();
  }
  else {
    xapi.Command.UserInterface.Message.Prompt.Clear();
  }
}

function removeNotice() {
  xapi.Command.Cameras.Background.Set({ Mode: DefaultInCallMode });
  xapi.Command.UserInterface.Extensions.Widget.SetValue({ WidgetId: 'berightback_img', Value: 'none' });
  alert('Notice removed. Enjoy your call.');
}

function init() {
  xapi.Config.RoomAnalytics.PeopleCountOutOfCall.set('On');
  xapi.Status.RoomAnalytics.Engagement.CloseProximity.on(proximityChanged);
  xapi.Event.UserInterface.Message.Prompt.Response.on(e => {
    if (e.FeedbackId === 'berightback_disable' && e.OptionId == 1) {
      removeNotice()
    }
  })

  xapi.Event.UserInterface.Extensions.Widget.Action.on(e => {
    if (e.WidgetId.startsWith('berightback_img') && e.Type === 'released') {
      const img = urls[e.Value];
      if(e.Value === 'none') {
        removeNotice();
      }
      else if (img) {
        setVirtualBg(img, spot);
      }
      else {
        console.log('unknown mode', e.Value);
      }
    }
  });
}

init();

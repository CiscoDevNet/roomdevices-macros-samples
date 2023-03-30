import xapi from 'xapi';
import Hue from './hue-lib';

const hue = new Hue();

const presenceLamp = 6; // hue id for lamp to indicate people presence

const images = {
  User1: {
    id: 'fireplace',
    url: 'https://images.unsplash.com/photo-1586997641337-63f21b02591e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80',
    color: { hue: 8371, sat: 254 },
  },
  User2: {
    id: 'ocean',
    url: 'https://images.unsplash.com/photo-1468581264429-2548ef9eb732?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2670&q=80',
    color: { hue: 43530, sat: 226 },
  },
  User3: {
    id: 'jungle',
    url: 'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2670&q=80',
    color: { hue:29251, sat: 207},
  },
};

function changeBg(id) {
  xapi.Command.Cameras.Background.Set({ Image: id, Mode: 'Image' });
  const color = images[id].color;
  hue.setLightState(presenceLamp, color);
}

async function downloadImages() {
  for (const id in images) {
    const { url } = images[id];
    xapi.Command.UserInterface.Message.Alert.Display({ Text: 'Downloading virtual bg: ' + id});
    await xapi.Command.Cameras.Background.Fetch({
      Url: url, Image: id,
    });
  }
  xapi.Command.UserInterface.Message.Alert.Display({ Text: 'Image download complete', Duration: 3 });
}

async function deleteImages() {
  for (const id in images) {
    await xapi.Command.Cameras.Background.Delete({ Image: id });
  }
  xapi.Command.UserInterface.Message.Alert.Display({ Text: 'Virtual images deleted', Duration: 3 });
}

async function init() {
  await hue.loadConfig();
  xapi.Event.UserInterface.Extensions.Widget.Action.on(e => {
    if (e.WidgetId === 'virtual-background' && e.Type === 'released') {
      changeBg(e.Value);
    }
    else if (e.WidgetId === 'virtual-background-download' && e.Type === 'clicked') {
      downloadImages();
    }
    else if (e.WidgetId === 'virtual-background-delete' && e.Type === 'clicked') {
      deleteImages();
    }

  });
  const light = (await hue.getLightState())[presenceLamp].state;
  console.log({ hue: light.hue, sat: light.sat });
}

init();

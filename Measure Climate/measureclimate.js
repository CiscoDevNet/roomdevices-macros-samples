import xapi from 'xapi';
import storage from './storage-csv';

// how often to sample data
const SampleMinutes = 10;
const MaxSamples = 1000;
let currentData = [];

function getTime() {
  // '2022-01-05 14:39:10.819+01:00',
  const date = new Date().toString();
  // TODO does this work for other national date settings?
  return date.split('.').shift();
}

async function measure() {
  const temp = Number(await xapi.Status.RoomAnalytics.AmbientTemperature.get());
  const humidity = Number(await xapi.Status.RoomAnalytics.RelativeHumidity.get());
  const sample = [getTime(), temp, humidity];
  currentData.push(sample);
  currentData = currentData.slice(-MaxSamples);
  await storage.save(currentData.slice(currentData));
}

async function showPlot() {
  const labels = currentData.map(i => i[0]);
  const temp = currentData.map(i => i[1]);
  const humidity = currentData.map(i => i[2]);

  const params = {
    type:'bar',
    data: {
      labels,
      datasets: [{ label: 'Temperature', data: temp }, { label: 'Humidiy', data: humidity }],
    }
  };
  const Url = 'https://quickchart.io/chart?c=' + JSON.stringify(params);
  // console.log(Url);
  xapi.Command.UserInterface.WebView.Display({ Url, Title: "Temperature" });
}

function onPanelClicked(e) {
  if (e.PanelId === 'climate') {
    showPlot();
  }
}

async function init() {
  currentData = (await storage.load()) || [];
  measure();
  setInterval(measure, SampleMinutes * 60 * 1000);
  xapi.Event.UserInterface.Extensions.Panel.Clicked.on(onPanelClicked);
}

init();

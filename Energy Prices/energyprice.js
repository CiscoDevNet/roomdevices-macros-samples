/**
 * Fetch the hourly Norwegian energy price, dispaly it in corner on home screen
 *
 * Available zones: https://norgesenergi.no/hjelp/strompriser/historiske-strompriser/
 * NO1: South/East Norway
 * NO2: South
 * NO3: Central
 * NO4: North
 * NO5: West
 */

import xapi from 'xapi';

// how often to fetch data
const updateMinutes = 10;
const zone = 'NO1';
const tax = 1.25;
const hasPlotPanel = true;

async function fetchPrice(zone, date) {
  // https://norway-power.ffail.win/?zone=NO1&date=2021-12-20
  const Url = `https://norway-power.ffail.win/?zone=${zone}&date=${date}`;

  try {
    const res = await xapi.Command.HttpClient.Get({ Url });
    return JSON.parse(res.Body);
  }
  catch(e) {
    console.error('Not able to fetch energy prize on ' + Url);
  }
  return false;
}

function addTax(value) {
  return value * tax;
}

async function showPlot() {
  const today = new Date().toString().split(' ').shift();
  const prizes = await fetchPrice(zone, today);
  const labels = Object.keys(prizes).map((i, n) => n); // todo fetch time from string
  const values = Object.values(prizes).map(i => Number(addTax(i.NOK_per_kWh).toFixed(2)));

  const params = {
    type:'bar',
    data: {
      labels,
      datasets: [{ label: 'Price (NOK / kWh) vs hour', data: values }]
    }
  };
  const Url = 'https://quickchart.io/chart?c=' + JSON.stringify(params);
  // console.log(Url);
  // xapi.Command.UserInterface.WebView.Display({ Url, Title: "Today's energy prizes (incl tax)", Mode: 'Modal' });
  xapi.Command.UserInterface.WebView.Display({ Url, Title: "Today's energy prizes (incl tax)" });
}

async function fetchCurrent() {
  const today = new Date().toString().split(' ').shift();
  const prices = await fetchPrice(zone, today);
  const pad = n => n < 10 ? '0' + n : n;
  const hour = pad(new Date().getHours());
  const now = `${today}T${hour}:00:00+01:00`;
  const item = prices[now];
  const currentPrice = item && addTax(item.NOK_per_kWh);

  let symbol = '';
  const next = `${today}T${Number(hour) + 1}:00:00+01:00`;
  const nextPrice = prices[next] && addTax(prices[next].NOK_per_kWh);
  if (currentPrice && nextPrice) {
    const diff = nextPrice - currentPrice;
    symbol = diff > 0 ? '↗️' : '↘️';
  }
  const msg = currentPrice ? `${currentPrice.toFixed(2)} NOK / kWh ${symbol}` : '?';
  xapi.Config.UserInterface.CustomMessage.set('⚡️ ' + msg);
}

function init() {
  xapi.Event.UserInterface.Extensions.Panel.Clicked.on(e => {
    if (e.PanelId === 'energy-prices') {
      showPlot();
    }
  });
  xapi.Config.HttpClient.Mode.set('On');

  fetchCurrent();
  setInterval(fetchCurrent, 1000 * 60 * updateMinutes);
  if (!hasPlotPanel) {
    xapi.Command.UserInterface.Extensions.Panel.Remove(
      { PanelId: 'energy-prices' });
  }
}

init();

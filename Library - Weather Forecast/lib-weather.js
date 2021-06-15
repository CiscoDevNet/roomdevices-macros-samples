import xapi from 'xapi';

// eg lat=59.9114, long=10.7579 (Oslo)
export function getForecast(lat, long) {
  const nLat = Number(lat);
  const nLong = Number(long);
  if (isNaN(nLat) || isNaN(nLong)) {
    throw new Error('Need to specify lat and long');
  }
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${nLat}&lon=${nLong}`;
  console.log('fetching', url);

  return xapi.Command.HttpClient.Get({  Url: url })
    .then(r => JSON.parse(r.Body))
    .then(res => res.properties.timeseries)
}

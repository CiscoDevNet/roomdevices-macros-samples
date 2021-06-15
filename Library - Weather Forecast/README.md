# Library - Weather forecast

Fetch global weather forecasts from the free, open Norwegian weather service at met.no No token needed.

This is a macro library, so you can use it from your own extensions.

Example usage:

```
import xapi from 'xapi';
import { getForecast } from './lib-weather';

const config = {
  lat: "59.9114",
  long: "10.7579",
  name: "Oslo",
};

function showForecast(forecast) {
  // console.log('show', forecast);
  const temp = forecast[0].data.instant.details.air_temperature;
  const text = `Temperature: ${temp}° C`;
  xapi.Command.UserInterface.Message.Alert.Display({ Text: text, Duration: 5 });
}

getForecast(config.lat, config.long)
  .then(showForecast)
  .catch(e => console.warn('Not able to fetch weather', e));
```

## Requirements

* [xConfig HttpClient Mode](https://roomos.cisco.com/xapi/Configuration.HttpClient.Mode/) must be `On`.
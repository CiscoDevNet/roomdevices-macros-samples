### Third-party occupancy sensor support

Third-party occupancy sensor support lets a macro, local integration, or external service contribute room-in-use state to RoomAnalytics.

The integration sends occupancy input with [xCommand RoomAnalytics RoomInUse Set](https://roomos.cisco.com/xapi/Command.RoomAnalytics.RoomInUse.Set/). RoomOS combines that input with native room-in-use signals such as calls, local activity, and people presence. [xStatus RoomAnalytics RoomInUse](https://roomos.cisco.com/xapi/Status.RoomAnalytics.RoomInUse/) remains the final effective room-in-use state.

A reference sample is planned for `roomos-samples/third-party-occupancy-sensor`, but that repository update is not published yet.

### Command

```text
xCommand RoomAnalytics RoomInUse Set
```

| Parameter | Required | Description |
| --- | --- | --- |
| `State` | Yes | `InUse` or `NotInUse`. Sets the occupancy contribution from the external source. |
| `Duration` | No | `1..3600` seconds, default `300`. Defines how long `InUse` remains active unless refreshed or cleared. |
| `ID` | No | String, `1..100` characters. A stable unique identifier for the external source, for example a sensor MAC address or an integration-defined ID. |

### Behavior

- Third-party occupancy input is additive to native RoomOS room-in-use detection.
- If `ID` is provided, RoomOS tracks the input as an identified occupancy sensor.
- If `ID` is omitted, the command works as anonymous or manual occupancy input and does not create an `OccupancySensor[n]` status entry.
- Re-sending `InUse` for the same identified sensor refreshes only that sensor's timeout.
- Sending `NotInUse` clears that source immediately.
- RoomOS supports up to `16` identified third-party occupancy sources at a time.

### Status

Use these statuses to monitor the effective room-in-use state and identified third-party sources:

| Status | Description |
| --- | --- |
| [xStatus RoomAnalytics RoomInUse](https://roomos.cisco.com/xapi/Status.RoomAnalytics.RoomInUse/) | Reports the final effective room-in-use state after combining native RoomOS logic with any active third-party occupancy input. |
| [xStatus RoomAnalytics OccupancySensor[n] ID](https://roomos.cisco.com/xapi/Status.RoomAnalytics.OccupancySensor[n].ID/) | Reports the identifier of a tracked external occupancy source. |
| [xStatus RoomAnalytics OccupancySensor[n] RoomInUse](https://roomos.cisco.com/xapi/Status.RoomAnalytics.OccupancySensor[n].RoomInUse/) | Reports whether that identified source is currently contributing `InUse`. |

### Examples

Set a third-party sensor to `InUse` for five minutes:

```text
xCommand RoomAnalytics RoomInUse Set ID: door-sensor-1 State: InUse Duration: 300
```

Clear the same sensor:

```text
xCommand RoomAnalytics RoomInUse Set ID: door-sensor-1 State: NotInUse
```

Set anonymous room-in-use input for one minute:

```text
xCommand RoomAnalytics RoomInUse Set State: InUse Duration: 60
```

If a duration is used, the integration should refresh `InUse` before the duration expires when the room is still occupied.

### Integration pattern

A typical integration follows this flow:

1. A third-party sensor detects occupancy.
2. A macro or external integration receives the sensor event.
3. The integration sends `xCommand RoomAnalytics RoomInUse Set`.
4. RoomOS updates `RoomAnalytics RoomInUse`.
5. The integration refreshes or clears the source as sensor input changes.

RoomOS does not discover or configure third-party occupancy sensors directly. The macro, controller, or external service is responsible for reading the sensor and translating the sensor state into xAPI commands.

### What's not included

- Native discovery, pairing, or vendor-specific setup for third-party occupancy sensors.
- Prebuilt integrations for specific third-party sensor vendors.
- Third-party environmental sensor integration.
- People count, temperature, humidity, or air quality data from third-party occupancy input.

### Related room environmental xAPIs

RoomOS can also expose room-level environmental values from Cisco Room Navigators configured as inside-room or outside-room panels:

- [xStatus RoomAnalytics InsideRoom AmbientTemperature](https://roomos.cisco.com/xapi/Status.RoomAnalytics.InsideRoom.AmbientTemperature/)
- [xStatus RoomAnalytics InsideRoom RelativeHumidity](https://roomos.cisco.com/xapi/Status.RoomAnalytics.InsideRoom.RelativeHumidity/)
- [xStatus RoomAnalytics InsideRoom AirQualityIndex](https://roomos.cisco.com/xapi/Status.RoomAnalytics.InsideRoom.AirQualityIndex/)
- [xStatus RoomAnalytics OutsideRoom AmbientTemperature](https://roomos.cisco.com/xapi/Status.RoomAnalytics.OutsideRoom.AmbientTemperature/)
- [xStatus RoomAnalytics OutsideRoom RelativeHumidity](https://roomos.cisco.com/xapi/Status.RoomAnalytics.OutsideRoom.RelativeHumidity/)
- [xStatus RoomAnalytics OutsideRoom AirQualityIndex](https://roomos.cisco.com/xapi/Status.RoomAnalytics.OutsideRoom.AirQualityIndex/)

These environmental statuses use Cisco Room Navigator sensor readings. They do not ingest environmental data from third-party sensors.
# Remote Monitoring Alert

![osdUI](osdUI.png)

*contributed by [Fred Nielsen](https://github.com/fredless) @ [ePlus Technology](https://www.eplus.com)*

Provides on-screen alerts to OSD and Touch display when remote monitoring via the admin UI is taking place.  Script refires alert whenever a `VideoSnapshotTaken` event is seen, and when continuous refresh is toggled in the UI this event refires periodically.  Duration may need to be adjusted based on codec model and desired behavior.

Not extensively tested across a broad selection of code or systems, further contributions and issues welcome.

![touchUI](touchUI.png)
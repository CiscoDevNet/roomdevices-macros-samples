import xapi from 'xapi';

xapi.Status.Audio.Volume.on(v => xapi.Config.Audio.DefaultVolume.set(parseInt(v)));

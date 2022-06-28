/**
 * This macro makes your video mute stay in sync with your audio mute,
 * ie if you mute/unmute your audio, it will also mute/unmute your video.
 * So basically one physical button to completely mute/unmute yourself.
 *
 * Note: manually muting/unmuting video will not affect audio mute.
 *
 * @author Cyprien Simons <cysimons@cisco.com>
 **/

import xapi from 'xapi';

xapi.Event.Audio.MicrophonesMuteStatus.on((value) => {
  if (value.Mute === 'On') {
    xapi.Command.Video.Input.MainVideo.Mute();
  } else {
    xapi.Command.Video.Input.MainVideo.Unmute();
  }
});

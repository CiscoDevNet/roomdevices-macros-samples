import xapi from 'xapi';

// variable that can be changed from settings ui on roomos.cisco.com
const NumberToBlock = 'macro.polo@cisco.com';

const denyList = [
  NumberToBlock,

  // add more numbers like this if you need to:
  // 'thedude@cisco.com',
];

xapi.Status.Call.on(e => {
  if (!e || !e.RemoteNumber) return;

  const reject = denyList.some(number => number.toLowerCase().includes(e.RemoteNumber.toLowerCase()));
  const outgoing = e.Direction === 'Outgoing';
  if (outgoing && reject) {
    xapi.Command.UserInterface.Message.Alert.Display({
      Text: 'The number you called was not allowed by a user script on the device',
      Duration: 10,
    });
    xapi.Command.Call.Disconnect();
  }
});

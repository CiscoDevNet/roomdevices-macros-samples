import xapi from 'xapi';

const webexMsgUrl = 'https://webexapis.com/v1/messages';

function sendMessage(token, toPersonEmail, roomId, markdown) {
  const headers = [
    'Content-Type: application/json',
    'Authorization: Bearer ' + token,
  ];

  const body = Object.assign({ markdown }, toPersonEmail ? { toPersonEmail } : { roomId });
  return xapi.Command.HttpClient.Post({ Header: headers, Url: webexMsgUrl }, JSON.stringify(body));
}

export default sendMessage;

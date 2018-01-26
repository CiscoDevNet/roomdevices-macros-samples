const xapi = require('xapi');

/*
  Some XAPI commands allow multiple instances of the same attribute. One example is the
  SetMainVideoSource command. The correct JavaScript syntax for sending in multiple equal attributes
  as parameters is to send in an array.
*/

xapi.command("Video Input SetMainVideoSource", {ConnectorId: [1, 2, 3]});

//Wrong (will give you error in editor):
// xapi.command("Video Input SetMainVideoSource", {ConnectorId: 1, ConnectorId: 2, ConnectorId: 3});

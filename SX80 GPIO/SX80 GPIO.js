const xapi = require('xapi');
const NUMBER_TO_DIAL = 'davbruun@cisco.com';

xapi.status.on('GPIO Pin', (state) => {
    console.log('GPIO Pin[' + state.id + '] State went to: ' + state.State);
    if(state.State == 'Low'){
        Promise.all([xapi.status.get('SystemUnit State numberOfInProgressCalls'), xapi.status.get('SystemUnit State NumberOfActiveCalls')]).then(promises => { 
        let [numberOfInProgressCalls, numberOfActiveCalls] = promises;
        if(numberOfInProgressCalls == '0' && numberOfActiveCalls == '0'){
         xapi.command("dial", {number: NUMBER_TO_DIAL});
         xapi.command("UserInterface Message TextLine Display", {Text: 'Call started from Big Red Button on GPIO Pin', Duration: 3});
        }
        else{
         xapi.command("call disconnect");
         xapi.command("UserInterface Message TextLine Display", {Text: 'Call disconnected from Big Red Button on GPIO Pin', Duration: 3});
        }
        });
    }
});



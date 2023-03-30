import xapi from 'xapi';

// Generic Event handler for in-room control extensions

function showInRoomControlEvent(eventtext){
    eventtext = eventtext.replace(/\"/g,"'"); // replace double quotes wiht single quotes for rendering purposes
    console.log(eventtext);
    xapi.command("UserInterface Message TextLine Display", {Text: eventtext, Duration: 3});

}

xapi.event.on('UserInterface Extensions Widget LayoutUpdated', (event) => {
    showInRoomControlEvent('A new version of the in-room control layouts was uploaded to the codec');
});


xapi.event.on('UserInterface Extensions Page Action', (event) => {
    var message = 'In-Room Control Page-event. PageId:"' + event.PageId + '" Event: "' + event.Type +'"';
    // console.log(message);
    showInRoomControlEvent(message);

    // Example of usage:
    if(event.PageId == 'MyPageId'){
        if(event.Type == 'Opened'){
         console.log(`Page ${event.PageId} was opened`);
        }
        else if(event.Type == 'Closed'){
         console.log(`Page ${event.PageId} was closed`);
        }
    }


});



xapi.event.on('UserInterface Extensions Widget Action', (event) => {
    var message = 'In-Room Control Widget-event. WidgetId:"' + event.WidgetId + '" Event: "' + event.Type +'" Value: "' + event.Value +'"';
    // console.log(message);
    showInRoomControlEvent(message);

/*
    // Example of usage:
    if(event.WidgetId == 'myWidgetId'){
        if(event.Type == 'clicked'){
         console.log(`myWidgetId was Clicked`);
         xapi.command("dial", {number: 'somenumber@mydomain.com'});
        }
    }
*/

});
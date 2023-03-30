import xapi from 'xapi';

xapi.event.on('CallDisconnect', (event) => {
    if(event.Duration > 0){
        xapi.command("UserInterface Message Prompt Display", {Title: "How was the meeting experience", Text: 'How would you rate this demo', 'Option.1':'Wow, that was cool!!!', 'Option.2':'It was OK', 'Option.3': 'That was it? You suck!'});
    }
    else{
        xapi.command("UserInterface Message Prompt Display", {Title: "What went wrong?", Text: 'Hm, no call. What happened?', 'Option.1':'I dialled the wrong number!', 'Option.2':"I don't know" , 'Option.3': 'oops, wrong button'});
    }
});




xapi.event.on('UserInterface Message Prompt Response', (event) => {
    var displaytitle = '';
    var displaytext = '';
    switch(event.OptionId){
        case '1':
            displaytitle = ':-)';
            displaytext = 'Thank you, yet another satisfied customer!!!';
            break;
        case '2':
            displaytitle = ':-\\';
            displaytext = 'Ok, will try even harder the next time';
            break;
        case '3':
            displaytitle = ':-(';
            displaytext = 'Oops, sorry I will not disappoint you the next time';
            break;

        default:
            displaytext = 'Hm, that was an unhandled answer';
    }
    xapi.command("UserInterface Message Alert Display", {Title: displaytitle, Text: displaytext, Duration: 8});
});

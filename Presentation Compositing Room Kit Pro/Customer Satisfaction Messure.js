const xapi = require('xapi');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}



xapi.event.on('CallDisconnect', (event) => {
    if(event.Duration > 0){
        xapi.command("UserInterface Message Prompt Display", {Duration: 30,  Title: "How was the meeting experience", Text: 'Please rate this call', FeedbackId: 'callrating', 'Option.1':'A great call!', 'Option.2':'It was OK', 'Option.3': 'It was terrible!'});
    }
});


xapi.event.on('UserInterface Message TextInput Response', (event) => {
    switch(event.FeedbackId){
        case 'feedback_step1':
                sleep(1000).then(() => {
                    xapi.command("UserInterface Message TextInput Display", {
                              Duration: 360
                            , FeedbackId: "feedback_step2"
                            , InputType: "SingleLine"
                            , KeyboardState: "Open"
                            , Placeholder: "Write your contact info here"
                            , SubmitText: "Next"
                            , Text: "Please let us know how we can contact you for a follow up"
                            , Title: "Contact info"
                    });
                });
              break;
        case 'feedback_step2':
            sleep(500).then(() => {
                xapi.command("UserInterface Message Alert Display", {Title: 'Feedback receipt', Text: 'Thank you for you feedback! Have a great day!', Duration: 3});
            });
            break;
    }
});



xapi.event.on('UserInterface Message Prompt Response', (event) => {
    var displaytitle = '';
    var displaytext = '';
    switch(event.FeedbackId){
        case 'callrating':
            switch(event.OptionId){
                case '1':
                    displaytitle = 'Thank you!';
                    displaytext = 'Yet another satisfied customer';
                    xapi.command("UserInterface Message Alert Display", {Title: displaytitle, Text: displaytext, Duration: 8});
                    break;
                case '2':
                    displaytitle = ':-';
                    displaytext = 'We will try even harder the next time';
                    xapi.command("UserInterface Message Alert Display", {Title: displaytitle, Text: displaytext, Duration: 8});
                    break;
                case '3':
                    xapi.command("UserInterface Message TextInput Display", {
                              Duration: 360
                            , FeedbackId: "feedback_step1"
                            , InputType: "SingleLine"
                            , KeyboardState: "Open"
                            , Placeholder: "Write your feedback here"
                            , SubmitText: "Next"
                            , Text: "Please let us know what you were unhappy with. Your feedback is very important to us."
                            , Title: "Let us know what went wrong,"
                    });
                    break;
                default: 
                    displaytext = 'Hm, that was an unhandled answer';
            }
            break;
        case 'nocallrating':
            switch(event.OptionId){
                case '1':
                    displaytitle = ':-)';
                    displaytext = 'Ok, maybe we need to make larger buttons..';
                    break;
                case '2':
                    displaytitle = 'Oops';
                    displaytext = 'Ok, do you want to try to debug?';
                    break;
                case '3':
                    displaytitle = ':-(';
                    displaytext = 'Oops, maybe we need a simpler user interface';
                    break;
                    
                default: 
                    displaytext = 'Hm, that was an unhandled answer';
            }
            xapi.command("UserInterface Message Alert Display", {Title: displaytitle, Text: displaytext, Duration: 5});
            
    }
});


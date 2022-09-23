import xapi from 'xapi';

var option_mapping = {}; // map the option id to the meeting id


function createPanel() {
  const panel = `
  <Extensions>
  <Version>1.9</Version>
  <Panel>
    <Origin>local</Origin>
    <Location>HomeScreen</Location>
    <Icon>Custom</Icon>
    <Color>#000000</Color>
    <Name>Early OBTP</Name>
    <ActivityType>Custom</ActivityType>
    <CustomIcon>
      <Content>iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAYAAAA6/NlyAAAACXBIWXMAACToAAAk6AGCYwUcAAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAAm1JREFUaIHtmrFu01AUhr+LUNsBCQmaDSF4ighBW4ZWDEgINpRXqGDtKzBQYOojwAYSEgPtAmKBSi2PAIi1HdiSCuVnsJ1egp06OY6N7fstvYrtc87nOtcn0oFAIBNJXUmbkpZKyLUU5+rOO9ekIo4V8aiEXI/jXEeWOOeMdVyK/142xiktl1W4drRO+HzWAUkdYAO4Argz4tyUtFVkYWk5ksWEXAJ+AnvOuXzf9Xg3fCFpoPoykPRcKW8PNy4L7AG38t72/5xPwIZzbpB6VNF/NuFA0oqkxXJrnB1Ji5JWJR16HttZJ3d0+hgfSFooud7CkLTgSQ8kLaed1PPuykoFdRaKpDXP52Hyuf9auuqt98srbW589tbXkoUvPNrRMr/kNWLMYeTWusYjCDedINx0TMKSXkkaWhvfKRhKelmZMLDO2b+kisTFOWcm8+dhTu4C9wqIk5ffwFtLAFOhzrl9ataVhU2r6QThphOEm07rhE3vYUmbwP2CasnLG+fczqwXWzukJ8AFY4xp6QKVCW8BD4wxpuW15WJra7mD4W5XQes2rSDcdIJw0wnCTcfaWnaB28WUkpsPzrkvs15s7bTeUc7Iks8R0Jn1YusjvQsMjTGmYQi8twSwtpY9oGeJUTat27SCcNMJwk3HF+4nC9VoGC2LMYeRmy/8w1tXN3VeHDe89fd/jkpa1ukk3qHqP4n3NXbpS0rvBhVNoMqTXq3T461o1nLNk5Wkp/45adO0u0DtRw9jPgJ3/CG1v3Zp51yfaCj8GXBSbm2FcgJsMyYLE+YzFE2grgPXgYtzLa84fgHfiCbij6suJlAFfwCB9XXD3MkQgAAAAABJRU5ErkJggg==</Content>
      <Id>595923c26fcbc9f528bf8fdaeecfc775cd58353ea7a587f0430479c01305b284</Id>
    </CustomIcon>
  </Panel>
</Extensions>`;

  xapi.Command.UserInterface.Extensions.Panel.Save(
        { PanelId: 'early_obtp' },
        panel
      );
} 

createPanel();


/**
 * Create a prompt for the user to select the meeting 
 * they want to jump into early.
 */
function selectBooking() {
  xapi.Command.Bookings.List({Limit:5}).then((output) => {
      var bookings = output;
      var prompt = {
        Title: 'Upcoming Meetings',
        Text: 'What meeting do you want to dial into early?',
        Duration: '20',
        FeedbackId: 'early-obtp'
      };

      if( bookings.Booking == undefined ) {
        xapi.Command.UserInterface.Message.Prompt.Display({
          Title: 'Upcoming Meetings',
          Text: 'No future bookings to dial',
          Duration: '20',
          FeedbackId: 'early-obtp'
        })
      } else {
      // Reset mapping
      option_mapping = {};
      for(var i = 0; i < bookings.Booking.length; i++) {
        var meeting = bookings.Booking[i];
        prompt["Option." + (i+1)] = meeting.Title;
        option_mapping[(i+1)] = meeting.DialInfo.Calls.Call[0].Number;
      }
//      console.log(option_mapping);
      xapi.Command.UserInterface.Message.Prompt.Display(prompt).catch(e => console.error(e));
      }
  });
}

xapi.Event.UserInterface.Message.Prompt.Response.on((event) => {
  if (event.FeedbackId !== 'early-obtp') {
     return;
  }

  // Map option id to meeting Id
  let meeting_id = option_mapping[event.OptionId];
  console.log('Early joining:', meeting_id);

  xapi.Command.Dial({Number: meeting_id}).catch(e => console.error('Failed to Dial...' + JSON.stringify(e)));
});


xapi.Event.UserInterface.Extensions.Panel.Clicked.on((event) => {
  if(event.PanelId !== 'early_obtp'){
    return;   
  }
  
  selectBooking();  
});

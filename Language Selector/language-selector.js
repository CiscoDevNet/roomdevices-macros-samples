const xapi = require('xapi');

function setLanguage(language) {
  xapi.config.set('UserInterface Language', language)
  .catch((error) => { console.error(error); });
}

function onGui(event) {
  if (event.Type !== 'clicked') return;

  let newlanguage = null;

  switch(event.WidgetId) {
    case 'lang_french':
      newlanguage = 'French';
      break;
    case 'lang_german':
      newlanguage = 'German';
      break;
    case 'lang_english':
      newlanguage = 'English';
      break;
    case 'lang_italian':
      newlanguage = 'Italian';
      break;
    default:
      newlanguage = 'English';
  }
  setLanguage(newlanguage);
}

xapi.event.on('UserInterface Extensions Widget Action', onGui);
xapi.status.on('Standby State', state => {
  console.log('going to ', state);
  if (state === 'Standby') setLanguage('English');
});

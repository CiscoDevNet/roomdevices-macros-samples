import xapi from 'xapi';

const LANGUAGE_DEFAULT = 'English';
const LANGUAGE_REVERT_TO_DEFAULT_IN_STANDBY = 1;

function initUILanguage(language) {
  var languageWidgetId = language.toLowerCase();
  console.log('Setting lang id to ' + languageWidgetId);
  xapi.command('UserInterface Extensions Widget SetValue', {'WidgetId': 'lang', 'Value': languageWidgetId}).catch((error) => { console.error(error); }); // This expects an in-room control group-widget named 'lang' and the selected language in the list named lowercase name of language

}

function setLanguage(language) {
  let newlanguage = null;
  console.log('setlang:' + language)
  switch(language) {
      case 'lang_arabic':
      newlanguage = 'Arabic';
      break;
      case 'lang_catalan':
      newlanguage = 'Catalan';
      break;
      case 'lang_chinesesimplified':
      newlanguage = 'ChineseSimplified';
      break;
      case 'lang_czech':
      newlanguage = 'Czech';
      break;
      case 'lang_danish':
      newlanguage = 'Danish';
      break;
      case 'lang_dutch':
      newlanguage = 'Dutch';
      break;
      case 'lang_english':
      newlanguage = 'English';
      break;
      case 'lang_englishuk':
      newlanguage = 'EnglishUK';
      break;
      case 'lang_finnish':
      newlanguage = 'Finnish';
      break;
      case 'lang_french':
      newlanguage = 'French';
      break;
      case 'lang_frenchcanadian':
      newlanguage = 'FrenchCanadian';
      break;
      case 'lang_german':
      newlanguage = 'German';
      break;
      case 'lang_hebrew':
      newlanguage = 'Hebrew';
      break;
      case 'lang_hungarian':
      newlanguage = 'Hungarian';
      break;
      case 'lang_italian':
      newlanguage = 'Italian';
      break;
      case 'lang_japanese':
      newlanguage = 'Japanese';
      break;
      case 'lang_korean':
      newlanguage = 'Korean';
      break;
      case 'lang_norwegian':
      newlanguage = 'Norwegian';
      break;
      case 'lang_polish':
      newlanguage = 'Polish';
      break;
      case 'lang_portuguese':
      newlanguage = 'Portuguese';
      break;
      case 'lang_portuguesebrazilian':
      newlanguage = 'PortugueseBrazilian';
      break;
      case 'lang_russian':
      newlanguage = 'Russian';
      break;
      case 'lang_spanish':
      newlanguage = 'Spanish';
      break;
      case 'lang_spanishlatin':
      newlanguage = 'SpanishLatin';
      break;
      case 'lang_swedish':
      newlanguage = 'Swedish';
      break;
      case 'lang_turkish':
      newlanguage = 'Turkish';
      break;

    default:
      newlanguage = LANGUAGE_DEFAULT;
  }

  xapi.config.set('UserInterface Language', newlanguage).catch((error) => { console.error(error); });
  xapi.command('UserInterface Extensions Panel Close').catch((error) => { console.error(error); }); //This command was added to CE 9.5. This line will fail if running on older firmware

}

function onGui(event) {
  if (event.Type === 'clicked'  && event.WidgetId.startsWith('lang')){
    setLanguage(event.WidgetId.toLowerCase());
  }
  else if (event.Type === 'pressed' && event.WidgetId === 'lang'){
    setLanguage('lang_' + event.Value.toLowerCase());
  }
}

if(LANGUAGE_REVERT_TO_DEFAULT_IN_STANDBY){
    xapi.status.on('Standby State', state => {
      console.log('going to ', state);
      if (state === 'Standby') setLanguage(LANGUAGE_DEFAULT);
    });
}

xapi.event.on('UserInterface Extensions Widget Action', onGui);

xapi.config.on('UserInterface Language', (currentlanguage) => {
  initUILanguage(currentlanguage);
});

xapi.config.get('UserInterface Language').then((currentlanguage) => {
  initUILanguage(currentlanguage);
});

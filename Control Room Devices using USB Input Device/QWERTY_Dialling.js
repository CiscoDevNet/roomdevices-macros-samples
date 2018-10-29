const xapi = require('xapi');

const KEYBOARDLAYOUT = 'English'; // English || Norwegian

const defaultDomain = 'mydomain.com'
var currentNumber = '';
var dialHistory = [];
var dialHistoryPointer = 0;

var KEY_SHIFT_IS_DEPRESSED = 0;

var KEYMAP_NORWEGIAN_SHIFT = {
        'KEY_2':'KEY_AT'
      , 'KEY_SLASH':'KEY_UNDERSCORE'
};
var KEYMAP_NORWEGIAN_NORMAL = {
      'KEY_SLASH': 'KEY_DASH'
    , 'KEY_BACKSPACE': 'KEY_DELETE'
    , 'KEY_MINUS' : 'KEY_PLUS'
};
var KEYMAP_ENGLISH_SHIFT = {
  'KEY_2':'KEY_AT'
};

function getKeymappedCharacter(character){
  if(KEYBOARDLAYOUT === 'Norwegian'){
    if(KEY_SHIFT_IS_DEPRESSED){
      return KEYMAP_NORWEGIAN_SHIFT[character] || character;
    }
    else{
      return KEYMAP_NORWEGIAN_NORMAL[character] || character;
    }
  }
  else{
    if(KEY_SHIFT_IS_DEPRESSED){
      return KEYMAP_ENGLISH_SHIFT[character] || character;
    }
  }
  return character;
}

function clearCurrentNumber(){
        currentNumber = '';
}
function removeLastCharacter(){
        currentNumber = currentNumber.slice(0, -1);
}
function resetHistoryPointer(){
        dialHistoryPointer = 0;
}

function showCurrentNumber(){
        xapi.command('UserInterface Message Alert Display', {'Title': 'Place call', 'Text': currentNumber, 'Duration': 10});
}

function addCharacterToCurrentNumber(character){
  currentNumber = currentNumber + character;
}

function dialCurrentNumber(){
    if(currentNumber.length>0){
      if(!currentNumber.includes('@')){
        currentNumber = currentNumber + '@' + defaultDomain;
      }
      xapi.command('Dial', {'Number': currentNumber});
      dialHistory.push(currentNumber);
      clearCurrentNumber();
      resetHistoryPointer();
    }
}

function showAlertORErrorMessage(message){
     xapi.command('UserInterface Message Alert Display', {'Title': message, 'Text': message, 'Duration': 2});
}

function disconnectCall(){
    xapi.command('Call Disconnect');
    showAlertORErrorMessage('Call Disconnected');
}


function copyHistoryToCurrentNumber(pointer){
  console.log('Pointer: ' + pointer + ' history length: ' + dialHistory.length)
  if(pointer > 0 && pointer <= dialHistory.length){
    currentNumber = dialHistory[pointer-1];
    showCurrentNumber();
  }
  else if(dialHistory.length === 0){
    showAlertORErrorMessage('You have no numbers in call history');
  }
  else{
    currentNumber = '';
    showCurrentNumber();
  }
  
}

xapi.event.on('UserInterface InputDevice Key Action', (event) => {
  if(event.Type == 'Pressed'){
    
    if(event.Key == 'KEY_RIGHTSHIFT' || event.Key == 'KEY_LEFTSHIFT'){
      KEY_SHIFT_IS_DEPRESSED = 1; 
    }    
    else{
      var key = getKeymappedCharacter(event.Key); //This is a bit of a hack as codec currently does not support meta keys. Thus, we need to keep state of metakeys in memory
      // console.log('Translated key: ' + key);
      if(key == 'KEY_BACK' || key == 'KEY_BACKSPACE' || key == 'KEY_DELETE'){
        removeLastCharacter();
        showCurrentNumber();
      }    
      else if(key == 'KEY_UP'){
        dialHistoryPointer++;
        if(dialHistoryPointer >dialHistory.length) dialHistoryPointer = dialHistory.length;
        copyHistoryToCurrentNumber(dialHistoryPointer);
      }    
      else if(key == 'KEY_DOWN'){
        dialHistoryPointer--;
        if(dialHistoryPointer < 0) dialHistoryPointer = 0;
        copyHistoryToCurrentNumber(dialHistoryPointer);
      }    
      else if(key == 'KEY_ENTER'){
        dialCurrentNumber();
      }    
      else if(key == 'KEY_ESC'){
        disconnectCall();
      }    
      else if(key == 'KEY_DOT'){
        addCharacterToCurrentNumber('.');
        showCurrentNumber();
      }    
      else if(key == 'KEY_DASH' || key == 'KEY_MINUS'){
        addCharacterToCurrentNumber('-');
        showCurrentNumber();
      }    
      else if(key == 'KEY_UNDERSCORE'){
        addCharacterToCurrentNumber('_');
        showCurrentNumber();
      }    
      else if(key == 'KEY_PLUS'){
        addCharacterToCurrentNumber('+');
        showCurrentNumber();
      }    
      else if(key == 'KEY_AT'){ //This is a bit of a hack as codec currently does not support variations of keyboard layouts
        addCharacterToCurrentNumber('@');
        showCurrentNumber();
      }    
      else{
  
        let match = /^KEY_(\S){1}$/.exec(event.Key);
        if(match){
            addCharacterToCurrentNumber(match[1]);
            showCurrentNumber();
        }
        else{
//          xapi.command('UserInterface Message Alert Display', {'Title': 'Remote Control Warning', 'Text':'This button is not in use yet. To program it use the "Key: ' + event.Key + ' (or Code: ' + event.Code + ')', 'Duration': 2});
        }  
      }
    }
  }
  else{
    if(event.Key == 'KEY_RIGHTSHIFT' || event.Key == 'KEY_LEFTSHIFT'){
      KEY_SHIFT_IS_DEPRESSED = 0; //This is a bit of a hack as codec currently does not support meta keys. Thus, we need to keep state of metakeys in memory
    }    
  }
});


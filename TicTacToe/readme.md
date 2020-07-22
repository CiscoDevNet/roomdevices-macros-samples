# Tic Tac Toe!

[![PartiallyFilledBoard](https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/blob/master/Games/TicTacToe/images/05_BoardFilling.png)](#)

## Inspiration

Since creating the Dice Roller script, I thought "How could we not only engage users to collaborate, but also engage users to build bonds".

If your team can play together, they can build together.

I also wanted to illustrate how the Cisco Room Series can be adapted in a way to create new experience, solve new and unique tasks, and open up the realm of possibilities available to us through the xApi and the Macro Editor.

## What you'll need

* Cisco Room Device on Software Version ce9.13.X or higher
  * Sx, Dx, MxG2, Room, Desk or board series (excluding Sx10)
* Admin Access to the endpoint
* Some knowledge of the Macro Editor
* A couple of players

## How this Script works

This is a local multiplayer game, there is no single player mode or online option to this version (At least for now :wink:)

When the Macro is loaded in and active, the User Interface for TicTacToe will load in for you on the Touch Device's home screen.

[![HomeScreen](https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/blob/master/Games/TicTacToe/images/01_Home.png)](#)

If you select the Tic Tac Toe button you could be greeted with one of 2 options.

If the game board is empty, you'll go right into a new game

[![NewGame](https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/blob/master/Games/TicTacToe/images/02_NewGame.png)](#)

If the game board has had some play to it already, then you'll be given a choice on whether or not you'd like to continue

[![Continue_or_Restart](https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/blob/master/Games/TicTacToe/images/08_ContinueFromLast.png)](#)

The active turn of either player [X] or player [O] will show on the top most row of the game board.

To make your move, simply select on of the empty squares and it will then update the board and pass turns to the next player.

You'll notice a bit of lag time between each move. At this time, in order to make any visual changes to buttons, a new XML file will need to be loaded into the board. This new UI will be built, based on the current input of the game and be loaded in. 

Once a player has achieve a "3 in a row" sequence, a prompt will display indicating the winner and the game board will be reset.

![X_Won](https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/blob/master/Games/TicTacToe/images/06_XWon.png)

From here, you can wither choose to play again, or end your session.

One last note, for those admins working remote. If you need to settle a dispute of who won, a full log will show on the endpoint's macro console :nerd_face:

```
  10:32:40 TicTacToe2	'Panel Clicked; No active board present; prompting user for new game. Choosing First Player...'
  10:32:41 TicTacToe2	'Random selection made; Team [X] will go first; Opening Board...'
  10:33:11 TicTacToe2	'X placed a piece at board index: 0'
  10:33:11 TicTacToe2	'X~#~#'
  10:33:11 TicTacToe2	'#~#~#'
  10:33:11 TicTacToe2	'#~#~#'
  10:33:12 TicTacToe2	'[O]s turn...'
  10:33:12 TicTacToe2	'O placed a piece at board index: 1'
  10:33:12 TicTacToe2	'X~O~#'
  10:33:12 TicTacToe2	'#~#~#'
  10:33:12 TicTacToe2	'#~#~#'
  10:33:12 TicTacToe2	'[X]s turn...'
  10:33:13 TicTacToe2	'X placed a piece at board index: 3'
  10:33:13 TicTacToe2	'X~O~#'
  10:33:13 TicTacToe2	'X~#~#'
  10:33:13 TicTacToe2	'#~#~#'
  10:33:14 TicTacToe2	'[O]s turn...'
  10:33:14 TicTacToe2	'O placed a piece at board index: 4'
  10:33:14 TicTacToe2	'X~O~#'
  10:33:14 TicTacToe2	'X~O~#'
  10:33:14 TicTacToe2	'#~#~#'
  10:33:15 TicTacToe2	'[X]s turn...'
  10:33:20 TicTacToe2	'X placed a piece at board index: 6'
  10:33:20 TicTacToe2	'X~O~#'
  10:33:20 TicTacToe2	'X~O~#'
  10:33:20 TicTacToe2	'X~#~#'
  10:33:20 TicTacToe2	'Woohoo! Congratulations are in order for team: [X]; New game prompted; awaiting user response..'
```

Have Fun!

## Installing The Script
* Open this script in a new tab [ticTacToe.js](https://github.com/Bobby-McGonigle/Cisco-RoomDevice-Macro-Projects-Examples/blob/master/Games/TicTacToe/ticTacToe.js)
  * Copy the contents into a text editor and save them as ```D&D_DiceRoller.js```
  * Log into your video endpoint as an admin
  * Go to the macro editor
  * Load in this script, save and enable

As mentioned before, the UI will load in for you, the game should be ready to play :smiley:

## How can this script help you?

Though this Tic Tac Toe script is rudementry, it takes control of your UserInterface xml, manipulates it, and rebuilds it using ```xCommand UserInterface Extensions Panel Save```
* Typically, you would use the UI Extenstions editor on the Room Device to create a UI, and you still will, but this command allows us to change elements as conditions change in our script.
  * Allowing us to change the symbols to the buttons as we need too.

* Here is an example of how the base XML looks like for a row with a blank buttton.
```xml
  <Row>
     <Name>row</Name>
        <WidgetId>blank_0</WidgetId>
          <Name/>
          <Type>Button</Type>
          <Options>size=1</Options>
        </Widget>
      </Row>
```

* If we were to make some changes to this, you'll notice we can pass along functions and variables to generate this information as need.

  * Using the same example above, one could reformat the XML
  
  ```xml
    <Row>
        <Name>row</Name>
        ${newRow(0, 2)}
      </Row>
  ```
  
  * Passing along the function newRow helps us place in this new information as we need
  
  ```javascript
    function newRow(start, finish) {
      let order;
      for (let i = start; i <= finish; i++) {
        order = order + `<Widget>
          <WidgetId>${"blank_" + i}</WidgetId>
          <Name/>
          <Type>Button</Type>
          <Options>size=1</Options>
        </Widget>`;
      }
      return order;
    }
  ```
* This is just a small example of what you could do as you deverlop your users experiences.
  * This helped me simplify my Tic Tac Toe UI and this could help simplify your UI as certain key events change in your design.

## Things to Consider

* Though this is a simple game, it makes good use of reformatting the UserInterface. This could serve as an example to make the UI of the Room series more dynamic and adaptive.

* Try to make this a multiplayer game. A good place to start would be exploring BOTs and the HTTPClient xCommands

* Getting people to collaborate can be a challenge at times, so why build some fun into the office

## Author(s)

* **Robert McGonigle Jr**

## Acknowledgments

* Cisco Room Device Team
* Special thanks to ```Robert I``` [StackOverflow](https://stackoverflow.com/questions/45703381/javascript-tic-tac-toe-how-to-loop-through-win-condition). This answer to a users question served as a basis for this scripts win condition
* Antoine Eduoard - *Mentor*
* Dawn Passerini - *Mentor*

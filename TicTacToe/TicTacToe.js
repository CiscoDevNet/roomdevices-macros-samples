const xapi = require('xapi');

var board = ['#', '#', '#', '#', '#', '#', '#', '#', '#'];

var team;

xapi.command('UserInterface Extensions Panel Save', {
    PanelId: 'TicTacToe_Panel'
}, `<Extensions>
  <Version>1.7</Version>
  <Panel>
    <Order>1</Order>
    <Type>Home</Type>
    <Icon>Webex</Icon>
    <Color>#BB3C87</Color>
    <Name>Tic Tac Toe</Name>
    <ActivityType>Custom</ActivityType>
  </Panel>
</Extensions>`);

function printBoard() {
    console.log(board[0] + '~' + board[1] + '~' + board[2]);
    console.log(board[3] + '~' + board[4] + '~' + board[5]);
    console.log(board[6] + '~' + board[7] + '~' + board[8]);
}

function alertWinner(team) {
    let test = checkWin(team);
    if (test === true) {
        board = ['#', '#', '#', '#', '#', '#', '#', '#', '#'];
        xapi.command('Audio Sound Play', {
            Sound: 'Notification'
        });
        xapi.command('UserInterface Extensions Panel Close');
        xapi.command('Userinterface Message Prompt Display', {
            Title: '[' + team + '] has Won!',
            Text: 'Congratulations!<p>The board has reset. Want to play again?',
            feedbackId: 'prompt3',
            'Option.1': 'Yes Please!',
            'Option.2': 'No Thanks'
        });
        console.log('Woohoo! Congratulations are in order for team: [' + team + ']; New game prompted; awaiting user response..');
    } else if (!board.includes('#')) {
        board = ['#', '#', '#', '#', '#', '#', '#', '#', '#'];
        xapi.command('Audio Sound Play', {
            Sound: 'Notification'
        });
        xapi.command('UserInterface Extensions Panel Close')
        xapi.command('Userinterface Message Prompt Display', {
            Title: 'Tie Game!',
            Text: 'No one was bested this time, Good Job!<p>The board has reset. Want to play again?',
            feedbackId: 'prompt3',
            'Option.1': 'Yes Please!',
            'Option.2': 'No Thanks'
        });
        console.log('Tie game, some smart folks are holed up in in this space; New game prompted; awaiting user response...')
    }
}

function checkWin(player) {
    //Credit for this function goes to this site {https://stackoverflow.com/questions/45703381/javascript-tic-tac-toe-how-to-loop-through-win-condition}
    // player = 'X' or 'O'
    const horizontal = [0, 3, 6].map(i => {
        return [i, i + 1, i + 2]
    });
    const vertical = [0, 1, 2].map(i => {
        return [i, i + 3, i + 6]
    });
    const diagonal = [[0, 4, 8], [2, 4, 6]];

    var allwins = [].concat(horizontal).concat(vertical).concat(diagonal);

    let res = allwins.some(indices => {
        return board[indices[0]] == player && board[indices[1]] == player && board[indices[2]] == player
    })
    return res;
}

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

function insertRow(start, finish) {
    let order;
    for (let i = start; i <= finish; i++) {
        if (board[i] === 'X') {
            order = order + `<Widget>
          <WidgetId>widget_34</WidgetId>
          <Type>Button</Type>
          <Options>size=1;icon=end</Options>
        </Widget>`;
        } else if (board[i] === 'O') {
            order = order + `<Widget>
          <WidgetId>widget_34</WidgetId>
          <Type>Button</Type>
          <Options>size=1;icon=webex_meetings</Options>
        </Widget>`
        } else {
            order = order + `<Widget>
          <WidgetId>${"blank_" + i}</WidgetId>
          <Name/>
          <Type>Button</Type>
          <Options>size=1</Options>
        </Widget>`;
        }
    }
    return order;
}

function constructNewBoardUI(firstPlayer) {
    team = firstPlayer;
    let turn;
    if (firstPlayer === 'X') {
        turn = `<Widget>
          <WidgetId>widget_46</WidgetId>
          <Type>Button</Type>
          <Options>size=1;icon=end</Options>
        </Widget>`
    } else {
        turn = `<Widget>
          <WidgetId>widget_46</WidgetId>
          <Type>Button</Type>
          <Options>size=1;icon=webex_meetings</Options>
        </Widget>`
    }
    board = ['#', '#', '#', '#', '#', '#', '#', '#', '#'];
    xapi.command('UserInterface Extensions Panel Save', {
        PanelId: 'TicTacToe_Board'
    }, `<Extensions>
  <Version>1.7</Version>
  <Panel>
    <Order>9</Order>
    <Origin>local</Origin>
    <Type>Never</Type>
    <Icon>Webex</Icon>
    <Color>#A8660</Color>
    <Name>Tic Tac Toe</Name>
    <ActivityType>Custom</ActivityType>
    <Page>
      <Name>TIC TAC TOE</Name>
      <Row>
        <Widget>
          <WidgetId>widget_45</WidgetId>
          <Name>Team</Name>
          <Type>Text</Type>
          <Options>size=1;fontSize=normal;align=right</Options>
        </Widget>
        ${turn}
        <Widget>
          <WidgetId>widget_47</WidgetId>
          <Name>Your Move</Name>
          <Type>Text</Type>
          <Options>size=2;fontSize=normal;align=left</Options>
        </Widget>
      </Row>
      <Row>
        <Name>row</Name>
        ${newRow(0, 2)}
      </Row>
      <Row>
        <Name>row</Name>
        ${newRow(3, 5)}
      </Row>
      <Row>
        <Name>row</Name>
        ${newRow(6, 8)}
      </Row>
      <Row>
        <Name>restart</Name>
        <Widget>
          <WidgetId>ticTac_restart</WidgetId>
          <Name>Restart Game</Name>
          <Type>Button</Type>
          <Options>size=2</Options>
        </Widget>
      </Row>
      <PageId>ticTac~Toe</PageId>
      <Options>hideRowNames=1</Options>
    </Page>
  </Panel>
</Extensions>
`).then((event) => {
        xapi.command('UserInterface Extensions Panel Open', {
            PanelId: 'TicTacToe_Board'
        })
    });
}

function updateBoardUI() {
    let turn;
    if (team === "X") {
        turn = `<Widget>
          <WidgetId>widget_46</WidgetId>
          <Type>Button</Type>
          <Options>size=1;icon=webex_meetings</Options>
        </Widget>`;
    } else {
        turn = `<Widget>
          <WidgetId>widget_46</WidgetId>
          <Type>Button</Type>
          <Options>size=1;icon=end</Options>
        </Widget>`;
    };
    xapi.command('UserInterface Extensions Panel Save', {
        PanelId: 'TicTacToe_Board'
    }, `<Extensions>
  <Version>1.7</Version>
  <Panel>
    <Order>9</Order>
    <Origin>local</Origin>
    <Type>Never</Type>
    <Icon>Webex</Icon>
    <Color>#A866FF</Color>
    <Name>Tic Tac Toe</Name>
    <ActivityType>Custom</ActivityType>
    <Page>
      <Name>TIC TAC TOE</Name>
      <Row>
        <Name>teamSelect</Name>
        <Widget>
          <WidgetId>widget_45</WidgetId>
          <Name>Team</Name>
          <Type>Text</Type>
          <Options>size=1;fontSize=normal;align=right</Options>
        </Widget>
        ${turn}
        <Widget>
          <WidgetId>widget_47</WidgetId>
          <Name>Your Move</Name>
          <Type>Text</Type>
          <Options>size=2;fontSize=normal;align=left</Options>
        </Widget>
      </Row>
      <Row>
        <Name>row</Name>
        ${insertRow(0, 2)}
      </Row>
      <Row>
        <Name>row</Name>
        ${insertRow(3, 5)}
      </Row>
      <Row>
        <Name>row</Name>
        ${insertRow(6, 8)}
      </Row>
      <Row>
        <Name>restart</Name>
        <Widget>
          <WidgetId>ticTac_restart</WidgetId>
          <Name>Restart Game</Name>
          <Type>Button</Type>
          <Options>size=2</Options>
        </Widget>
      </Row>
      <PageId>ticTac~Toe</PageId>
      <Options>hideRowNames=1</Options>
    </Page>
  </Panel>
</Extensions>
`).then((event) => {
        if (team === 'X') {
            team = 'O'
            console.log("[O]s turn...");
        } else if (team === 'O') {
            team = 'X';
            console.log("[X]s turn...");
        }
    });
}

xapi.event.on('UserInterface Extensions Panel Clicked', (event) => {
    switch (event.PanelId) {
        case 'TicTacToe_Panel':
            if (board.includes('X') || board.includes('O')) {
                xapi.command('Userinterface Message Prompt Display', {
                    Title: 'Tic Tac Toe',
                    Text: 'Would you like to start a New Game?<p>Or continue from the previous game?',
                    feedbackId: 'prompt0',
                    'Option.1': 'Start New Game',
                    'Option.2': 'Continue Previous Game'
                });
                console.log('Previous board still active, Prompting to continue or start new game. Current Turn: ' + team)
            } else {
                xapi.command('Userinterface Message Prompt Display', {
                    Title: 'Tic Tac Toe',
                    Text: 'New Game<p>Who will go first?',
                    feedbackId: 'prompt1',
                    'Option.1': '[X] goes first',
                    'Option.2': '[O] goes first',
                    'Option.3': 'Random'
                });
                console.log('Panel Clicked; No active board present; prompting user for new game. Choosing First Player...')
            }
            break;
    }
})

xapi.event.on('UserInterface Message Prompt Response', (event) => {
    switch (event.FeedbackId + event.OptionId) {
        case 'prompt0' + '1':
            board = ['#', '#', '#', '#', '#', '#', '#', '#', '#'];
            xapi.command('Userinterface Message Prompt Display', {
                Title: 'Tic Tac Toe',
                Text: 'New Game<p>Who will go first?',
                feedbackId: 'prompt1',
                'Option.1': '[X] goes first',
                'Option.2': '[O] goes first',
                'Option.3': 'Random'
            });
            console.log('New game selected, board has been cleared. Choosing First Player...')
            break;
        case 'prompt0' + '2':
            xapi.command('UserInterface Extensions Panel Open', {
                PanelId: 'TicTacToe_Board'
            });
            console.log('Game Continued; Opening board; Player [' + team + ']\' turn...');
            break;
        case 'prompt1' + '1':
            constructNewBoardUI('X');
            console.log('Team [X] will go first; Opening Board...');
            break;
        case 'prompt1' + '2':
            constructNewBoardUI('O');
            console.log('Team [O] will go first; Opening Board...');
            break;
        case 'prompt1' + '3':
            let random = Math.floor(Math.random() * 2);
            if (random === 0) {
                constructNewBoardUI('X');
                xapi.command('UserInterface Message Alert Display', {
                    Title: '[X] Goes First',
                    Text: 'Have Fun!',
                    Duration: 5
                });
                console.log('Random selection made; Team [X] will go first; Opening Board...');
            } else {
                constructNewBoardUI('O');
                xapi.command('UserInterface Message Alert Display', {
                    Title: '[O] Goes First',
                    Text: 'Have Fun!',
                    Duration: 5
                });
                console.log('Random selection made; Team [O] will go first; Opening Board...');
            }
            break;
        case 'prompt2' + '2':
            board = ['#', '#', '#', '#', '#', '#', '#', '#', '#'];
            xapi.command('UserInterface Extensions Panel Close');
            xapi.command('Userinterface Message Prompt Display', {
                Title: 'Tic Tac Toe',
                Text: 'New Game<p>Who will go first?',
                feedbackId: 'prompt1',
                'Option.1': '[X] goes first',
                'Option.2': '[O] goes first',
                'Option.3': 'Random'
            });
            console.log('User restarted the game; Choosing First Player...')
            break;
        case 'prompt3' + '1':
            xapi.command('Userinterface Message Prompt Display', {
                Title: 'Tic Tac Toe',
                Text: 'New Game<p>Who will go first?',
                feedbackId: 'prompt1',
                'Option.1': '[X] goes first',
                'Option.2': '[O] goes first',
                'Option.3': 'Random'
            });
            console.log('New game started post-match; Choosing First Player...')
            break;
    }
});

xapi.event.on('Userinterface Extensions Widget Action', (event) => {
    let id = event.WidgetId.split('_');
    if (event.Type === 'released') {
        switch (event.WidgetId) {
            case 'ticTac_restart':
                xapi.command('Audio Sound Play', {
                    Sound: 'Notification'
                });
                xapi.command('Userinterface Message Prompt Display', {
                    Title: 'Restart the game?',
                    Text: 'Are you sure you want to restart?',
                    feedbackId: 'prompt2',
                    'Option.1': 'Continue Game',
                    'Option.2': '!!Restart Game!!'
                });
                console.log('Restart game warning opened; awaiting user response...')
            case 'blank_' + id[1]:
                if (team === 'X' || team === 'O') {
                    let tempTeam = team;
                    console.log(tempTeam + ' placed a piece at board index: ' + id[1]);
                    board[id[1]] = team;
                    printBoard();
                    alertWinner(team);
                    updateBoardUI();
                } else {
                    xapi.command('UserInterface Extensions Panel Close');
                    xapi.command('UserInterface Message Alert Display', {
                        Title: 'Whoops?!?! Something went wrong...',
                        Text: 'Please Try again...',
                        Duration: 5
                    });
                    console.error('Macro environment either crashed or restarted mid game...')
                }
        }
    }
});

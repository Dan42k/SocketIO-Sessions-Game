var express = require("express");

var port = 4700;

var app = express();
app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.locals.pretty = true;
app.engine('jade', require('jade').__express);

app.get("/", function(req, res){
    res.render("index");
});

app.use(express.static(__dirname + '/public'));

var io = require('socket.io').listen(app.listen(port));

//io.set('log level', 1);

var socketMain;

var players = {};



io.sockets.on('connection', function (socket) {
	//hostCreateNewGame(socket);
	socketMain = socket;

    socketMain.emit('connected', { message: "You are connected!" });

    socketMain.on('hostCreateNewGame', hostCreateNewGame);
	socketMain.on('hostRoomFull', hostPrepareGame);
    socketMain.on('playerJoinGame', playerJoinGame);
    socketMain.on('hostCountdownFinished', hostStartGame);
    socketMain.on('playerAnswer', playerAnswer);
    socketMain.on('hostNextRound', hostNextRound);

	socketMain.on('doge', function(data){
        console.log(data);
    });

    socketMain.on('disconnect', function(data){


        console.log('TRUC', data);
        delete players[socketMain.playerName];

        var array = Object.keys(io.sockets.manager.roomClients[socket.id]).map(function(value, index) {
           return [value];
        });

        if(array[1] !== undefined) {
            var chan = String(array[1]).substring(1);
            io.sockets.in(chan).emit('player_disconnected');
        }

    });
});

function hostPrepareGame(gameID) {
    var sock = this;
    var data = {
        mySocketId : sock.id,
        gameID : gameID
    };
    console.log("All Players Present. Preparing game...");
    io.sockets.in(data.gameID).emit('beginNewGame', data);
}


function hostCreateNewGame() {
    // Create a unique Socket.IO Room
    var thisGameID = 42; //( Math.random() * 10000 ) | 0;

    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('newGameCreated', {gameID: thisGameID, mySocketID: this.id});

    // Join the Room and wait for the players
    socketMain.join(thisGameID.toString());
};

//Game is started
function hostStartGame(gameID) {
    sendQuestion(gameID);
};


function sendQuestion(gameID) {
    var data = getQuestionForGame();
    io.sockets.in(data.gameId).emit('newQuestionData', data);
};



function playerJoinGame(data) {
    //console.log('Player ' + data.playerName + 'attempting to join game: ' + data.gameId );

    // A reference to the player's Socket.IO socket object
    var sock = this;

    // Look up the room ID in the Socket.IO manager object.
    var room = socketMain.manager.rooms["/" + data.gameID];
    //console.log(socketMain.manager.rooms);
    // If the room exists.data'DOGE');
    if( room != undefined ){
        // attach the socket id to the data object.
        data.mySocketID = sock.id;

        // Join the room
        sock.join(data.gameID);

        //console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );
        sock.playerName = data.playerName;
        players[sock.playerName] = sock;
        // Emit an event notifying the clients that the player has joined the room.
        io.sockets.in(data.gameID).emit('playerJoinedRoom', data);
    } else {
        // Otherwise, send an error message back to the player.
        this.emit('NotFoundRoom', {message: "This room does not exist."} );
        //console.log("This room does not exist.");
    }
}

function getQuestionForGame() {
    var i = (Math.random() * questions.length) | 0
    console.log(i);
    var question = questions[i].question;
    var goodAnswer = questions[i].answer;
    var answers = questions[i].answers;

    var questionsData = {
        question: question,
        goodAnswer: goodAnswer,
        answers: answers
    };

    return questionsData;
}

function playerAnswer(data) {
    //console.log('Player ID: ' + data.playerId + ' answered a question with: ' + data.answer);

    // The player's answer is attached to the data object.  \
    // Emit an event with the answer so it can be checked by the 'Host'
    //console.log(data);
    io.sockets.in(data.gameID).emit('hostCheckAnswer', data);

    this.emit('errorAnswer', data);
}


// Reload the game
function hostNextRound(data) {
    console.log(data);
    //if(data.round < wordPool.length ){
        // Send a new set of words back to the host and players.
        //sendWord(data.round, data.gameId);
        sendQuestion(data.round, data.gameID);
    //} else {
        // If the current round exceeds the number of words, send the 'gameOver' event.
        //io.sockets.in(data.gameId).emit('gameOver',data);
    //}
}

/**
*
*
*/

var questions =
[
    {
        "question" : "Dans quel type de triangle, la somme des carrés de deux côtés est égal au carré du troisième côté ?",
        "answer" : 2,
        "answers" :  [
            'Isocèle',
            'Équilatéral',
            'Rectangle',
            'Quelconque'
        ]
    },
    {
        "question" : "Complétez ce proverbe : Plaie d'argent n'est pas ",
        "answer" : 2,
        "answers" :  [
            'Éternelle',
            'Factuelle',
            'Mortelle',
            'Contractuelle'
        ]
    },
    {
        "question" : "Quel personnage de la famille Simpson est gaucher ?",
        "answer" : 0,
        "answers" :  [
            'Bart',
            'Homer',
            'Maggie',
            'Lisa'
        ]
    },
    {
        "question" : "Quel épisode d'un jeu a été d'Or et d'Argent ?",
        "answer" : 0,
        "answers" :  [
            'Pokémon',
            'Halo',
            'Call of Duty',
            'Batman'
        ]
    },
    {
        "question" : "Qui est l'intru ?",
        "answer" : 1,
        "answers" :  [
            '7',
            '13',
            '5',
            '23'
        ]
    },
    {
        "question" : "Dans un épisode des Simpsons, Homer porte des lunettes, énonce le théorème de Pythagore, mais se trompe. Pour lui dans quel triangle la somme des carrés de deux côtés est égal au carré du troisième côté ?",
        "answer" : 0,
        "answers" :  [
            'Isocèle',
            'Équilatéral',
            'Rectangle',
            'Quelconque'
        ]
    },
];
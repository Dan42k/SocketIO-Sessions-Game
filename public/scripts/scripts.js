;
jQuery(function($){    
    'use strict';

    var socket = io.connect('http://127.0.0.1:4700');

    var doge = 0;
    var App = {
        gameID: 0,
        myRole: '',
        mySocketID: '',
        currentRound: 0,

        init: function () {
            App.bindEvents();
            App.cacheElements();
        },

        bindEvents: function () {
            // Host
            $('#btnCreateGame').on('click', Host.onCreateClick);
            $('#gameSection').on('click', '#btnStartGame', Host.launchGame);

            // Player
            $('#btnJoinGame').on('click', Player.onJoinClick);
            $('#gameSection').on('click', '#send', Player.onPlayerStartClick);
            $('#gameSection').on('click', '.btnAnswer', Player.onPlayerAnswerClick);
        },

        cacheElements: function () {
            App.$gameSection = $('#gameSection');
        },

        playerJoinedRoom: function (data) {
            //console.log(App[App.myRole], window[App.myRole]);
            console.log(data);
            if (App.myRole === "Host") {
                Host.updateWaitingScreen(data); 
            } else {
                Player.updateWaitingScreen(data);
            }
        },

        beginNewGame: function(data) {
            console.log('ok');
            if (App.myRole === "Host") {
                Host.gameStarted(data); 
            } else {
                Player.gameStarted(data);
            }
        },

         onConnected : function() {
            // Cache a copy of the client's socket.IO session ID on the App
            App.mySocketID = socket.socket.sessionid;
            // console.log(data.message);
        },

        onNewWordData: function (data) {
            App.currentRound = data.round;

            if (App.myRole === "Host") {
                Host.newQuestion(data); 
            } else {
                Player.newQuestion(data);
            }
        },

        hostCheckAnswer : function(data) {
            if(App.myRole === 'Host') {
                Host.checkAnswer(data);
            }
        },
    };

    var Host = {
        players: [],
        numPlayersInRoom: 0,
        currentCorrectAnswer: '',

        onCreateClick: function(){
            socket.emit('hostCreateNewGame');
        },

        displayHostGame: function (data){
            App.gameID = data.gameID;
            App.mySocketID = data.mySocketID;
            App.myRole = 'Host';
            Host.numPlayersInRoom = 0;

            App.$gameSection.html($('#create-game-template').html());

            $('#gameURL').text(window.location.href);
            $('#spanNewGameCode').text(App.gameID);

            console.log(App.gameID);
        },

        updateWaitingScreen: function(data) {

            $('#playersWaiting').append('<li class="list-group-item">' + 'Player ' + data.name + ' joined the game.' + '</li>');

            Host.players.push(data);
            console.log(Host.players);
            Host.numPlayersInRoom += 1;

            if(Host.numPlayersInRoom >= 2) {
                console.log('too many');
                $('#btnStartGame').show();
            }
        },

        launchGame: function (data) {
            if (Host.numPlayersInRoom >= 2) {
                socket.emit('hostRoomFull', App.gameID);
            }
        },

        gameStarted: function(hostData) {
            App.$gameSection.html($('#host-game-template').html());

            socket.emit('hostCountdownFinished', App.gameId);

            for (var i = 0; i < Host.numPlayersInRoom; i++) {
                $('#playerScores').append('<li id="player' + i + 'Score" class="playerScore list-group-item"><span class="score badge">0</span><span class="playerName"> John Doe </li>');
            };

            for (var i = 0; i < Host.numPlayersInRoom; i++) {
                $('#player' + i + 'Score').find('.playerName').html(Host.players[i].name);
                $('#player' + i + 'Score').find('.score').attr('id', Host.players[i].mySocketID);
                console.log(i);
            };

           /* $('#player1Score')
                    .find('.playerName')
                    .html(Host.players[0].name);*/

            console.log(Host.players[0]);

               /* $('#player2Score')
                    .find('.playerName')
                    .html(Host.players[1].name);*/

                // Set the Score section on screen to 0 for each player.
                //$('#player1Score').find('.score').attr('id', Host.players[0].mySocketID);
                //$('#player2Score').find('.score').attr('id', Host.players[1].mySocketId);
        },

        newQuestion: function (data) {
            $('#hostWord').text(data.question);
            Host.currentCorrectAnswer = data.goodAnswer;
            Host.currentRound = data.round;
        },

        checkAnswer: function (data) {
            console.log(data);
            var $pScore = $('#' + data.playerID);
            var $playerName = $pScore.next('span').text();

            if (data.round === App.currentRound){
                

                //console.log(Host.currentCorrectAnswer, data.answer);
                console.log($pScore);
                if(Host.currentCorrectAnswer === data.answer ) {
                    // Add 5 to the player's score
                    console.log($pScore);
                    $pScore.text( +$pScore.text() + 5 );

                    // Advance the round
                    App.currentRound += 1;

                    // Prepare data to send to the server
                    var data = {
                        gameID : App.gameID,
                        round : App.currentRound
                    }

                    $('.alert').remove();

                    // Notify the server to start the next round.
                    socket.emit('hostNextRound', data);
                } else {
                     $('#gameSection:not(:has(".alert"))').prepend('<div class="alert alert-danger">' + $playerName + ' s\'est trompé </div>');
                }
            }
        }
    };

    var Player = {
        hostSocketID: '',
        name: '',

        onJoinClick: function() {
            App.$gameSection.html($('#join-game-template').html());
        },

        onPlayerStartClick: function (){
            var data = {
                gameID : +($('#inputGameID').val()),
                name : $('#inputPlayerName').val()
            };
            socket.emit('playerJoinGame', data);
            console.log(data);
            App.myRole = 'Player';
            Player.myName = data.name;
        },

        updateWaitingScreen: function(data) {
            if(socket.socket.sessionid === data.mySocketID){
                App.myRole = 'Player';
                App.gameId = data.gameId;

                $('#send').hide();
                $('#inputPlayerName').hide();
                $('#inputGameID').hide();

                $('#playerWaitingMessage').append('<p>')
                .text('Joined room : ' + data.gameID + '. Please wait for game to begin.');
            }
        },

        gameStarted: function(hostData) {
            Player.hostSocketId = hostData.mySocketId;
            $('#gameArea').html('<div class="gameOver">Get Ready!</div>');
        },

        newQuestion: function (data) {
            
            var $list = $('<ul>').attr('id','ulAnswers');

                // Insert a list item for each word in the word list
                // received from the server.
                $.each(data.answers, function(){
                    $list                                //  <ul> </ul>
                        .append( $('<li>')              //  <ul> <li> </li> </ul>
                            .append( $('<button/>')      //  <ul> <li> <button> </button> </li> </ul>
                                .addClass('btnAnswer')   //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                .addClass('btn btn-default')         //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                .val(this)               //  <ul> <li> <button class='btnAnswer' value='word'> </button> </li> </ul>
                                .html(this)              //  <ul> <li> <button class='btnAnswer' value='word'>word</button> </li> </ul>
                            )
                        )
                });


            App.$gameSection.html($list);
            App.$gameSection.append( '<p>' + Player.name + '</p>' );
        },

        onPlayerAnswerClick: function() {
            // console.log('Clicked Answer Button');
            var $btn = $(this);      // the tapped button
            var answer = $btn.parent().index(); // The tapped word

            // Send the player info and tapped word to the server so
            // the host can check the answer.
            var data = {
                gameID: App.gameID,
                playerID: App.mySocketID,
                answer: answer,
                round: App.currentRound
            }
            socket.emit('playerAnswer',data);
        },
        errorAnswer: function (data) {
            if(Host.currentCorrectAnswer !== data.answer ) {
                $('#gameSection:not(:has(".alert"))').prepend('<div class="alert alert-danger"> False </div>');
            }
        },
        NotFoundRoom: function (data) {
            $('#gameSection:not(:has(".alert"))').prepend('<div class="alert alert-danger">' + data.message + '</div>');
        }
        
    }

    socket.on('connected', App.onConnected );
    
    socket.on('newGameCreated', Host.displayHostGame);
    socket.on('playerJoinedRoom', App.playerJoinedRoom);
    socket.on('beginNewGame', App.beginNewGame);
    socket.on('newQuestionData', App.onNewWordData);
    socket.on('hostCheckAnswer', App.hostCheckAnswer);
    socket.on('hostCheckAnswer', App.hostCheckAnswer);

    socket.on('errorAnswer', Player.errorAnswer);
    socket.on('NotFoundRoom', Player.NotFoundRoom);

    socket.on('player_disconnected', App.disconnected);

    App.init();
}($));
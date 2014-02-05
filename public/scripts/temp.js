window.onload = function() {
    var socket = io.connect('http://127.0.0.1:4700');

    var field         = document.querySelector(".field");
    var roomID         = document.querySelector(".room");
    
    var App = {
        gameID: 0,
        myRole: '',
        mySocketID: '',
    }

    var Host = {
        players: [],
        numPlayersInRoom: 0
    };

    var Player = {
        hostSocketID: '',
        name: ''
    }

    socket.emit('hostCreateNewGame');

    socket.on('newGameCreated', function(data){
        App.gameID = data.gameID;
        App.mySocketID = data.mySocketID;
        App.myRole = 'Host';
        Host.numPlayersInRoom = 0;

        console.log(Host);
    });

    socket.on('beginNewGame', function(data){

        socket.emit('hostCountdownFinished', App.gameID);
        GameInfo();
        console.log('Today we play with', 
                    Host.players[0].name + ': ' + Host.players[0].mySocketID,
                    'and',
                    Host.players[1].name + ': ' + Host.players[1].mySocketID
                    );
    });

    socket.on('newQuestionData', function(data) {

    });

    socket.on('playerJoinedRoom', function(data) {
        Host.players.push(data);
        Host.numPlayersInRoom += 1;

        if (Host.numPlayersInRoom === 2) {
            console.log('two players inside');
            socket.emit('hostRoomFull', App.gameID);
        } else if(Host.numPlayersInRoom > 2) {
            console.log('too many');
        }
    });

    document.querySelector('form').onsubmit = function (){
        //console.log(roomID.value);
        var data = {
                    gameID : +(roomID.value),
                    name : field.value
                };

        socket.emit('playerJoinGame', data);

        return false;
    }

    function GameInfo () {
        console.log('ok');
        $('#player1Score')
                        .find('.playerName')
                        .html(Host.players[0].name);

                    $('#player2Score')
                        .find('.playerName')
                        .html(Host.players[1].name);
    }
}




var path = require('path');
var express = require('express');
var app = express();
var fs = require('fs');
const { SourceMap } = require('module');
var server = app.listen(80, function () {
    console.log('Listening on http://localhost:80/');
});


var dir = path.join(__dirname, 'public');

console.log(path);

var mime = {
    html: 'text/html',
    txt: 'text/plain',
    css: 'text/css',
    gif: 'image/gif',
    jpg: 'image/jpeg',
    png: 'image/png',
    svg: 'image/svg+xml',
    js: 'application/javascript'
};

app.get('*', function (req, res) {
    var file = path.join(dir, req.path.replace(/\/$/, '/index.html'));
    if (file.indexOf(dir + path.sep) !== 0) {
        return res.status(403).end('Forbidden');
    }
    var type = mime[path.extname(file).slice(1)] || 'text/plain';
	console.log('Serving:  ' + file + ' of type ' + type);
    var s = fs.createReadStream(file);
    s.on('open', function () {
        res.set('Content-Type', type);
        s.pipe(res);
    });
    s.on('error', function () {
        res.set('Content-Type', 'text/plain');
        res.status(404).end('Not found');
    });
});

//********************************socket io stuff
var io = require('socket.io')(server);
io.on("connection", function(socket){
    //someone connected
    console.log("someone connected");

    io.sockets.emit("gameStateUpdate", JSON.stringify(gameState));
    io.sockets.emit("playersUpdate", JSON.stringify(players)); //let new user know who's playing
    io.sockets.emit("boardUpdate", JSON.stringify(board));
    
    console.log("session ID:"+gameState.session);

    socket.on("playerJoin", function(msg, callback){
       
        playerJoin(msg);
		console.log("Player joined:  " + msg);
        
        console.log(players);
    });    
    
    socket.on("resetServer", function(msg, callback){
        playerJoin(msg);
		console.log("Player: " + msg + " reset server");
        
        gameState={
            session:Math.floor(Math.random()*100000)+100000,
            state:"joining",
            whoTurn:0,
            chipCount:0,
            pickFirstPlayer:true,
            scoreValidating:false,
            scoreRequest:0,
            approvers:[]
        }
        players=[];
        board=[];
        setupChips();

        io.sockets.emit("serverResetting","");
        io.sockets.emit("playersUpdate", JSON.stringify(players)); //let new user know who's playing
        io.sockets.emit("gameStateUpdate", JSON.stringify(gameState));
        io.sockets.emit("boardUpdate", JSON.stringify(board));
        console.log("session ID:"+gameState.session);
    });

    socket.on("startGame", function(msg, callback){		
		console.log(msg + " started the game");

        //draw 6 chips for ea player
        for (var i=0;i<players.length;i++){
            drawChips(i);
        }

        gameState.state="playing";

        io.sockets.emit("gameStateUpdate", JSON.stringify(gameState));
        io.sockets.emit("playersUpdate", JSON.stringify(players));
    });

    socket.on("pickFirstPlayer", function(msg, callback){		
		console.log(msg + " is the first player");        

        gameState.whoTurn=parseInt(msg);

        io.sockets.emit("gameStateUpdate", JSON.stringify(gameState));
        io.sockets.emit("playersUpdate", JSON.stringify(players));
    });

    socket.on("startFirstPlayer", function(msg, callback){		
		gameState.pickFirstPlayer=false;

        io.sockets.emit("gameStateUpdate", JSON.stringify(gameState));
        io.sockets.emit("playersUpdate", JSON.stringify(players));
    });

    socket.on("clientBoardUpdate", function(msg, callback){			       

        board=JSON.parse(msg);
        io.sockets.emit("boardUpdate", JSON.stringify(board));
        
    });

    socket.on("clientPlayersUpdate", function(msg, callback){			       

        players=JSON.parse(msg);        
        
    });

    socket.on("clientScoreRequest", function(msg, callback){
        gameState.approvers=[];	
        gameState.scoreValidating=true;
        gameState.scoreRequest=msg;
        io.sockets.emit("gameStateUpdate", JSON.stringify(gameState));
        //io.sockets.emit("serverScoreRequest", msg);
    });

    socket.on("clientApprove", function(msg, callback){
        if (!gameState.approvers.some(e => e==msg)) gameState.approvers.push(msg);
        
        io.sockets.emit("gameStateUpdate", JSON.stringify(gameState));
        //io.sockets.emit("serverScoreRequest", msg);
    });


    socket.on("clientScoreApproved", function(msg, callback){
        players[gameState.whoTurn].score+=gameState.scoreRequest;
        gameState.scoreRequest=0;
        gameState.scoreValidating=false;

        //replenish players chips
        while (players[gameState.whoTurn].chips.length<6 && chips.length>0) {
            players[gameState.whoTurn].chips.push(chips.pop());
        }

        gameState.chipCount=chips.length;
        gameState.approvers=[];
        gameState.whoTurn+=1;
        
        if (gameState.whoTurn>players.length-1) gameState.whoTurn=0;

        //make played blocks fixed
        for (let i=0;i<board.length;i++){
            board[i].state="fixed";
        }

        console.log(board);
        
        io.sockets.emit("gameStateUpdate", JSON.stringify(gameState));
        io.sockets.emit("playersUpdate", JSON.stringify(players));
        io.sockets.emit("forceBoardUpdate", JSON.stringify(board));
    });

    socket.on("reDraw", function(sent_msg, callback){
        players=JSON.parse(sent_msg);

        //send inPlay chips to bag
        for (var i=0;i<board.length;i++){
            if (board[i].state=="inPlay") {                 
                var c={
                    chip:board[i].chip,
                    color:board[i].color
                }
                chips.push(c);
            }              
        }
        
        var temp=board;
        board=[];
        for (var i=0;i<temp.length;i++){
            if (temp[i].state!="inPlay") {
                board.push(temp[i]);
                console.log("keeping: "+ temp[i].state);
            } else {
                console.log("excluding: "+ temp[i].state);
            }
        }
        shuffle(chips);

        //replenish players chips
        while (players[gameState.whoTurn].chips.length<6 && chips.length>0) {
            players[gameState.whoTurn].chips.push(chips.pop());
        }

        //console.log("new chips");
        //console.log(players[gameState.whoTurn].chips);

        //advance turn
        gameState.whoTurn+=1;
        if (gameState.whoTurn>players.length-1) {
            gameState.whoTurn=0;
        }
        
        gameState.chipCount=chips.length;
        io.sockets.emit("gameStateUpdate", JSON.stringify(gameState));
        io.sockets.emit("forceBoardUpdate", JSON.stringify(board));		
        
        io.sockets.emit("playersUpdate", JSON.stringify(players));
    });

    socket.on("clientChat", function(msg, callback){        
        console.log(msg);
        io.sockets.emit("chatCast", msg);
        
    });

});

//***end socket io stuff */

var players=[];
var chips=[];
var board=[];

var gameState={
    session:Math.floor(Math.random()*100000)+100000,
    state:"joining",
    whoTurn:0,
    chipCount:0,
    pickFirstPlayer:true,
    scoreValidating:false,
    scoreRequest:0,
    approvers:[]
}

setupChips();

//***************************************************functions ********************************************************************

function playerJoin(name){
    var p={
        name:name,
        score:0,
        lastScore:0,
        chips:[]  
    }
    players.push(p); 
    
    console.log(players);

    io.sockets.emit("gameStateUpdate", JSON.stringify(gameState));
    io.sockets.emit("playersUpdate", JSON.stringify(players));
}



function setupChips(){
    chips=[];
    for (var k=0;k<3;k++){
        for (var j=0;j<6;j++){
            for (var i=0;i<6;i++){
                var c={
                    chip:i,
                    color:j
                }
                chips.push(c);
            }
        }
    }
    shuffle(chips);
    gameState.chipCount=chips.length;
    console.log("created chip bag with " + chips.length + " chips");
}

function drawChips(pl) {
    for (i=0;i<6;i++){
        var c=chips.pop();
        
        players[pl].chips.push(c);     
    }
    gameState.chipCount=chips.length;
}

function shuffle(array) {
    var currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}




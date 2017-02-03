Games = new Mongo.Collection("games");

/*****************************************
* Client 
*****************************************/
if (Meteor.isServer){
  Meteor.startup(function(){
    if(Meteor.users.find({username: 'computer'}).count === 0){
      Meteor.users.insert({
        username: 'computer'
      });
    }
  });

  Meteor.publish("games", function(){
    return Games.find({currentTurn: this.userId});
  });

  Meteor.publish("users", function(){
    return Meteor.users.find();
  });
}

/*****************************************
* Client 
*****************************************/
if (Meteor.isClient){
  Meteor.subscribe("games");
  Meteor.subscribe("users");
}


Meteor.methods({
  createGame: function(roomCode){
    var game = GameFactory.createGame([Meteor.userId()], "4p2d", roomCode);
    Games.insert(game);
    console.log("Game: " + roomCode + " has been created!");
  },
  takeTurn: function(gameId, id, cards){
    var game = Games.findOne({_id: gameId});
    var hand = game.players[id].hand;

    /* check for errors */ 
    if (game.currentTurn[0] !== id) return; // better error message
    if (!Turns.inHand(hand, card)) return; // what a cheater
    if (!Turns.isValid(game.table, hand, card)) return; // invalid move

    // play cards
    cards.forEach(function(card){
      game.players[id].hand = Turns.removeCard(card, hand);
    });
    game.currentTurn.unshift(game.currentTurn.pop());

    // if all players have played
    // decide winner (gameScoring)
    // allocate points 

    // if last round
    if( allHandsEmpty(game.players)){
        scoreGame(game);
    }

    Games.update(gameId, game);

    // if(!this.isSimulation && game.inProgress && Meteor.users.findOne(game.currentTurn[0]).username === 'computer'){
    //   Meteor.setTimeout(function () {
    //     takeComputerTurn(gameId);
    //   } , 1000);
    // }
  }
});

function allHandsEmpty(players){
  return _.every(players, function(player){
    return player.hand.length === 0;
  });
}
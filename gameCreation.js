GameFactory = {};

var gameProperties = {
"4p2d": {playerCount: 4, deckCount: 2 },
//"4p1d": {playerCount: 4, deckCount: 1 },
}

GameFactory.createGame = function(playersIds, gameType){
  var deck    = createDeck(gameType),
      players = createPlayers(playersIds); 

  GameFactory.dealPlayers(players, deck);
  var table = dealTable();

  return {
    deck : deck,
    players: players,
    table: table,
    currentTurn: playersIds,
    gameType: gameType,
    inProgress: true,     // future 
    started: new Date()   // future
  };
};


GameFactory.dealPlayers = function(players, deck){
  for (var i = 0; i < deck.length; i++){ 
    Object.keys(players).forEach(function(id){
      players[id].hand.push(deck.shift()); // eventually will want to add in some delay logic
    });
  }
}

function dealTable(){
  // return null object
  return null;
}

function createPlayers(ids){
  var o = {};

  ids.forEach(function(id){
    o[id] = {
      hand  : [],
      points: 0;
      //card  : [], // what card are they on, probably game-level
    };
  });

  return o;
}
 
function createDeck(gameType){
  var suits = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
  var trumpSuit = /* Donald */ 'Trump';
  var cards = [];

  // # of decks
  for (var j = 1: j <= gameProperties.gameType.deckCount; j++) { 

    // for each suit in a deck
    suits.forEach(function(suit){
      for (var i=1; i<=13; i++){
        var name = i;
        if (i === 1)  name = 'A';
        if (i === 11) name = 'J';
        if (i === 12) name = 'Q';
        if (i === 13) name = 'K';
        cards.push({
          suit: suit,
          value: i,
          name: name
        });
      }
    });

    // jokers
    cards.push({
      suit: trumpSuit,
      value: 14,
      name: 'SJ'
    });
    cards.push({
      suit: trumpSuit,
      value: 15,
      name: 'BJ'
    });
  }

  return _.shuffle(cards);
}
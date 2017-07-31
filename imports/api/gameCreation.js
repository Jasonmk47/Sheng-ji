GameFactory = {};

var gameProperties = {
"4p2d": {playerCount: 4, deckCount: 2 },
//"4p1d": {playerCount: 4, deckCount: 1 },
}

GameFactory.createGame = function(playerIds, gameType){
  var deck    = createDeck(gameType),
      players = createPlayers(playerIds); 

  GameFactory.dealPlayers(players, deck);

  return {
    //Maybe add a field for unique game id? As of now this is unique because of db id
    deck: deck,   // bottom  
    plays: [],    // To record past plays
    playerIds: playerIds,
    startingPlayer: playerIds[0],
    players: players,
    gameType: gameType,
    trumpNum: 2,
    trumpSuit: "Trump",
    roundNumber: 1,
    currentHand: {
      shownCards: [],   // dict of playerID + cards played
      currentPlayer: playerIds[0],
      pattern: null, 
      suit: null
    },
    previousHands: [],
    // metadata
    inProgress: true,
    started: new Date(),
    finished: -1
  };
};

GameFactory.dealPlayers = function(players, deck){
  for (var i = 0; i < deck.length - 8; i){  //8 for the bottom. Don't increment the for loop
    Object.keys(players).forEach(function(id){
      players[id].hand.push(deck.shift()); // eventually will want to add in some delay logic
    });
  }
}

function createPlayers(ids){
  var o = {};

  ids.forEach(function(id){
    o[id] = {
      hand  : [],
      points: 0,
      overallScore: 2, //On 2s to start
    };
  });

  return o;
}
 
function createDeck(gameType){
  var suits = ['clubs', 'diamonds', 'hearts', 'spades'];
  var trumpSuit = /* Donald */ 'trump';
  var cards = [];

  // # of decks
  let index = 0;

  for (var j = 1; j <= gameProperties[gameType].deckCount; j++) {
    // for each suit in a deck
    // Ace is 14 for value ordering
    suits.forEach(function(suit){
      for (var i=2; i<=14; i++){
        var name = i;
        var isTrump = false;
        if (i === 2) isTrump = true;
        if (i === 14)  name = 'ace';
        if (i === 11) name = 'jack';
        if (i === 12) name = 'queen';
        if (i === 13) name = 'king';
        cards.push({
          id: index++,
          suit: suit,
          value: i,
          name: name,
          isTrump: isTrump
        });
      }
    });

    // jokers
    cards.push({
      id: index++,
      suit: trumpSuit,
      value: 15,
      name: 'SJ',
      isTrump: true
    });
    cards.push({
      id: index++,
      suit: trumpSuit,
      value: 16,
      name: 'BJ',
      isTrump: true
    });
  }

  return _.shuffle(cards);
}
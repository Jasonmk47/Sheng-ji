
GameFactory = {};

var gameProperties = {
"4p2d": {playerCount: 4, deckCount: 2 },
"4p1d": {playerCount: 4, deckCount: 1 }, //Has not been tested
}


GameFactory.createGame = function(playerIds, gameType){
  var deck    = createDeck(gameType),
      players = createPlayers(playerIds); 

  return {
    //Game specific
    playerIds: playerIds,
    players: players,
    gameType: gameType,
    inProgress: true,
    started: new Date(),
    finished: -1,

    //Round specific
    roundNumber: 1,
    trumpNum: 2,
    trumpSuit: "trump",
    startingPlayer: null,

    //Game Info
    deck: deck,   // bottom  
    currentHand: {
      shownCards: [],   // dict of playerID + cards played
      currentPlayer: null,
      pattern: null, 
      suit: null
    },
    //Not certain this is useful
    previousHands: [],

    //Helper information
    dealerIncrement: 0,

    hasCalledSuit: false,
    whoCalled: null, //For reinforcing
    hasDealtCards: false,
    hasBeenFlipped: false, //For flipping hierarchy

    isDealing: false,

    settingBottom: null, //id of player currently setting the bottom
    queueToAskFlip: ['dummy'], //gets filled when bottom is set, dummy so that play isn't availble immediately

  };
};

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
        var name = ''+i;
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
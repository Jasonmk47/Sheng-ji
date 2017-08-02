//Inspired by https://github.com/FalloutX/meteor-card-game/blob/master/games.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

import './gameCreation.js';

export const Games = new Mongo.Collection('games');

// Types of the fields of the objects //
/*
card = {
  id: int,                //Individual id per card
  suit: string,           //suit or Trump
  value: int,
  name: string
};

player = {
  hand: [card],
  points: int,
  overallScore: int,      //On 2s to start
};

game = {
    deck: [card],         // the bottom  
    plays: [],            // records past plays
    playerIds: playerIds, //Array of playerIds
    startingPlayer: string,
    players: {},          //Object with all of the players keyed by id
    gameType: string,   
    trumpNum: int,
    trumpSuit: string,
    hasCalledSuit: bool,
    roundNumber: int,
    currentHand: {
      shownCards: [],     // dict of playerID + cards played
      currentPlayer: string,
      pattern: string, 
      suit: string
    },
    previousHands: [],

    inProgress: bool,
    started: Date,
    finished: int 
  };
*/

Meteor.methods({
  'games.createGame'(player2, player3, player4) {
    check(player2, String);
    check(player3, String);
    check(player4, String);

    var game = GameFactory.createGame([Meteor.userId(), player2, player3, player4], '4p2d');
    Games.insert(game);
    console.log("Game has been created.!");
  },

  'games.delete'(gameId) {
      Games.remove({_id: gameId});
  },

  'games.checkCards'(cards, gameId, userId) {
  
    // Make sure the user is logged in
    if (! Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }

    var game = Games.findOne({_id: gameId});

    if (game == null) {
      throw new Meteor.Error('Game not found');
    }

    var hand = game.players[userId].hand;

    // some cards are submitted
    if (cards.length === 0)
    {
      throw new Meteor.Error('No cards in hand');
    }

    // make sure each card has valid suit and value
    var validCards = cards.every((card) => {
    
      let validSuit = ['clubs', 'diamonds', 'hearts', 'spades', 'trump'].includes(card.suit);
      let validValue = !(card.value < 1 || card.value > 17);

      return validSuit && validValue; 
    });

    if (!validCards) {
      throw new Meteor.Error('Invalid cards');
    }

    // check for shuai 
    // Starting hand must be all the same suit
    if (game.currentHand.shownCards.length === game.playerIds.length || game.currentHand.shownCards.length === 0) {
      console.log("Starting player: special card checks");
      // check to see player leads with cards of all same suit
      if (cards[0].isTrump) {
        if (!cards.every((card) => { return card.isTrump })) {
          throw new Meteor.Error('Cards of different suits 1');
        }
      }
      else {
        if (!cards.every((card) => { return card.suit == cards[0].suit })) {
          throw new Meteor.Error('Cards of different suits 2');
        }
      } 

      return; 
    }

    // check length of submitted cards, and pattern
    if (cards.length !== game.currentHand.shownCards[0].cards.length) {
      throw new Meteor.Error('Does not match starting pattern');
    }

    let myCards = game.players[userId].hand;
    let newCards = myCards.filter((c) => {return !cards.some(function(card){
      return (c.id === card.id)})}); // get hand without played cards

    // Need to play trump if in trump
    if (game.currentHand.suit === game.trumpSuit || game.currentHand.suit === "trump" ){
      if (!cards.every((card) => {return card.isTrump})) {
        if (!newCards.every((c) => {return !c.isTrump})) {
          throw new Meteor.Error('Must play trump you have');
        }
      }
    } 

    // Else need to play in suit
    else if (!cards.every((card) => { return card.suit === game.currentHand.suit && card.value !== game.trumpNum})) {
      console.log(game.currentHand.suit)
      if (!newCards.every((c) => {return c.suit !== game.currentHand.suit || c.value === game.trumpNum})) {   // check to see none of suit left
        throw new Meteor.Error('Does not match starting suit');
      }
    }

    // "single" errors are caught by above tests

    // check for doubles of a given suit in hand

    if (game.currentHand.pattern !== 'single') {

    //So far all usages use the current hand's suit so we could hard code it
    let countDoubles = (cardsToCount, suit) => {
      let seen = []
      let doubles = []

      for (let c of cardsToCount) {  // for each card in hand
        if ((c.suit === suit && c.value !== game.trumpNum) ||
              ((suit === game.trumpSuit || suit === "trump") && c.isTrump)) {
          if (seen.includes(c.value)) {           // if seen before
            doubles.push(c.value);                // add to doubles
          }
          seen.push(c.value);                     // add to seen list
        }
      }
      doubles.sort((a, b) => { return a - b });
      return doubles;
    };

    var doubles = countDoubles(game.players[userId].hand, game.currentHand.suit);

      // check for errors in "double"
      if (game.currentHand.pattern === "double") {
        if (cards[0].value !== cards[1].value) {       // if didn't play double
          if (doubles.length > 0) {                   // make sure no doubles in hand
            throw new Meteor.Error('Must play double in suit');
          }  
        }
      }

      // check for errors in "consecutive_double"
      if (game.currentHand.pattern === "consecutive_double") {
        var lowestCard = cards[0];
        for (var i = 1; i < 4; i++)
          if (lowestCard.id > cards[i].id) lowestCard = cards[i];

          var lowValue = lowestCard.value;
          var higherValue = lowValue + 1;
          
          if (lowValue + 1 === game.trumpNum){
            higherValue++;
          }

        if ((lowValue !== cards[0].value && higherValue !== cards[0].value)  || 
            (lowValue !== cards[1].value && higherValue !== cards[1].value)  || 
            (lowValue !== cards[2].value && higherValue !== cards[2].value)  || 
            (lowValue !== cards[3].value && higherValue !== cards[3].value) ) {
          
          doubles.forEach((v, i) => {      // check for no cons-doubles in suit
            if (i > 0 && (doubles[i-1] + 1 === v)) {
              throw new Meteor.Error('Must play consecutive double in suit');
            }
          });
          
          // Not only can you not have as many doubles, you have to play them as well
          if (doubles.length === 1) {                   // make sure no doubles in hand
            //Have to play as many doubles as possible
            if(countDoubles(cards, game.currentHand.suit).length !== 1) {
              throw new Meteor.Error("Must play all doubles you have");
            }

          }
          if (doubles.length > 1) {                   // make sure no doubles in hand
            //Have to play as many doubles as possible
            if(countDoubles(cards, game.currentHand.suit).length !== 2) {
              throw new Meteor.Error("Must play all doubles");
            }
          }

        }
      }
    }
  },

  'games.submit'(cards, gameId, userId) {

    // Make sure the user is logged in
    if (! Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }

    var game = Games.findOne({_id: gameId});
    var hand = game.players[userId].hand;

    // error checking and all that jazz
    Meteor.call("games.checkCards", cards, gameId, userId);

    if (game.currentHand.shownCards.length === game.playerIds.length) {
      game.currentHand.shownCards = [];
    }

    // if we are the starting player
    if (game.currentHand.shownCards.length == 0) {
      if (cards[0].value === game.trumpNum) {
        game.currentHand.suit = 'trump'; 
      }
      else {
        game.currentHand.suit = cards[0].suit;
      }

      let identifyShuai = (cards) => {
        let chosenSuit = cards[0].suit;
        if (cards.every((card) => card.suit === chosenSuit) || cards.every((card) => {card.isTrump})) {
          game.currentHand.pattern = "shuai"; //We can add on here to specify what type of shuai
        }
        else {
          //Shouldn't get here, check should find the error
          game.currentHand.pattern = "error";
        }
      };

      // figure out pattern (shuai not included for now)
      switch (cards.length) {
        case 1:
          game.currentHand.pattern = 'single';     
          break;
        case 2: 
          if (cards[0].value == cards[1].value) {
            game.currentHand.pattern = "double"; 
          } else {
            identifyShuai(cards);
            // error or shuai
          }
          break;
        case 4:
          var lowestCard = cards[0];
          for (var i = 1; i < 4; i++)
            if (lowestCard.id > cards[i].id) lowestCard = cards[i];

              var lowValue = lowestCard.value;
              var higherValue = lowValue + 1;
              
              if (lowValue + 1 === game.trumpNum){
                higherValue++;
              }

          if ((lowValue === cards[0].value || higherValue === cards[0].value)  && 
              (lowValue === cards[1].value || higherValue === cards[1].value)  && 
              (lowValue === cards[2].value || higherValue === cards[2].value)  && 
              (lowValue === cards[3].value || higherValue === cards[3].value) ) {
            game.currentHand.pattern = "consecutive_double";
          } else {
            identifyShuai(cards);
            // error or shuai
          }
          break;
        default: 
          identifyShuai(cards);
          // error or shuai
          break;
      }
    }
    

    console.log("pattern: " + game.currentHand.pattern);


    cards.sort((a, b) => {
      if (a.isTrump && !b.suit.isTrump) {
        return 1;
      } 

      if (!a.isTrump && b.suit.isTrump) {
        return -1;
      }

      return a.value - b.value; 
    });

    // put cards into currentHand
    game.currentHand.shownCards.push({
      "userId": userId,
      "cards": cards,
    });

    //Remove cards you are finished with
    _.each(cards, function (card) {
      game.players[userId].hand = game.players[userId].hand.map(function (card_i) {
        if (card_i.id !== card.id ) {
          return card_i;
        }
      }).filter(function(card_j) {
        return card_j !== undefined;
      });
    });

    // move onto next player
    const playerIndex = game.playerIds.findIndex((id) => {
        return (userId === id);
    });
    
    game.currentHand.currentPlayer = game.playerIds[(playerIndex + 1) % game.playerIds.length];

    let getPoints = (hands) => { 
      let sum = 0;
      hands.forEach((hand) => {           // for each hand
        hand.cards.forEach((card) => {    // for each card
          if (card.value == 5) {          // check for 5, 10, K
              sum += 5; 
          } else if (card.value == 10 || card.value == 13) {
            sum += 10
          }
        });
      });
      return sum; 
    };

    //TODO: This needs some way to remove all lower importance cards in Shuais
    let getWinner = (hands, valid) => {
      let max = -Infinity,
          winner = null;

      hands.forEach((play) => {               // If this goes in the order of play then this should work by assigning winner to first play     

        if (!valid(play.cards)) {
          return; 
        }

        let value = 0;                        // default value: 0

        if (play.cards[0].suit === "trump" || play.cards[0].value === game.trumpNum)
          value += 100 + play.cards[0].value;
        else if (play.cards[0].suit === game.trumpSuit) //important to be else if so in suit trump number is ok
          value += 50 + play.cards[0].value;                     
        else if (play.cards[0].suit === game.currentHand.suit)
          value += play.cards[0].value;

        if (play.cards[0].value === game.trumpNum && play.cards[0].suit === game.trumpSuit)
          value ++;

        if (max < +value) {                   // check against current max
            max = +value; 
            winner = play.userId; 
        }
      });
      
      return winner; 
    };

    // all players have played
    if (game.currentHand.shownCards.length === game.playerIds.length) {

      let matchPattern = null; 
      switch (game.currentHand.pattern) {
        case 'single':
          matchPattern = (playedCards) => { return true; }
          break;

        case 'double':
          matchPattern = (playedCards) => {
            return (playedCards[0].suit == playedCards[1].suit) &&
                   (playedCards[0].value == playedCards[1].value);
          }
          break;

        case 'consecutive_double': 
          matchPattern = (playedCards) => {
            if (!playedCards.every((card) => { return card.suit === playedCards[0].suit })) {
              return false;
            }
            var lowestCard = playedCards[0];
            for (var i = 1; i < 4; i++)
              if (lowestCard.id > playedCards[i].id) lowestCard = playedCards[i];

              var lowValue = lowestCard.value;
              var higherValue = lowValue + 1;
              
              if (lowValue + 1 === game.trumpNum){
                higherValue++;
              }

            return ((lowValue === playedCards[0].value || higherValue === playedCards[0].value)  && 
                (lowValue === playedCards[1].value || higherValue === playedCards[1].value)  && 
                (lowValue === playedCards[2].value || higherValue === playedCards[2].value)  && 
                (lowValue === playedCards[3].value || higherValue === playedCards[3].value))
          }
          break;
          case 'shuai':
            matchPattern = (playedCards) => {
              //All need to be the same suit
              if (playedCards[0].isTrump) {
                if (!playedCards.every((card) => {return card.isTrump})) {
                  console.log("Not same suit, trump");
                  return false
                };
              }
              else {
                if (!playedCards.every((card) => {return card.suit === playedCards[0].suit})) {
                  console.log("Not same suit, not trump"); 
                  return false
                };
              }

              //TODO: We need some way to check the consecutive pairs and pairs condition is met

              return true;
            }
          break;
      }

      let winner = getWinner(game.currentHand.shownCards, matchPattern);
      let points = getPoints(game.currentHand.shownCards);

      game.players[winner].points += points;

      game.previousHands.push(game.currentHand);

      game.currentHand = {
        shownCards: game.currentHand.shownCards,   
        currentPlayer: winner,
        pattern: null, 
        suit: null
      };
    }

    // check to see end of game
    if( _.every(game.players, (player) => {return player.hand.length === 0})){
      //Restart the game and increment player score
      console.log("game is done")

      //Display the final score
      Object.keys(game.players).forEach(function(id){
        console.log(game.players[id]);
      });

    }

    console.log(game);
    Games.update( gameId, game );
  },
});

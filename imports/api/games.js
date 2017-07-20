//Inspired by https://github.com/FalloutX/meteor-card-game/blob/master/games.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

import './gameCreation.js';

export const Games = new Mongo.Collection('games');

/* TODO: OUTDATED NEEDS UPDATING BASED ON gameCreation.js
game = {
  deck: [], //This will be the bottom cards once dealt out
  playerIds: [],
  players:{
    a:{
      hand :[],
      points: [],
    },
    b:{
      hand :[],
      points: [],
    },
    c:{
      hand :[],
      points: [],
    },
    d:{
      hand :[],
      points: [],
    },
  },
  trumpSuit: String,
  currentTurn: [],
  roundNumber: 1,
  inProgress: true/false,
  started: date,
  finished: date
}
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
    
      let validSuit = ['clubs', 'diamonds', 'hearts', 'spades', 'Trump'].includes(card.suit);
      let validValue = !(card.value < 1 || card.value > 14);

      return validSuit && validValue; 
    });

    if (!validCards) {
      throw new Meteor.Error('Invalid cards');
    }

    // TODO: refactor to use switch-case statements

    if (game.currentHand.shownCards.length == game.playerIds.length || game.currentHand.shownCards.length == 0) {
      console.log("Starting player: special card checks");
      // check to see player leads with cards of all same suit
      if (!cards.every((card) => { return card.suit == cards[0].suit })) {
        throw new Meteor.Error('Cards of different suits');
      }

      // check for shuai 

      return; 
    }

    // check length of submitted cards, and pattern
    if (cards.length != game.currentHand.shownCards[0].cards.length) {

      throw new Meteor.Error('Does not match starting pattern');
    }

    // check suit of each card and if player is out of suit
    if (!cards.every((card) => { return card.suit == game.currentHand.suit })) {
      let myCards = game.players[userId].hand;                          // get current hand

      let tempCards = myCards.filter((c) => {return !cards.some(function(card){
        return (c.id === card.id)
      })}); // get hand without played cards 

      if (!tempCards.every((c) => {return c.suit !== game.currentHand.suit})) {   // check to see none of suit left
        throw new Meteor.Error('Does not match starting suit');
      }
    }

    // "single" errors are caught by above tests

    // check for doubles of a given suit in hand

    if (game.currentHand.pattern != 'single') {
      let seen = []
      let doubles = []

      for (let c of game.players[userId].hand) {  // for each card in hand
        if (c.suit == game.currentHand.suit) {    // filter by suit
          if (seen.includes(c.value)) {           // if seen before
            doubles.push(c.value);                // add to doubles
          }
          seen.push(c.value);                     // add to seen list
        }
      }
      doubles.sort((a, b) => { return a - b });

      // check for errors in "double"
      if (game.currentHand.pattern == "double") {
        if (cards[0].value != cards[1].value) {       // if didn't play double
          if (doubles.length > 0) {                   // make sure no doubles in hand
            throw new Meteor.Error('Must play double in suit');;
          }  
        }
      }

      // check for errors in "consecutive_double"
      if (game.currentHand.pattern == "consecutive_double") {
        if (cards[0].value != cards[1].value || 
            cards[2].value != cards[3].value || 
            cards[2].value != (cards[1].value+1)) {
          
          doubles.forEach((v, i) => {      // check for no cons-doubles in suit
            if (i > 0 && (doubles[i-1] + 1 == v)) {
              throw new Meteor.Error('Must play consecutive double in suit');
            }
          });
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

    /*TODO: Game logic here*/

    // error checking and all that jazz
    Meteor.call("games.checkCards", cards, gameId, userId);

    if (game.currentHand.shownCards.length == game.playerIds.length) {
      game.currentHand.shownCards = [];
    }


    // if we are the starting player
    if (game.currentHand.shownCards.length == 0) {
      game.currentHand.suit = cards[0].suit;

      // figure out pattern (shuai not included for now)
      switch (cards.length) {
        case 1:
          game.currentHand.pattern = 'single';     
          break;
        case 2: 
          if (cards[0].value == cards[1].value) {
            game.currentHand.pattern = "double"; 
          } else {
            // error or shuai
          }
          break;
        case 4: //This assumes that the cards are in order of size
          if (cards[0].value == cards[1].value && 
              cards[2].value == cards[3].value && 
              cards[2].value == (cards[1].value+1)) {
            game.currentHand.pattern = "consecutive_double";
          } else {
            // error or shuai
          }
          break;
        default: 
          // error
          break;
      }
    }
    

    console.log("pattern: " + game.currentHand.pattern);


    cards.sort((a, b) => {
      if (a.suit == "Trump" && b.suit != "Trump") {
        return 1;
      } 

      if (a.suit != "Trump" && b.suit == "Trump") {
        return -1;
      }

      return a.value - b.value; 
    });

    // put cards into currentHand
    game.currentHand.shownCards.push({
      "userId": userId,
      "cards": cards,
    });

    //Throw away cards that are done
    // var myCards = game.players[userId].hand;
    // myCards = myCards.filter( (card) => {
    //   cards.map((pos))
    //   return !cards.includes(card);
    // });
    // game.players[userId].hand = myCards;
    // console.log(myCards);

    _.each(cards, function (card) {
      game.players[userId].hand = game.players[userId].hand.map(function (card_i) {
        if (card_i.value === card.value && card_i.suit === card.suit && card_i.id === card.id ) {
          return;
        }
        else {
          return card_i;
        }
      }).filter(function(card_j) {
        return card_j !== undefined;
      });
    });

    // move onto next player
    const playerIndex = game.playerIds.findIndex((id) => {
        return (userId == id);
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

    let getWinner = (hands, valid) => {
      let max = -Infinity,
          winner = null;


      hands.forEach((play) => {              

        if (!valid(play.cards)) {
          return; 
        }

        let value = 0;                        // default value: 0
        switch (play.cards[0].suit) {
          case "Trump":                       // trump suit: add 100 to value
            value += 100; 
          case game.currentHand.suit:         // starting suit: use card value
            value += play.cards[0].value
        }

        if (max < +value) {                   // check against current max
            max = +value; 
            winner = play.userId; 
        }
      });

      return winner; 
    };

    // all players have played
    if (game.currentHand.shownCards.length == game.playerIds.length) {

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
            
            if (!playedCards.forEach((card) => { return card.suit == playedCards[0].suit })) {
              return false;
            }

            return (playedCards[0].value == playedCards[1].value) &&
                   (playedCards[2].value == playedCards[3].value) && 
                   (playedCards[1].value == playedCards[2].value - 1);
          }
          break; 
      }

      let winner = getWinner(game.currentHand.shownCards, matchPattern);
      let points = getPoints(game.currentHand.shownCards);

      // WHERE DO WE PUT THE POINTS?????

      game.previousHands.push(game.currentHand);

      game.currentHand = {
        shownCards: game.currentHand.shownCards,   
        currentPlayer: winner,
        pattern: null, 
        suit: null
      };

    }
    
    // check to see end of game
    // if( allHandsEmpty(game.players)){
    //   if( game.deck.length > 0){
    //     GameFactory.dealPlayers(game.players, game.deck);
    //   }else{
    //     scoreGame(game);
    //   }
    // }

    //Does not properly update db
    console.log(game);
    Games.update( gameId, game );
  },

});


// function allHandsEmpty(players){
//   return _.every(players, function(player){
//     return player.hand.length === 0;
//   });
// }

//Inspired by https://github.com/FalloutX/meteor-card-game/blob/master/games.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

import './gameCreation.js';
 
export const Games = new Mongo.Collection("games");

/*
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
  inProgress: true/false,
  started: date,
  finished: date
}
*/

if (Meteor.isServer){
  //TODO: Figure out how to publish only info for current user
  Meteor.publish("games", function(){
    return Games.find();
  });

  Meteor.publish("users", function(){ //Change this to a friends list at some point
    return Meteor.users.find();
  });
}

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
    var hand = game.players[userId].hand;

    // some cards are submitted
    if (cards.length === 0)
    {
      console.log("no cards in this hand- Should be caught before here");
      return false;
    }

    // make sure each card has valid suit and value
    var validCards = cards.every((card) => {
    
      let validSuit = ['clubs', 'diamonds', 'hearts', 'spades', 'Trump'].includes(card.suits);
      let validValue = !(card.value < 1 || card.value > 14);

      return validSuit && validValue; 
    }); 

    if (!validCards) {
      return false; 
    }

    // check length of submitted cards, and pattern
    if (cards.length != game.currentHand.shownCards[0].cards.length) {
      return false; // err
    }

    // check suit of each card and if player is out of suit
    if (!cards.every((card) => { card.suit == game.currentHand.suit })) {
      let myCards = game.players[playerId].hand;                          // get current hand 
      let tempCards = myCards.filter((c) => {return !cards.includes(c)}); // get hand without played cards
      if (!tempCards.every((c) => {c.suit != game.currentHand.suit})) {   // check to see none of suit left
        return false;
      }
    }

    // "single" errors are caught by above tests

    // check for doubles of a given suit in hand
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
    double.sort((a, b) => { return a - b });

    // check for errors in "double"
    if (game.currentHand.pattern == "double") {
      if (cards[0].value != cards[1].value) {       // if didn't play double
        if (doubles.length > 0) {  // make sure no doubles in hand
          return false;
        }  
      }
    }

    // check for errors in "consecutive_double"
    if (game.currentHand.pattern = "consecutive_double") {
      if (cards[0].value != cards[1].value || 
          cards[2].value != cards[3].value || 
          cards[2].value != (cards[1].value+1)) {
        
        doubles.forEach((v, i) => {      // check for no cons-doubles in suit
          if (i > 0 && (doubles[i-1] + 1 == v)) {
            return false;
          }
        });
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

    // if we are the starting player
    if (game.currentHand.shownCards.length == 0) {
      game.currentHand.suit = cards[0].suit;
      if (!cards.every((card) => { card.suit == game.currentHand.suit })) {
        return false; // err
      }

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
        case 4:
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
    
    // error checking and all that jazz
    Meteor.call("games.checkCards", cards, gameId, userId);
    
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


    // all players have played
    if (game.currentHand.shownCards.length == game.playerId.length) {
      // check to see who won
      // Put point cards into points won for player
      // currentHand into previousHands, create new currentHand
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

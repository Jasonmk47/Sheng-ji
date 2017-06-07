//Inspired by https://github.com/FalloutX/meteor-card-game/blob/master/games.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

import './gameCreation.js';

export const Games = new Mongo.Collection('games');

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


  'games.submit'(cards, gameId, userId) {

    if (cards.length === 0)
    {
      console.log("no cards in this hand- Should be caught before here");
      return false;
    }

    //https://forums.meteor.com/t/check-object-in-an-array/3355
    check(cards, Match.Where(function(cards){
      _.each(cards, function (doc) {
        /* do your checks and return false if there is a problem */
        if(!(doc.suits == 'clubs' || doc.suits == 'diamonds' 
          || doc.suits == 'hearts' || doc.suits == 'spades' 
          || doc.suits == 'Trump')) {
          return false;
        }
        if (doc.value < 1 || doc.value > 14){
          return false;
        }
        //TODO:check the name
      });
      // return true if there is no problem
      return true;
    }));

    // Make sure the user is logged in
    if (! Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }

    var game = Games.findOne({_id: gameId});
    var hand = game.players[userId].hand;

    /*TODO: Game logic here*/

    // error checking and all that jazz

    // if we are the starting player
    if (game.currentHand.shownCards.length == 0) {
       game.currentHand.suit = cards[0].suit;
       game.currentHand.pattern = 'single';     // this is v broken
    }

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

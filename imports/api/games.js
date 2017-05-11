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

    console.log(cards);

    var game = Games.findOne({_id: gameId});
    var hand = game.players[userId].hand;

    /*TODO: Game logic here*/

    //Throw away cards that are done
    _.each(cards, function (card) {
      hand = hand.map(function (card_i) {
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

    console.log(hand);

    //Put point cards into points won for player

    game.currentTurn.unshift(game.currentTurn.pop());

    // if( allHandsEmpty(game.players)){
    //   if( game.deck.length > 0){
    //     GameFactory.dealPlayers(game.players, game.deck);
    //   }else{
    //     scoreGame(game);
    //   }
    // }

    //Does not properly update db
    Games.update( gameId, {
      $set: { hand: hand },
    });
  },

});


// function allHandsEmpty(players){
//   return _.every(players, function(player){
//     return player.hand.length === 0;
//   });
// }

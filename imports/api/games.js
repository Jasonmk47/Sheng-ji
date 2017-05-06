  //Inspired by https://github.com/FalloutX/meteor-card-game/blob/master/games.js

import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

import './gameCreation.js';
 
export const Games = new Mongo.Collection("games");

/*
game = {
  deck: [], //This will be the bottom cards?
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
  'games.submit'(cards, gameId) {
    //https://forums.meteor.com/t/check-object-in-an-array/3355
    check(cards, Match.Where(function(cards){
      _.each(cards, function (doc) {
        /* do your checks and return false if there is a problem */
        if(!(doc.suits == 'Clubs' || doc.suits == 'Diamonds' 
          || doc.suits == 'Hearts' || doc.suits == 'Spades' 
          || doc.suits == 'Trump')) {
          return false;
        }
        if (doc.value < 0 || doc.value > 13){
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
    var hand = game.players[id].hand;

    if (game.currentTurn[0] !== id && !Turns.inHand(hand, card)) return;

    /*TODO: Game logic here*/



    game.players[id].hand = Turns.removeCard(card, hand);
    game.currentTurn.unshift(game.currentTurn.pop());

    if( allHandsEmpty(game.players)){
      if( game.deck.length > 0){
        GameFactory.dealPlayers(game.players, game.deck);
      }else{
        scoreGame(game);
      }
    }
    Games.update(gameId, game);


  },

});


function allHandsEmpty(players){
  return _.every(players, function(player){
    return player.hand.length === 0;
  });
}

import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Games } from '../imports/api/games.js';

Meteor.startup(() => {
  // code to run on server at startup

});


//TODO: Figure out how to publish only info for current user
Meteor.publish("games", function(){

	var currentUserId = this.userId;

	data = Games.find(
		{ "playerIds": currentUserId },
	);

	//manipulate data here
	//Make sure this doesn't affect persistent db information


	if (data) return data;

	return this.ready();

});

Meteor.publish("users", function(){ //Change this to a friends list at some point
	var currentUserId = this.userId;

	if (currentUserId)
		return Meteor.users.find();
});


Meteor.methods({
  'games.dealCards'(gameId) {
    if (! Meteor.userId()) {
      throw new Meteor.Error('not-authorized');
    }
      check(gameId, String);

      var game = Games.findOne({_id: gameId});

      if (game.hasCalledSuit || game.hasSetBottom || game.isRoundStarted) throw new Meteor.Error("Game should have started already");

      game.hasDealtCards = true;
      Games.update( gameId, game );

      console.log("trying to deal out");

      let dealOneCard = () => {
      console.log("test")
        Object.keys(game.players).forEach(function(id){
          game.players[id].hand.push(game.deck.shift());});

        Games.update( gameId, game );

        if (0 === game.deck.length - 8) 
          Meteor.clearInterval(myInterval);
      };

      var myInterval = Meteor.setInterval(dealOneCard, 1000);

  },}
);

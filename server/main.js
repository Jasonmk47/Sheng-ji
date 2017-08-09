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

Meteor.publish("users", function(){ //TODO: Change this to a friends list at some point
	var currentUserId = this.userId;

	if (currentUserId)
		return Meteor.users.find(); //To make into a friends list search for users friends instead of all users
});

Meteor.methods({
	'games.dealCards'(gameId) {
		if (! Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}
			check(gameId, String);

			var game = Games.findOne({_id: gameId});

			let dealOneCard = () => {
				game = Games.findOne({_id: gameId});

				//For the first round
				if (!game.startingPlayer && game.deck[0].value === 2) {
					game.startingPlayer = game.playerIds[game.dealerIncrement];
					game.currentHand.currentPlayer = game.startingPlayer;
					game.settingBottom = game.startingPlayer;
					game.whoCalled = game.startingPlayer;
					
					game.hasCalledSuit = true;
					
					var card = game.deck[0];
					game.trumpSuit = card.suit;
					game.deck.forEach((c) => {if (c.suit === card.suit) c.isTrump = true;});
					Object.keys(game.players).forEach(function(id){
						game.players[id].hand.forEach((c) => {if (c.suit === card.suit) c.isTrump = true;});
					});
				}

				//Insert card into hand
				game.players[game.playerIds[game.dealerIncrement]].hand.push(game.deck.shift());
				
				//Move dealer
				game.dealerIncrement++;
				game.dealerIncrement = game.dealerIncrement % game.playerIds.length;

				//End of dealing
				if (0 === game.deck.length - 8) {
					Meteor.clearInterval(myInterval);

					game.hasDealtCards = true;
					
					//Adding bottom to the person who should
					game.players[game.startingPlayer].hand = game.players[game.startingPlayer].hand.concat(game.deck);
					game.deck = [];
				}

				Games.update( gameId, game );
			};

		//TODO: pause
		if (myInterval) {
			console.log("pausing")
			Meteor.clearInterval(myInterval);
		}
		else {
			var myInterval = Meteor.setInterval(dealOneCard, 250);
		}

	},

});

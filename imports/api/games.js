//Inspired by https://github.com/FalloutX/meteor-card-game/blob/master/games.js
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

import './gameCreation.js';

export const Games = new Mongo.Collection('games');

Meteor.methods({
	'games.createGame'(player2, player3, player4) {
		// Make sure the user is logged in
		if (! Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}

		check(player2, String);
		check(player3, String);
		check(player4, String);

		var game = GameFactory.createGame([Meteor.userId(), player2, player3, player4], '4p2d');
		Games.insert(game);
		console.log("Game has been created.!");
	},

	'games.delete'(gameId) {
		// Make sure the user is logged in
		if (! Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}
		Games.remove({_id: gameId});
	},

	'games.callSuit'(card, gameId) {
		if (! Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}

		check(card, {
			id: Number,
			isTrump: Boolean,
			name: String,
			suit: String,
			value: Number
		});
		check(gameId, String);

		var game = Games.findOne({_id: gameId});
		if (card.value !== game.trumpNum) throw new Meteor.Error('not a trump card');;

		//Race conditions here?
		if (!game.whoCalled) game.whoCalled = Meteor.userId();

		game.trumpSuit = card.suit;
		game.deck.forEach((c) => {if (c.suit === card.suit) c.isTrump = true;});
		Object.keys(game.players).forEach(function(id){
			game.players[id].hand.forEach((c) => {if (c.suit === card.suit) c.isTrump = true;});
		});

		Games.update( gameId, game );
		console.log(game);
	},

	'games.flipSuit'(cards, gameId) {
		// Make sure the user is logged in
		if (! Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}
		check(cards, [{
			id: Number,
			isTrump: Boolean,
			name: String,
			suit: String,
			value: Number
		}]);
		check(gameId, String);

		var game = Games.findOne({_id: gameId});

		if (cards.length === 0) {
			game.queueToAskFlip.shift();
			Games.update( gameId, game );
		}
		else if (cards.length === 2) {
			if (cards[0].value !== cards[1].value || cards[0].suit !== cards[1].suit) throw new Meteor.Error('Not a pair');

			//Make sure the order of suit is correct
			if (game.hasBeenFlipped) {
				//Takes advantage of alphabetical order
				if (cards[0].suit < game.trumpSuit) {throw new Meteor.Error("Lower order trump"); }
				if (cards[0].value !== 16 && game.trumpSuit === 'trump') { throw new Meteor.Error('Must be big jokers');}
			}
			else { game.hasBeenFlipped = true; }

			//Remove the trump suit status from other cards
			game.deck.forEach((c) => {if (c.suit === game.trumpSuit && c.value !== game.trumpNum) c.isTrump = false;});
			Object.keys(game.players).forEach(function(id){
				game.players[id].hand.forEach((c) => {if (c.suit === game.trumpSuit && c.value !== game.trumpNum) c.isTrump = false;});
			});

			Meteor.call('games.callSuit', cards[0], gameId);


			game.queueToAskFlip.shift();
			Games.update( gameId, game );

		}
		else {
			Meteor.Error("Not flipped with two cards");
		}

	},

	'games.setBottom'(cards, gameId) {
		// Make sure the user is logged in
		if (! Meteor.userId()) {
			throw new Meteor.Error('not-authorized');
		}
		check(cards, [{
			id: Number,
			isTrump: Boolean,
			name: String,
			suit: String,
			value: Number
		}]);
		check(gameId, String);

		var game = Games.findOne({_id: gameId});

		if (game.settingBottom !== Meteor.userId()) throw new Meteor.Error("Not person who should set the bottom");

		//Refresh flipping ability
		game.queueToAskFlip = [];

		var playerIndex = game.playerIds.findIndex((id) => {return id === Meteor.userId()});
		playerIndex++; //Don't queue yourself

		for (var i = 0; i < game.playerIds.length - 1; i++) {
			game.queueToAskFlip.push(game.playerIds[playerIndex]);
			playerIndex++;
			playerIndex = playerIndex % game.playerIds.length;
		}

		game.deck = cards;

		console.log(game.players[Meteor.userId()].hand)

		game.players[Meteor.userId()].hand = game.players[Meteor.userId()].hand.filter((element)=>{
			return !cards.some((card)=>{ return card.id === element.id});
		});

		game.settingBottom = null;

		Games.update( gameId, game );
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

					//To account for 2s in the trump suit
					var value = c.value;

					if (value === game.trumpNum) {
						if (c.suit === 'clubs') value += 100;
						else if (c.suit === 'diamonds') value += 200;
						else if (c.suit === 'hearts') value += 300;
						else value += 400;
					}

					if (seen.includes(value)) {           // if seen before
						doubles.push(value);                // add to doubles
					}
					seen.push(value);                     // add to seen list
				}
			}
			doubles.sort((a, b) => { return a - b });
			return doubles;
		};

		var doubles = countDoubles(game.players[userId].hand, game.currentHand.suit);
		var doublesInPlay = countDoubles(cards, game.currentHand.suit);

			// check for errors in "double"
			if (game.currentHand.pattern === "double") {
				if (doubles.length > 0 && doublesInPlay.length !== 1) {                   // make sure no doubles in hand
					throw new Meteor.Error('Must play double in suit');
				}  
			}

			// check for errors in "consecutive_double"
			if (game.currentHand.pattern === "consecutive_double") {
				if (doubles.some((el, i) => {var next = el+1; if (next === game.trumpNum) next++; if (i+1 < doubles.length) return next === doubles[i+1]})
					&& doublesInPlay.some((el, i)=>{var next = el+1; if (next === game.trumpNum) next++; if (i+1 < doubles.length) return next === doubles[i+1]})) {
						throw new Meteor.Error('Must play consecutive double in suit');
				}

				// Not only can you not have as many doubles, you have to play them as well
				if (doubles.length === 1) {                   // make sure no doubles in hand
					//Have to play as many doubles as possible
					if(doublesInPlay.length !== 1) {
						throw new Meteor.Error("Must play all doubles you have");
					}
				}

				if (doubles.length > 1) {                   // make sure no doubles in hand
					//Have to play as many doubles as possible
					if(doublesInPlay.length !== 2) {
						throw new Meteor.Error("Must play all doubles");
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
			game.players[userId].hand = game.players[userId].hand.map((card_i) => {
				if (card_i.id !== card.id ) {
					return card_i;
				}
			}).filter((card_j) => { return card_j !== undefined;});
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
							
							if (higherValue === game.trumpNum){
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

			//Figure out overall winner
			//Display the final score
			let defendersStarted = null;
			let assignedTeam = false;
			let startingPlayerIndex = null;
			let i = 0;
			let team1 = 0;
			let team2 = 0;

			Object.keys(game.players).forEach(function(id){

				if (!assignedTeam && game.players[id] === game.startingPlayer) {
					assignedTeam = true;
					startingPlayerIndex = i;
					if (i%2 === 0) {defendersStarted = true;}
					else {defendersStarted = false;}
				}


				if (i%2 === 0) {
					team1+=game.players[id].points;
				}
				else {
					team2+=game.players[id].points;
				}

				i++;
			});

			let attackingScore = defendersStarted ? team2 : team1;

			//Double the bottom
			game.deck.forEach((card)=>{
				if (card.value === 5) {          // check for 5, 10, K
					attackingScore += 10; 
				} else if (card.value === 10 || card.value === 13) {
					attackingScore += 20
				}	
			});
			
			//Increment score of appropriate players
			var victoryPoints = 0;
			var attackersWon = attackingScore >= 80 ? true : false;

			//Shutout
			if (attackingScore === 0) {
				console.log("lol");
				victoryPoints = 3;
			}
			else if (attackingScore < 40) {
				victoryPoints = 2;
			}
			else if (attackingScore < 80) {
				victoryPoints = 1;
			}
			else if (attackingScore < 120) {
				victoryPoints = 0;
			}
			else if (attackingScore < 160) {
				victoryPoints = 1;
			}
			else if (attackingScore < 200) {
				victoryPoints = 2;
			}
			else if (attackingScore < 240) {
				victoryPoints = 3;
			}
			else if (attackingScore < 280) {
				victoryPoints = 4;
			}	
			//Max points of 280
			else {
				console.log("Waow");
				victoryPoints = 5;
			}

			const nextStartingPlayerIndex = attackersWon ? (startingPlayerIndex + 1) % 4 : (startingPlayerIndex + 2) % 4;
			i = 0;
			//Set player variables
			Object.keys(game.players).forEach(function(id){
				//Set game variables based off players
				if (i === nextStartingPlayerIndex) {
					game.startingPlayer = id;
					let nextTrumpNum = game.players[id].overallScore;
				}

				game.players[id].points = 0;
				if (i%2===1&&attackersWon) {
					game.players[id].overallScore += victoryPoints;
				}
				else if (i%2===0&&!attackersWon) {
					game.players[id].overallScore += victoryPoints;
				}
				game.players[id].hand = [];
			});
			
			//Reset game variables


			//Remove the trump suit status from other cards
			game.deck.forEach((c) => {if (c.suit === game.trumpSuit || c.value === game.trumpNum) c.isTrump = false;});
			Object.keys(game.players).forEach(function(id){
				game.players[id].hand.forEach((c) => {if (c.suit === game.trumpSuit || c.value === game.trumpNum) c.isTrump = false;});
			});

			game.trumpNum = nextTrumpNum;

			game.previousHands = [];

			game.roundNumber++;
			game.trumpSuit = "trump";

			game.dealerIncrement = 0;

			game.hasCalledSuit = false;
			game.whoCalled = null;
			game.hasDealtCards = false;
			game.hasBeenFlipped = false;
			
			game.isDealing = false;

			game.settingBottom = null;
			game.queueToAskFlip = ["dummy"];
			

		}

		Games.update( gameId, game );
	},
});

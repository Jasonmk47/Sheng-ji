# Sheng-ji
Online version of Sheng-Ji or 80 points

Getting started

Download Meteor

Download node

meteor npm install

Type the command 'meteor' in the parent folder to start the server.

Make 4 users. (Sign up - Sign out repeatedly)
You will see the users appear in a list.
Click create a game. As of now, the game creation always takes the first 4 users in the db
You will see the gameID appear in the list
Click start game
The list should disappear and the first game in the db will be loaded. ALl your cards should be listed
If you click on the cards (like on the text) they are queued so the submit button calls game functionality on them.
This needs to be animated.


DB management

	If you want to delete all games/users start the mongodb shell by typing 'meteor mongo'
	To delete all games do 'db.games.drop()'
	To delete all users do 'db.users.drop()'

	Viewing all collections in the db is 'show collections'


TODOS:
	Graphics - Making the card graphic.
			   Making the board graphic.

	Animations - Making selected cards highlight in some way
				 Having dealt cards animate to your hand (bonus)

	Server side - Figure out how to deal the cards slowly over time for calling trump suit

	Meta topics - Figure out how to do game creation
				  User management (Friends list? Chat room? Game rooms with invite link?)
				  How to resume play? (We could just never end the games and have games able to be played over the course of days)

	Game logic - How to call a trump suit
				 Giving the bottom to defender
				 Setting the bottom
				 Flipping suit
				 Playing hands and verifying validity
				 Scoring points
				 Going between rounds
				 Winning


If you shuai (whatever I dont know how to write this), and you get rekt by someone else, do we show:
	Everyone who can beat you
	Show your hand but then auto turn it into a valid hand
	Automatically just make your hand valid


Do we want a action log for what has happened so far?
Or maybe a toggle for it?

Do we want a timer?



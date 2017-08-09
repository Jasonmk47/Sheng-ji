# Sheng-ji
Online version of Sheng-Ji or 80 points

Getting started

-Download Meteor
-Download node
-meteor npm install
-Type the command 'meteor' in the parent folder to start the server.

-Make 4 users (Sign up - Sign out repeatedly)
-You will see the users appear in a list.
-Select them and click create a game, the play order will be in the order you selected them.
-Select the game that just appeared and click start game


DB management

	If you want to delete all games/users start the mongodb shell by typing 'meteor mongo'
	To delete all games do 'db.games.drop()'
	To delete all users do 'db.users.drop()'

	Viewing all collections in the db is 'show collections'


FEATURES TODO:
	Game logic - Policing shuai
				 Going between rounds
				 Winning overall

	Meta topics - Friends list / Rooms to join
				  Timer to make people play faster (bonus)

	Graphics - Have orientation of cards flipped for preference (bonus)

	Animations - Having dealt cards animate to your hand (bonus)


KNOWN BUGS:
-You can select cards that are already played
-If you select a game and someone else deletes it, you have to refresh the page else you cannot start a game
-Occasionally, selecting cards doesn't work and you have to refresh the page (I have no idea why this happens, I thought this issue should be fixed)
-You can play shuais but the game never rejects them and doesn't know how to score/check validity correctly

QUESTIONS:
-If you shuai and you get rekt by someone else, how do we show the cards you tried + who can beat you?
-Do we want an undo button?

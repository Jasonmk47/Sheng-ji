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
		//Selectively send card data
		// fields: {

		// }
	);

	//manipulate data here
	//Make sure this doesn't affect persistent db information
//    data.update();



	if (data) return data;

	return this.ready();

});

Meteor.publish("users", function(){ //Change this to a friends list at some point
	var currentUserId = this.userId;

	if (currentUserId)
		return Meteor.users.find();
});

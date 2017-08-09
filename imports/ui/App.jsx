import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import { Games } from '../api/games.js';

import Hand from './Hand.jsx';
import Table from './Table.jsx';
import FriendList from './FriendList.jsx';
import GameList from './GameList.jsx';

import AccountsUIWrapper from './AccountsUIWrapper.jsx';

// App component - represents the whole app
class App extends Component {

	// Initial state
	constructor(props) {
		super(props);

		this.state = {
			inGame: false,
			play: [], //Current cards in play
			currentGameId: -1, //No current game
			selectedUsers: [], //For making games
			selectedGames: [],
		};
		this.toggleToPlay = this.toggleToPlay.bind(this);
		this.toggleToSelect = this.toggleToSelect.bind(this);
		this.toggleToSelectGame = this.toggleToSelectGame.bind(this);
	}

	componentWillUpdate(nextProps, nextState) {
		//TODO: Insert page refresh if game you are in is deleted from the db
		if (!Meteor.user()) {
			nextState.inGame = false;
			nextState.selectedGames = [];
//            nextState.selectedUsers = [];
			nextState.play = [];
		}
	}

///////////////////////////////////////////////////////////////////////////
//TOGGLES
///////////////////////////////////////////////////////////////////////////

	//We could reject toggling here if it is an invalid play
	toggleToPlay(card) {
		var index = this.state.play.indexOf(card)

		if (index > -1)
		{
			//http://stackoverflow.com/questions/29527385/removing-element-from-array-in-component-state
			this.setState((prevState) => ({
				play: prevState.play.filter((_, i) => i !== index)
			}));
			console.log("removing card")
		}
		else {
			//http://stackoverflow.com/questions/26505064/react-js-what-is-the-best-way-to-add-a-value-to-an-array-in-state
			this.setState(previousState => ({
				play: previousState.play.concat(card)
			}));
			console.log("adding card")
		}
		return true;
	}

	toggleToSelect(friend) {
		var index = this.state.selectedUsers.indexOf(friend);

		if (index > -1) {
			this.setState((prevState) => ({
				selectedUsers: prevState.selectedUsers.filter((_, i) => i !== index)
			})); 
		}
		else {
			if (this.state.selectedUsers.length >= 3) {
				return false;
			}
			//Only because we publish the entire user list
			if (friend !== this.props.currentUser._id) {

				this.setState(previousState => ({
					selectedUsers: previousState.selectedUsers.concat(friend)
				}));
			}
			else {
				console.log(friend + " is yourself")
				return false;
			}
		}

		return true;
	}

	toggleToSelectGame(game) {
		var index = this.state.selectedGames.indexOf(game)

		if (index > -1)
		{
			//http://stackoverflow.com/questions/29527385/removing-element-from-array-in-component-state
			this.setState(previousState => ({
				selectedGames: previousState.selectedGames.filter((_, i) => i !== index)
			}));
		}
		else {
			//http://stackoverflow.com/questions/26505064/react-js-what-is-the-best-way-to-add-a-value-to-an-array-in-state
			this.setState(previousState => ({
				selectedGames: previousState.selectedGames.concat(game)
			}));
		}

		return true;
	}

///////////////////////////////////////////////////////////////////////////
//BUTTONS - STATE CHANGES
///////////////////////////////////////////////////////////////////////////

	createGame(event){
		event.preventDefault();

		console.log(this.state.selectedUsers)

		if (this.state.selectedUsers.length < 3) {
			console.log("Not enough users selected")
			return false;
		}

		const first = this.state.selectedUsers[0];
		const second = this.state.selectedUsers[1];
		const third = this.state.selectedUsers[2];

		Meteor.call('games.createGame', first, second, third);
	}

	deleteGame(event) {
		event.preventDefault();

		const numGamesSelected = this.state.selectedGames.length;

		for (let i = 0; i < numGamesSelected; i++) {
			const gameIndex = this.props.games.findIndex((game) => {
				return (game._id == this.state.selectedGames[i]); 
			});

			const game = this.props.games[gameIndex];
			Meteor.call('games.delete', game._id);
		}

		this.setState({ selectedGames: [] });
	}

	startGame(event){
		event.preventDefault();

		console.log(this.state.selectedGames[0]);

		if (this.state.selectedGames.length > 1) {
			console.log("Too many games selected");
			return false;
		}

		const search = this.props.games.findIndex((game) => {
			return (game._id == this.state.selectedGames[0]) 
		});

		const game = this.props.games[search];

		this.setState({currentGameId: game._id, inGame: true});
	}

	backToMenu(event){
		event.preventDefault();
		this.setState({inGame: false, selectedUsers: [], selectedGames: [], play: []})
	}

///////////////////////////////////////////////////////////////////////////
//BUTTONS - GAME ACTIONS
///////////////////////////////////////////////////////////////////////////

 submitHand(event){
		event.preventDefault();

		const gameIndex = this.props.games.findIndex((game) => {
			return (game._id == this.state.currentGameId) 
		});
		
		const game = this.props.games[gameIndex];

		if (this.state.play.length === 0) {
			console.log("No cards in play")
			return false;
		}

		if (this.props.currentUser._id != game.currentHand.currentPlayer) {
			console.log('Not your turn!');
			return false;
		}

		console.log(this.state.play)

		Meteor.call('games.checkCards', this.state.play, this.state.currentGameId, 
			this.props.currentUser._id, (error) => { 
				if (error) {
					console.log("Illegal play!")
					return false;
				} 
		});

		const self = this;

		Meteor.call('games.submit', this.state.play, this.state.currentGameId, this.props.currentUser._id, function(err, data) {
			if (err) {
				console.log(err);
			}
			else {
				//Only if it was successful
				self.setState({play: []})}
			});
	}

	dealCards(event) {
		event.preventDefault();
		console.log("dealing cards");

		Meteor.call("games.dealCards", this.state.currentGameId);
	}

	callSuit(event){
		event.preventDefault();
		console.log("setting suit");
		 
		Meteor.call('games.callSuit', this.state.play[0], this.state.currentGameId);
		this.setState({play: []});
	}

	setBottom(event) {
		event.preventDefault();
		if (this.state.play.length !== 8) {
			console.log("Not right amount of cards selected: " + this.state.play.length);
		}
		else {
			console.log("setting bottom");
			const self = this;
			Meteor.call('games.setBottom', this.state.play, this.state.currentGameId, function(err, data) {
			if (err) {
				console.log(err);
			}
			else {
				//Only if it was successful
				self.setState({play: []})}
			});
		}
	}

	flipSuit(event) {
		event.preventDefault();
		console.log("flipping");

		var game = this.props.games.find(
				game => {if(game._id === this.state.currentGameId ) return game;})

		if (this.state.play.lengh !== 2){
			console.log("Not the right number of cards");
		}
		else if (this.state.play[0].value !== this.state.play[1].value) {
			console.log("This isn't a pair");
		}
		else if (this.state.play[0].value !== game.trumpNum || !this.state.play[0].isTrump) {
			console.log("Not valid flipping suit");
		}
		else {
			Meteor.call('games.flipSuit', this.state.play, this.state.currentGameId);
		}
	}

	noFlipSuit(event) {
		event.preventDefault();
		console.log("not flipping");
		Meteor.call('games.flipSuit', [], this.state.currentGameId);
	}

///////////////////////////////////////////////////////////////////////////
//RENDERING FUNCTIONS
///////////////////////////////////////////////////////////////////////////

	renderHand(){
		if(this.state.inGame) {
			return <Hand gameId={this.state.currentGameId} games={this.props.games} 
					currentUser={this.props.currentUser} toggleToPlay={this.toggleToPlay}/>
		}
	}

	renderTable(){
		if(this.state.inGame) {
			return <Table gameId={this.state.currentGameId} games={this.props.games} 
					currentUser={this.props.currentUser}/>
		}
	}

	renderTurnIndicator(game){
		if (game.currentHand.currentPlayer === this.props.currentUser._id)
			return (<div>GO!!! It's your turn</div>)
		else
			return (<div>It's not your turn</div>)
	}

	renderDealCardButton(game){
		if (!game.hasDealtCards) {
			return (
				<form className="deal-cards" onSubmit={this.dealCards.bind(this)}>
					<input
						type='submit'
						value="Deal cards"
						name="deal-cards"
					/>
				</form>)
		}
	}

	renderReinforceButton(game) {
		if (game.whoCalled === this.props.currentUser._id && !game.hasBeenFlipped && game.queueToAskFlip.length !== 0) {
			return (<div className="reinforce-field"> reinforce</div>)
		}
		else {
			return (<div className="reinforce-field"></div>)
		}
	}

	renderCallSuitButton(game) {
		if (game.hasCalledSuit) {
			return this.renderReinforceButton(game);
		}
		else {
			return (
				<form className="call-suit" onSubmit={this.callSuit.bind(this)}>
					<input
						type='submit'
						value="Call Suit"
						name="call-suit"
					/>
				</form>)
		}
	}

	renderSetBottomButton(game) {
		if (game.settingBottom === this.props.currentUser._id) {
			return (
				<form className="set-bottom" onSubmit={this.setBottom.bind(this)}>
					<input
						type='submit'
						value="Set Bottom"
						name="set-bottom"
					/>
				</form>)
		}
	}

	renderFlippingButtons(game) {
		if (game.queueToAskFlip[0] === this.props.currentUser._id && game.hasDealtCards) {
			return (
			<div> 
				<form className="flip" onSubmit={this.flipSuit.bind(this)}>
					<input
						type='submit'
						value="Flip"
						name="flip"
					/>
				</form>
				<form className="no-flip" onSubmit={this.noFlipSuit.bind(this)}>
					<input
						type='submit'
						value="Don't flip"
						name="no-flip"
					/>
				</form>
			</div>)
		}
	}

	renderPlayButton() {
		return (
			<form className="submit-hand" onSubmit={this.submitHand.bind(this)}>
				<input
					type='submit'
					value="Submit"
					name="submit-hand"
				/>
			</form>)
	}

	renderBackButton() {
		return (
			<form className="back-to-menu" onSubmit={this.backToMenu.bind(this)}>
				<input
					type='submit'
					value="Back To Menu"
					name="back-to-menu"
				/>
			</form>)
	}

	renderStartMenuButtons() {
		return  (
			<div>
				<div className="start-game">
					<ul className="friend-list">
						<FriendList friends={this.props.friends} toggleToSelect={this.toggleToSelect} />
					</ul>
					<ul className="games-list">
						<GameList games={this.props.games} toggleToSelect={this.toggleToSelectGame} />
					</ul>
				</div>

				<div>
					<form className="create-game" onSubmit={this.createGame.bind(this)}>
						<input
							type='submit'
							value="Create Game"
							name="create-game"
						/>
					</form>
				
					<form className="start-game" onSubmit={this.startGame.bind(this)}>
						<input
							type='submit'
							value="Start Game"
							name="start-game"
						/>
					</form>

					<form className="delete-game" onSubmit={this.deleteGame.bind(this)}>
						<input
							type='submit'
							value="Delete Game"
							name="delete-game"
						/>
					</form>
				</div>
			</div>)
	}

	render() {
		var game = this.props.games.find(game => {if(game._id === this.state.currentGameId ) return game;})

		return (
			<div className="container">
				<header>
					<h1>Sheng-ji</h1>

					<AccountsUIWrapper />

				</header>
				{this.state.inGame ? 
				<div>
					{this.renderTurnIndicator(game)}
					{this.renderDealCardButton(game)}

					{this.renderTable()}
					{this.renderHand()}

					{this.renderCallSuitButton(game)}                    
					<br />
					{this.renderSetBottomButton(game)}

					{game.queueToAskFlip.length === 0 ? this.renderPlayButton() : this.renderFlippingButtons(game)}

					{this.renderBackButton()}
				</div>
				:
				<div>
				{this.renderStartMenuButtons()}
				</div>
				}

			</div>
		);
	}
}

App.propTypes = {
	games: PropTypes.array.isRequired,
	friends: PropTypes.array.isRequired,
	currentUser: PropTypes.object,
};

export default createContainer(() => {
	Meteor.subscribe("games");
	Meteor.subscribe("users");

	return {
		games: Games.find({}, { sort: { createdAt: -1 } }).fetch(),
		friends: Meteor.users.find().fetch(), //TODO: This should become the actual friends list
		currentUser: Meteor.user(),
	};
}, App);

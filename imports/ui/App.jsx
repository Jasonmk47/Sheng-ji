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
        if (!Meteor.user()) {
            nextState.inGame = false;
            nextState.selectedGames = [];
            nextState.selectedUsers = [];
            nextState.play = [];
        }
    }

    toggleToPlay(card) {
        //TODO: If not logical card reject here and return false
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

    submitHand(event){
        event.preventDefault();

        const gameIndex = this.props.games.findIndex((game) => {
            return (game._id == this.state.currentGameId) 
        });
        
        const game = this.props.games[gameIndex];
        console.log("App.jsx testing game selection");
        console.log(this.props.currentUser._id);
        console.log(game);

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
        this.setState({inGame: false, selectedUsers: [], selectedGames: []})

    }

    render() {
        return (
            <div className="container">
                <header>
                    <h1>Sheng-ji</h1>

                    <AccountsUIWrapper />

                </header>
                {this.state.inGame ? 
                <div>
                    {this.props.games.find( //This looks ugly, should format it better
                        game => {if(game._id == this.state.currentGameId ) return game;}).currentHand.currentPlayer === this.props.currentUser._id ?
                        <div>GO!!! It's your turn</div> : <div>It's not your turn</div>}
                    {this.renderTable()}
                    {this.renderHand()}
                </div>
                :
                <div className="start-game">
                    <ul className="friend-list">
                        <FriendList friends={this.props.friends} toggleToSelect={this.toggleToSelect} />
                    </ul>
                    <ul className="games-list">
                        <GameList games={this.props.games} toggleToSelect={this.toggleToSelectGame} />
                    </ul>
                </div>
                }
                {this.state.inGame ?
                    <div>
                        <form className="submit-hand" onSubmit={this.submitHand.bind(this)}>
                            <input
                                type='submit'
                                value="Submit"
                                name="submit-hand"
                            />
                        </form>
                        <form className="back-to-menu" onSubmit={this.backToMenu.bind(this)}>
                            <input
                                type='submit'
                                value="Back To Menu"
                                name="back-to-menu"
                            />
                        </form>
                    </div>
                :
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

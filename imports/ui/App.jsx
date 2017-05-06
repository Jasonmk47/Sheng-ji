import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import { Meteor } from 'meteor/meteor';
import { createContainer } from 'meteor/react-meteor-data';

import { Games } from '../api/games.js';

import Card from './Card.jsx';
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
            selectedUsers: [], //TODO: For making games. Not used currently
        };
        this.toggleToPlay = this.toggleToPlay.bind(this);
    }

    toggleToPlay(card) {
        //TODO: If not logical card reject here and return false
        var index = this.state.play.indexOf(card)

        if (index > -1)
            this.state.play.splice(index, 1);
        else
            this.state.play.push(card);

        return true;
    }

    //TODO: sort the cards by suit
    renderCards(){
        if(this.state.inGame)
        {
            const game = this.props.games.find( game => {if(game._id == this.state.currentGameId) return game;} );

            console.log(game);
            console.log(this.props.currentUser);

            return game.players[this.props.currentUser._id].hand.map((card) => (
               <Card key={card.id} card={card} toggleToPlay={this.toggleToPlay}/>
            )).sort(
                function (x, y) {
                    //I wanted this to be a helper function but didnt feel like figuring out how to do it rn
                    if ((game.trumpSuit !== x.props.card.suit || x.props.card.suit !== "Trump") && (game.trumpSuit === y.props.card.suit || x.props.card.suit === "Trump"))
                        return -1;

                    if ((game.trumpSuit === x.props.card.suit || x.props.card.suit === "Trump") && (game.trumpSuit !== y.props.card.suit || x.props.card.suit !== "Trump"))
                        return 1;

                    //Relies on the fact that trump order is alphabetical and t is after s
                    if (x.props.card.suit < y.props.card.suit)
                        return -1;
                    if (x.props.card.suit > y.props.card.suit)
                        return 1;
                    
                    return x.props.card.value - y.props.card.value;
                }
            );
        }
    }

    //TODO: Should make in separate place
    //Also should make not all users
    //Also should make three-toggle only
    renderFriends(){
        return this.props.friends.map(user => {return (
            <li key={user._id}>
                <label>{user.username}
                <input type="checkbox"/>
                </label>
            </li>
        )});
    }

    //Change to be identifiable. Maybe give each game a changeable name
    renderGames(){
        return this.props.games.map(game => { return (
            <li key={game._id}>
                <label>{game._id}
                <input type="checkbox"/>
                </label>
            </li>
        )});
    }

    submitHand(event){
        event.preventDefault();
        Meteor.call('games.submit', this.state.play, this.state.currentGameId);
    }

    createGame(event){
        event.preventDefault();

        //Hard coded to test just make 4 accounts to try out
        const first = this.props.friends[1]._id;
        const second = this.props.friends[2]._id;
        const third = this.props.friends[3]._id;

        console.log(first);
        console.log(second);
        console.log(third);

        Meteor.call('games.createGame', first, second, third);
    }

    startGame(event){
        event.preventDefault();

        //hardcoded to test
        console.log(this.props.games[0]._id);
        this.setState({currentGameId: this.props.games[0]._id});
        this.setState({inGame: true});
    }

    render() {
        return (
            <div className="container">
                <header>
                    <h1>Sheng-ji</h1>
    
                    <AccountsUIWrapper />
 
                </header>

                {this.state.inGame ? 
                <div className="cards-in-hand">
                    {this.renderCards()}
                </div>
                :
                <div className="start-game">
                    <ul className="friend-list">
                        {this.renderFriends()}
                    </ul>
                    <ul className="games-list">
                        {this.renderGames()}
                    </ul>
                </div>
                }
                {this.state.inGame ?
                    <form className="submit-hand" onSubmit={this.submitHand.bind(this)}>
                        <input
                            type='submit'
                            value="Submit"
                            name="submit-hand"
                        />
                    </form> 
                :
                    <form className="create-game" onSubmit={this.createGame.bind(this)}>
                        <input
                            type='submit'
                            value="Create Game"
                            name="create-game"
                        />
                    </form>
                }

                <form className="start-game" onSubmit={this.startGame.bind(this)}>
                    <input
                        type='submit'
                        value="Start Game"
                        name="start-game"
                    />
                </form>


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
    Meteor.subscribe("users"); //Is this what limits Meteor.users?

    return {
        games: Games.find({}, { sort: { createdAt: -1 } }).fetch(),
        friends: Meteor.users.find().fetch(),
        currentUser: Meteor.user(),
    };
}, App);

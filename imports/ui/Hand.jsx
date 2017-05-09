import React, { Component, PropTypes } from 'react';
import classnames from 'classnames';

import Card from './Card.jsx';

export default class Hand extends Component {

    constructor(props) {
        super(props);
    }

    //TODO: sort the cards by suit
    renderCards(){
        const game = this.props.games.find( game => {if(game._id == this.props.gameId) return game;} );

        console.log(game);
        console.log(this.props.currentUser);

        return game.players[this.props.currentUser._id].hand.map((card) => (
           <Card key={card.id} card={card} toggleToPlay={this.props.toggleToPlay}/>
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

	render() {
	    const handClassName = classnames({
	    });

		return (
			<div id="hand" className={handClassName}>
				{this.renderCards()}
            </div>
		);
	}
}

Hand.propTypes = {
	games: PropTypes.array.isRequired,
	gameId: PropTypes.object.isRequired,
	currentUser: PropTypes.object.isRequired,
	toggleToPlay: PropTypes.func.isRequired,
};
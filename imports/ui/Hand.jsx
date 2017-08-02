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

        var ordering = {};

        ordering["trump"] = 0;

        if (game.trumpSuit === 'spades') {
            ordering['spades'] = 3;
            ordering['hearts'] = 2;
            ordering['clubs'] = 1;
            ordering['diamonds'] = 0;
        }
        else if (game.trumpSuit === "hearts") {
            ordering['hearts'] = 3;
            ordering['spades'] = 2;
            ordering['diamonds'] = 1;
            ordering['clubs'] = 0;
        }
        else if (game.trumpSuit === "diamonds") {
            ordering['diamonds'] = 3;
            ordering['spades'] = 2;
            ordering['hearts'] = 1;
            ordering['clubs'] = 0;
        }
        else{
            ordering['clubs'] = 3;
            ordering['hearts'] = 2;
            ordering['spades'] = 1;
            ordering['diamonds'] = 0;
        }

        return game.players[this.props.currentUser._id].hand.map((card) => (
           <Card key={card.id} card={card} toggleToPlay={this.props.toggleToPlay}/>
        )).sort(
            function (x, y) {
                if ((x.props.card.isTrump) && (!y.props.card.isTrump))
                    return -1;

                else if ((!x.props.card.isTrump) && (y.props.card.isTrump))
                    return 1;

                else if ((x.props.card.isTrump) && (y.props.card.isTrump)) {
                    var pairX = ordering[x.props.card.suit];
                    var pairY = ordering[y.props.card.suit];

                    return (y.props.card.value + pairY) - (x.props.card.value + pairX);
                }

                if (x.props.card.suit !== y.props.card.suit)
                    return ordering[y.props.card.suit] - ordering[x.props.card.suit];
                
                return y.props.card.value - x.props.card.value;
            }
        );
    }

	render() {
	    const handClassName = classnames('hand');

		return (
			<div className={handClassName}>
				{this.renderCards()}
            </div>
		);
	}
}

Hand.propTypes = {
	games: PropTypes.array.isRequired,
	gameId: PropTypes.string.isRequired,
	currentUser: PropTypes.object.isRequired,
	toggleToPlay: PropTypes.func.isRequired,
};
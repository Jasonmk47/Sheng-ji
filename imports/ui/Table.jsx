import React, { Component, PropTypes } from 'react';
import classnames from 'classnames';

import Card from './Card.jsx';

export default class Table extends Component {

    constructor(props) {
        super(props);
    }

    //TODO: sort the cards by suit
    renderCards(){
        const game = this.props.games.find( game => {if(game._id == this.props.gameId) return game;} );

        console.log("table")
        console.log(game.currentHand);

        return game.currentHand.shownCards.map((play) => (
            <div> 
                { play.userId} 

                { play.cards.map((card) => (
                    <Card key={card.id} card={card}/>
                    ))}
            </div>));
    }

	render() {
	    const tableClassName = classnames({
	    	table: "table",
	    });

		return (
			<div className={tableClassName}>
				{this.renderCards()}
            </div>
		);
	}
}

Table.propTypes = {
	games: PropTypes.array.isRequired,
	gameId: PropTypes.object.isRequired,
	currentUser: PropTypes.object.isRequired,
};
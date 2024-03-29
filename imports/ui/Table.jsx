import React, { Component, PropTypes } from 'react';
import classnames from 'classnames';

import Card from './Card.jsx';

export default class Table extends Component {

    constructor(props) {
        super(props);
    }

    toggleToPlay() {
        return true;
    }

    //TODO: sort the cards by suit
    renderCards(){
        const game = this.props.games.find( game => {if(game._id == this.props.gameId) return game;} );

        return game.currentHand.shownCards.map((play) => (
            <div key={play.userId}> 
                { play.userId } 

                { play.cards.map((card) => (
                    <Card key={card.id} card={card} toggleToPlay={this.toggleToPlay}/>
                    ))}
            </div>
        ));
    }

	render() {
	    const tableClassName = classnames('table');

		return (
			<div key={this.props.gameId} className={tableClassName} style={{width:'100%'}}>
				{this.renderCards()}
            </div>
		);
	}
}

Table.propTypes = {
	games: PropTypes.array.isRequired,
	gameId: PropTypes.string.isRequired,
	currentUser: PropTypes.object.isRequired,
};
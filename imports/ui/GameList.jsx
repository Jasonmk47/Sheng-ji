import React, { Component, PropTypes } from 'react';
import classnames from 'classnames';

export default class GameList extends Component {

    constructor(props) {
        super(props);

        this.state = {
            selected: null,
        };
    }

	// Switch the selected property
	toggleSelected(id) {
		console.log("toggling" + id)
		if (this.props.toggleToSelect(id)) {
			this.setState(previousState => ({
            	selected: id
        	})); 
		}
	    else
	    	console.log("Failed to select game");
  	}

    //Change to be identifiable. Maybe give each game a changeable name
    renderGames(){
        return this.props.games.map(game => { return (
            <li key={game._id} >
                <label>{game._id}
                <input onClick={() => this.toggleSelected(game._id)} type="checkbox"/>
                </label>
            </li>
        )});
    }

	render() {
		return <div> {this.renderGames()} </div>;
	}
}

GameList.propTypes = {
	games: PropTypes.array.isRequired,
	toggleToSelect: PropTypes.func.isRequired,
};


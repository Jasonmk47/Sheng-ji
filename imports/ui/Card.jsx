import React, { Component, PropTypes } from 'react';
import classnames from 'classnames';

export default class Card extends Component {

    constructor(props) {
        super(props);

        this.state = {
            selected: false,
        };
    }

	// Switch the selected property    
	toggleSelected() {
		if (this.props.toggleToPlay(this))
	    	this.setState({selected: !this.props.selected});
	    else
	    	conosle.log("Invalid card combination");
	    	//We can do rejection animations here
  	}

	render() {
	    // Give className to cards to highlight if selected
	    const cardClassName = classnames({
			selected: this.state.selected,
			name: "card",
	    });

		return (
			<div
				className={cardClassName}
				onClick={this.toggleSelected.bind(this)}>
				{this.props.card.name} of {this.props.card.suit} with {this.props.card.id}
			</div>
		);
	}
}

Card.propTypes = {
	card: PropTypes.object.isRequired,
	toggleToPlay: PropTypes.func.isRequired,
};
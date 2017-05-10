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
		if (this.props.toggleToPlay(this.props.card))
	    	this.setState({selected: !this.state.selected});
	    else
	    	conosle.log("Invalid card combination");
	    	//We can do rejection animations here
  	}

	render() {
	    // Give className to cards to highlight if selected
	    var cid = this.props.card.id;
	    const cardClassName = classnames({
			selected: this.state.selected,
			card: "card",
	    });

		return (
			<div>
				<div
					className={cardClassName + this.props.card.id}
					onClick={this.toggleSelected.bind(this)}>
					{this.props.card.name} of {this.props.card.suit} id: {this.props.card.id}
				</div>
				<img src={'3_of_clubs.png'}/>
			</div>
		);
	}
}

Card.propTypes = {
	card: PropTypes.object.isRequired,
	toggleToPlay: PropTypes.func.isRequired,
};
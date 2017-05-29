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
			card,
	    });

	    var name = this.props.card.suit + "";
	    var namelower = name.toLowerCase();
	    var cardpic = "/img/" + this.props.card.name + "_of_" + namelower + ".png";
		return (
			<div>
				<img className={cardClassName} 
					onClick={this.toggleSelected.bind(this)} 
					src={cardpic}/>
			</div>
		);
	}
}

Card.propTypes = {
	card: PropTypes.object.isRequired,
	toggleToPlay: PropTypes.func,
};
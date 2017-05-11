import React, { Component, PropTypes } from 'react';
import classnames from 'classnames';

export default class FriendList extends Component {

    constructor(props) {
        super(props);

        this.state = {
            selected: [],
        };
    }

	// Switch the selected property
	toggleSelected(id) {
		if (this.props.toggleToSelect(id)) {
			if (_.contains(this.state.selected, id)) {
		        var index = this.state.selected.indexOf(id);

	            this.setState((prevState) => ({
	                selected: prevState.selected.filter((_, i) => i !== index)
	            }));
			}
			else {				
				this.setState(previousState => ({
                	selected: previousState.selected.concat([id])
            	}));
			} 
		}
	    else
	    	console.log("Failed to select friend");
  	}

  	renderFriends() {
		return this.props.friends.map( friend => { 
	   
		    // Give className to cards to highlight if selected
		    const friendClassName = classnames({
				selected: _.contains(this.state.selected, friend._id),
				friend,
		    });

			return (
			<div
				key = {friend._id}
				className={friendClassName}
				onClick={() => this.toggleSelected(friend._id)}>
				{friend.username} with {friend._id} id is this friend.
			</div>
		)});
  	}

	render() {
		return <div> {this.renderFriends()} </div>;
	}
}

FriendList.propTypes = {
	friends: PropTypes.array.isRequired,
	toggleToSelect: PropTypes.func.isRequired,
};


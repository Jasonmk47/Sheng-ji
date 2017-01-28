import React, { Component, PropTypes } from 'react';
 

export default class Card extends Component {
	render() {
		return (
			<div class="card">7 Clubs</div>
		);
	}
}

Task.propTypes = {
  // This component gets the task to display through a React prop.
  // We can use propTypes to indicate it is required
  task: PropTypes.object.isRequired,
};
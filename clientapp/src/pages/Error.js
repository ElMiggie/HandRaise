import React, { Component } from 'react';

class Error extends Component {
  constructor(props) {
    super(props)
    this.state = {
      room: null,
    }
  }

  componentWillUnmount() {
    console.log("WEEEEE")
  }

  render() {
    return (
    <div className="body">
        <h1>
          404
        </h1>
    </div>
    );
  }
}
export default Error;

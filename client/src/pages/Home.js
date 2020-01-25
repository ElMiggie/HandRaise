import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import openSocket from 'socket.io-client';
const socket = openSocket('http://localhost:5000');
const axios = require('axios')

class Home extends Component {
  constructor(props) {
    super(props)
    this.state = {
      content: "",
      roomname: "",
      inroom: false
    }
  }

  getRes() {
    fetch('/api/getRes')
    .then(res => res.json())
    .then(content => this.setState({ content: content }))
  }

  joinRoom() {
    this.setState({inroom: true})
    socket.emit('join', this.state.roomname)
    fetch('/api/getRes')
    .then(res => res.json())
    .then(content => this.setState({ content: content }))
  }

  componentDidMount() {
    this.getRes();
    socket.emit('test');
  }

  handleChange(event) {
    this.setState({roomname: event.target.value});
  }

  handleSubmit(event) {
    event.preventDefault();
    this.joinRoom();
  }

  render() {
    if (!this.state.inroom) {
      return (
      <div style={{display: "flex", justifyContent: "center"}}>
        <div style={{width: "50%", textAlign: "center"}}>
          <h1>
          React Boilerplate
          </h1>
          <form onSubmit={this.handleSubmit.bind(this)}>
          <label>
            Name:
            <input type="text" value={this.state.value} onChange={(value) => this.handleChange(value)} />
          </label>
          <input type="submit" value="Submit" />
        </form>
          {this.state.content}
        </div>
      </div>
      );
    } else {
      return (
        <div>
          fdsf
        </div>
      )
    }
  }
}
export default Home;

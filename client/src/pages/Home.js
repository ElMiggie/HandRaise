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
      question: "",
      inroom: false,
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
  }

  createRoom() {
    this.setState({inroom: true})
    socket.emit('create')
  }

  componentDidMount() {
    this.getRes();
    socket.emit('create');
    socket.on('createcallback', function(name) {
      console.log(name)
    });
  }

  handleChange(event) {
    this.setState({roomname: event.target.value});
  }

  handleChangeQuestion(event) {
    this.setState({question: event.target.value});
  }

  handleSubmit(event) {
    event.preventDefault();
    this.joinRoom();
  }

  sendQuestion(event) {
    event.preventDefault();
    console.log("SENT")
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
            <input type="text" value={this.state.roomname} onChange={(value) => this.handleChange(value)} />
          </label>
          <input type="submit" value="Submit" />
        </form>
        <button onClick={() => this.createRoom()}>
        Create Room
        </button>
          {this.state.content}
        </div>
      </div>
      );
    } else {
      return (
        <div style={{display: "flex", justifyContent: "center"}}>
          <div style={{width: "50%", textAlign: "center"}}>
            <h1>
            Message
            </h1>
            <form onSubmit={this.sendQuestion.bind(this)}>
            <label>
              Message:
              <input type="text" value={this.state.question} onChange={(value) => this.handleChangeQuestion(value)} />
            </label>
            <input type="submit" value="Submit" />
          </form>
          <button onClick={() => this.sendQuestion()}>
          Create Room
          </button>
          </div>
        </div>
      )
    }
  }
}
export default Home;

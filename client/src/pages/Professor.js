import React, { Component } from 'react';
import { Button } from 'reactstrap';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import openSocket from 'socket.io-client';
import { withRouter } from 'react-router';
const socket = openSocket('http://localhost:5000');
const axios = require('axios')

// Make a room - look at the questions
class Professor extends Component {

  constructor(props) {
    super(props)
    this.state = {
      content: "",
      roomname: "",
      question: "",
      questions: []
    }
  }

  createRoom() {
    this.setState({inroom: true})
    socket.emit('create');
    socket.on('createcallback', (name) => {
      this.setState({roomname: name})
    })
  }

  registerVote(id) {
    var temparray = []
    for (var i = 0; i < this.state.questions.length; i++) {
      if (this.state.questions[i].id === id) {
        temparray.push({
          message: this.state.questions[i].message,
          votes: this.state.questions[i].votes + 1,
          id: id
        })
      } else {
        temparray.push(this.state.questions[i])
      }
    }
    this.setState({questions: temparray})
  }

  render() {
    // Should route us to student/professor choosing page
    return (
      <div style={{display: "flex", justifyContent: "center"}}>
        <div style={{width: "50%", textAlign: "center"}}>
          <h1>
          React Boilerplate
          </h1>
          <form noValidate autoComplete="off" onSubmit={this.handleSubmit.bind(this)}>
          <label>
            Name:
            <input type="text" value={this.state.roomname} onChange={(value) => this.handleChange(value)} />
          </label>
          <input type="submit" value="Submit" />
        </form>
        <Button variant="primary" onClick={this.createRoom.bind(this)}>
        Create Room
        </Button>
          {this.state.content}
        </div>
      </div>
      );
  }

}

export default withRouter(Professor);

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

class Student extends Component {
  constructor(props) {
    super(props)
    this.state = {
      content: "",
      roomname: "",
      question: "",
      inroom: false,
      questions: [],
      voted: []
    }
  }

  componentDidMount() {
    socket.on('messagesent', (message, id) => {
      this.setState({questions: this.state.questions.concat({message: message, votes: 0, id: id})})
      console.log(id)
      console.log(this.state.questions)
    })
    socket.on('votesent', (id) => {
      this.registerVote(id)
    })
  }

  handleChangeQuestion(event) {
    this.setState({question: event.target.value});
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

  voteQuestion(id) {
    if (!this.state.voted.includes(id)) {
      this.setState({voted: this.state.voted.concat(id)})
      socket.emit('vote', id, this.state.roomname);
    }
  }

  sendQuestion(event) {
    event.preventDefault();
    socket.emit('question', this.state.question, this.state.roomname);
    console.log("SENT")
  }

  render() {
      const listItems = this.state.questions.map((question, index) =>
        <div key={question.id}>
          <div>{question.message}</div>
          <div>Votes: {question.votes}</div>
          <button onClick={() => this.voteQuestion(question.id)}>vote</button>
        </div>
      );
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
          Create Room2
          </button>
          {listItems}
          </div>
        </div>
      )
  }
}

export default withRouter(Student);
